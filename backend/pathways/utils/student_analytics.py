from datetime import timedelta
from django.db.models import Avg, Count, F, Q, Sum
from django.utils import timezone

from pathways.models.classroom import (
    ClassroomAssignment,
    AssignmentSubmission,
    MaterialView,
    MaterialType,
    Comment,
)
from pathways.models.user import Attendance
from pathways.models.analytics import Analytics


def calculate_student_analytics(*, student, classroom) -> dict:
    """
    Compute the dashboard metrics expected by ClassroomStudents.jsx.
    All queries are scoped to a single classroom to avoid accidental leakage.

    Returns a dict whose keys EXACTLY match the mock data structure used
    by the React component so it can be dropped in without UI changes.
    """

    # ── Assignments & quizzes ──────────────────────────────────────────
    assignments_qs = ClassroomAssignment.objects.filter(
        classroom=classroom, is_published=True
    )
    total_assignments = assignments_qs.count()

    submissions_qs = AssignmentSubmission.objects.filter(
        assignment__classroom=classroom, student=student
    )

    completed_assignments = submissions_qs.exclude(status="missing").count()
    assignment_completion_rate = (
        completed_assignments / total_assignments if total_assignments else 0.0
    )

    quiz_grades = (
        submissions_qs.filter(assignment__assignment_type="quiz")
        .exclude(grade__isnull=True)
        .values_list("grade", flat=True)
    )
    average_quiz_score = (
        sum(quiz_grades) / len(quiz_grades) if quiz_grades else 0
    )

    # ── Material consumption & resources ──────────────────────────────
    views_qs = MaterialView.objects.filter(
        user=student, material__classroom=classroom
    )

    total_time_spent_seconds = views_qs.aggregate(
        s=Sum("time_viewed")
    )["s"] or timedelta(0)

    total_time_spent_hours = round(total_time_spent_seconds.total_seconds() / 3600)

    forum_posts_count = Comment.objects.filter(
        posted_by=student, material__classroom=classroom
    ).count()

    # Count “live” sessions attended (anything except 'absent')
    live_session_attendance = Attendance.objects.filter(
        student=student, session__classroom=classroom
    ).exclude(status="absent").count()

    # Average response time = delta between assignment publish and submission
    avg_response_delta = submissions_qs.annotate(
        created=F("assignment__created_at")
    ).aggregate(
        avg=Avg(F("submitted_at") - F("created"))
    )["avg"] or timedelta(0)

    average_response_time_mins = round(avg_response_delta.total_seconds() / 60)

    # Files downloaded
    file_type_ids = list(
        MaterialType.objects.filter(key="file").values_list("id", flat=True)
    )
    resources_downloaded = views_qs.filter(material__types__id__in=file_type_ids).count()

    # ── Peer review placeholder (hook it up later) ────────────────────
    peer_review_given = 0

    # ── Topics mastered / struggled ───────────────────────────────────
    # If you store per-student Analytics rows on Unit/Week, grab the latest one:
    personal_analytics = (
        Analytics.objects.filter(student=student, classroom=classroom)
        .order_by("-id")
        .first()
    )

    mastered_topics = personal_analytics.mastered_topics if personal_analytics else []
    struggled_topics = personal_analytics.struggled_topics if personal_analytics else []

    # ── Recent activity & next due assignment ─────────────────────────
    latest_submission = submissions_qs.order_by("-submitted_at").first()
    latest_view = views_qs.order_by("-last_viewed").first()

    recent_activity = ""
    if latest_submission and latest_view:
        recent_activity = (
            f"Submitted {latest_submission.assignment.title}"
            if latest_submission.submitted_at > latest_view.last_viewed
            else f"Viewed {latest_view.material.title}"
        )
    elif latest_submission:
        recent_activity = f"Submitted {latest_submission.assignment.title}"
    elif latest_view:
        recent_activity = f"Viewed {latest_view.material.title}"

    next_due = (
        assignments_qs.exclude(id__in=submissions_qs.values("assignment"))
        .order_by("due_date")
        .first()
    )
    next_due_assignment = (
        f"{next_due.title} – Due {next_due.due_date:%b %d}"
        if next_due
        else ""
    )

    # ── Assemble final payload ────────────────────────────────────────
    return {
        "assignmentCompletionRate": assignment_completion_rate,
        "averageQuizScore": round(average_quiz_score),
        "totalTimeSpentHours": total_time_spent_hours,
        "forumPostsCount": forum_posts_count,
        "liveSessionAttendance": live_session_attendance,
        "averageResponseTimeMins": average_response_time_mins,
        "resourcesDownloaded": resources_downloaded,
        "peerReviewGiven": peer_review_given,
        "strugglingTopics": struggled_topics,
        "strongTopics": mastered_topics,
        "recentActivity": recent_activity,
        "nextDueAssignment": next_due_assignment,
    }
