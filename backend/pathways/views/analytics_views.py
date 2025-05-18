# analytics_views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import User, Pathway


class StudentAnalyticsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            all_pathways = user.pathways.all()
            total = all_pathways.count()
            completed = 0
            active_pathways = 0

            for pathway in all_pathways:
                if all(ch.status == 'completed' for ch in pathway.chapters.all()):
                    completed += 1
                else:
                    active_pathways += 1

            return Response({
                "user": user.username,
                "total_pathways": total,
                "completed_pathways": completed,
                "active_pathways": active_pathways
            })
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TeacherAnalyticsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)

            if user.role != "teacher":
                return Response({"error": "User is not a teacher."}, status=status.HTTP_400_BAD_REQUEST)

            classrooms = user.teaching_classrooms.all()
            classroom_count = classrooms.count()

            # Get total number of students across classrooms
            student_ids = set()
            for classroom in classrooms:
                for student in classroom.students.all():
                    student_ids.add(student.id)
            total_students = len(student_ids)

            # Get only teacher's own pathways
            teacher_pathways = Pathway.objects.filter(owner=user)
            total_pathways = teacher_pathways.count()
            active_pathways = teacher_pathways.exclude(chapters__status='completed').distinct().count()

            return Response({
                "user": user.username,
                "classrooms": classroom_count,
                "total_students": total_students,
                "total_pathways": total_pathways,
                "active_pathways": active_pathways
            })

        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
