from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from pathways.models import Classroom, Session, Attendance
from pathways.serializers.user_serializer import SessionSerializer, AttendanceSerializer
from datetime import date
from datetime import timedelta
def user_can_edit(user, classroom):
    return user in classroom.teachers.all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_dashboard(request, classroom_id):
    """Get attendance data for the dashboard"""
    classroom = get_object_or_404(Classroom, id=classroom_id)
    if request.user not in classroom.teachers.all() and not user_can_edit(request.user, classroom):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    sessions = Session.objects.filter(classroom=classroom).order_by('-date')
    students = classroom.students.all()
    
    students_data = []
    for student in students:
        attendance_records = Attendance.objects.filter(
            student=student, 
            session__in=sessions
        ).select_related('session')
        
        attendance_dict = {record.session_id: record.status for record in attendance_records}
        
        students_data.append({
            'id': student.id,
            'name': f"{student.first_name} {student.last_name}",
            'attendance': attendance_dict
        })
    
    return Response(students_data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sessions_view(request, classroom_id):
    classroom = get_object_or_404(Classroom, id=classroom_id)

    if request.user not in classroom.students.all() and not user_can_edit(request.user, classroom):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
    # grab either ?week_start= or ?week=

        week_param = (request.GET.get("week") or "").rstrip("/")
        print(f"Week param: {week_param}")
        if not week_param:
            return Response(
                {'detail': 'Missing week_start (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            start = date.fromisoformat(week_param)
        except ValueError:
            return Response(
                {'detail': f'Invalid date format "{week_param}", expected YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        end = start + timedelta(days=6)

        # 2. build list of Mon–Fri dates
        weekdays = [
            start + timedelta(days=offset)
            for offset in range(7)
            if (start + timedelta(days=offset)).weekday() < 5
        ]

        sessions = []
        for day in weekdays:
            # 3. get_or_create a Session for each weekday
            session, created = Session.objects.get_or_create(
                classroom=classroom,
                date=day,
                defaults={'topic': ''}   # or your default topic
            )
            if created:
                # initialize attendance for new session
                Attendance.objects.bulk_create([
                    Attendance(student=stud, session=session, status='present')
                    for stud in classroom.students.all()
                ])
            sessions.append(session)

        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        session_data = {
            'date': request.data.get('date'),
            'topic': request.data.get('topic', ''),
            'classroom': classroom.id
        }

        serializer = SessionSerializer(data=session_data)
        if serializer.is_valid():
            session = serializer.save()

            # Initialize attendance
            records = [
                Attendance(student=student, session=session, status='present')
                for student in classroom.students.all()
            ]
            Attendance.objects.bulk_create(records)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_attendance(request, classroom_id, session_id):
    """Patch one student's attendance status in a given session."""
    classroom = get_object_or_404(Classroom, id=classroom_id)
    session = get_object_or_404(Session, id=session_id, classroom=classroom)

    if not user_can_edit(request.user, classroom):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('student')
    status_val = request.data.get('status')

    if not student_id or not status_val:
        return Response(
            {'detail': 'Both student and status are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_statuses = ['present', 'late', 'absent', 'excused']
    if status_val not in valid_statuses:
        return Response(
            {'detail': f'Invalid status. Valid: {valid_statuses}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    attendance_record, created = Attendance.objects.get_or_create(
        session=session,
        student_id=student_id,
        defaults={'status': status_val}
    )
    if not created:
        attendance_record.status = status_val
        attendance_record.save()

    return Response({'status': attendance_record.status, 'created': created})

