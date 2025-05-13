# analytics_views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import User, Roadmap


class StudentAnalyticsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            all_roadmaps = user.roadmaps.all()
            total = all_roadmaps.count()
            completed = 0
            active_roadmaps = 0

            for roadmap in all_roadmaps:
                if all(ch.status == 'completed' for ch in roadmap.chapters.all()):
                    completed += 1
                else:
                    active_roadmaps += 1

            return Response({
                "user": user.username,
                "total_roadmaps": total,
                "completed_roadmaps": completed,
                "active_roadmaps": active_roadmaps
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

            # Get only teacher's own roadmaps
            teacher_roadmaps = Roadmap.objects.filter(owner=user)
            total_roadmaps = teacher_roadmaps.count()
            active_pathways = teacher_roadmaps.exclude(chapters__status='completed').distinct().count()

            return Response({
                "user": user.username,
                "classrooms": classroom_count,
                "total_students": total_students,
                "total_roadmaps": total_roadmaps,
                "active_pathways": active_pathways
            })

        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
