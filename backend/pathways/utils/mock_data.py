import random
from datetime import timedelta
from django.utils import timezone
from pathways.models import (
    Classroom, Unit, Week, Material, Test, Homework, CheckIn, Resource,
    Question, Comment, User
)

def populate_mock_data_for_classroom(classroom_id: int, students: list[User] = None):
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        print(f"Classroom with id {classroom_id} not found.")
        return

    if students is None:
        students = list(classroom.students.all())

    teachers = list(User.objects.filter(role="teacher")[:1])
    if not teachers:
        teachers = [
            User.objects.create(username="teacher1", email="t1@test.com", role="teacher")
        ]

    classroom.teachers.set(teachers)
    classroom.teachers.set(teachers)

    # Add Units and Weeks
    for i in range(1, 3):
        unit = Unit.objects.create(
            name=f"Unit {i}",
            classroom=classroom,
            description=f"Unit {i} description"
        )
        for j in range(1, 3):
            Week.objects.create(unit=unit, learning_goal=f"Goal {i}.{j}")

    # Create 5 Materials of each type
    material_types = ["file", "url", "announcement", "general"]
    materials = []
    for mtype in material_types:
        for i in range(5):
            material = Material.objects.create(
                type=mtype,
                title=f"{mtype.capitalize()} Material {i}",
                details=f"Details for {mtype} material {i}",
                created_by=random.choice(teachers)
            )
            materials.append(material)
            classroom.stream.add(material)

    # Create Tests (3 total)
    for i in range(3):
        test = Test.objects.create(
            type="test",
            title=f"Test {i}",
            details="Test details",
            mandatory=True,
            out_of=random.choice([20, 25, 30]),
            number_of_questions=5 + i,
            estimated_time=timedelta(minutes=30 + 5 * i),
            shuffle_questions=bool(i % 2),
            time_limit=timedelta(minutes=30),
            show_correct_answers=bool(i % 2)
        )
        test.save()
        test.assigned_to.set(students)
        test.handouts.set(materials)

    # Create Homeworks (3 total)
    for i in range(3):
        hw = Homework.objects.create(
            type="homework",
            title=f"Homework {i}",
            details=f"Complete exercise set {i}",
            mandatory=True,
            out_of=10 + i * 5,
            estimated_time=timedelta(minutes=20 + 5 * i)
        )
        hw.save()
        hw.assigned_to.set(students)
        hw.handouts.set(materials)

    # Create CheckIns (2 total)
    for i in range(2):
        checkin = CheckIn.objects.create(
            type="checkin",
            title=f"Check-In {i}",
            details="Wellness check",
            max_responses=3 + i
        )
        checkin.save()
        checkin.assigned_to.set(students)
        checkin.handouts.set(materials)

    # Create 5 Resources
    for i in range(5):
        res = Resource.objects.create(
            type="resource",
            title=f"Resource {i}",
            details=f"Supplementary material {i}"
        )
        res.save()
        res.handouts.set(materials)

    # Add Questions (5 total)
    for i in range(5):
        Question.objects.create(
            content=f"What is {i} + {i}?",
            options=[str(2 * i), str(i), str(i + 1)],
            solution=str(2 * i),
            explanation="Basic math",
            points=1,
            type="mcq",
            difficulty=random.choice([1, 2, 3])
        )

    # Add Comments (3 total)
    for i in range(3):
        Comment.objects.create(
            content=f"This is comment {i}",
            posted_by=random.choice(students + teachers)
        )

    print(f"✅ Successfully populated classroom '{classroom.name}' with full mock data (including 5 resources and 20 materials).")
