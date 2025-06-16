import random
from datetime import timedelta
from django.utils import timezone
from pathways.models import (
    Classroom, Unit, Week, Material, Test, Homework, CheckIn, Resource,
    Question, Comment, User, MaterialType
)

def populate_mock_data_for_classroom(classroom_id: int, students: list[User] = None):
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        print(f"Classroom with id {classroom_id} not found.")
        return

    if students is None:
        students = list(classroom.students.all())

    # Always keep the existing teachers (including creator!)
    teachers = list(classroom.teachers.all())
    # Optionally, add a mock teacher if not already present (for demo data variety)
    mock_teacher = User.objects.filter(role="teacher").exclude(id__in=[t.id for t in teachers]).first()
    if mock_teacher and mock_teacher not in teachers:
        teachers.append(mock_teacher)
    # Add any missing teachers, but DON'T overwrite!
    for t in teachers:
        classroom.teachers.add(t)  # This is safe, does not duplicate


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
        mtype_obj = MaterialType.objects.get(key=mtype)  # get the MaterialType instance
        for i in range(5):
            chosen_types = random.sample(list(MaterialType.objects.all()), k=random.randint(1, 2))  # 1 or 2 types
            material = Material.objects.create(
                title=f"Material {i}",
                details=f"Details for material {i}",
                created_by=random.choice(teachers),
                classroom=classroom,
            )
            material.types.set(chosen_types)
            material.save()
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

def create_mock_materials_for_classroom(classroom, teachers=None, count_per_type=5):
    """
    Adds a batch of mock Material objects to a classroom.
    Each material gets one or more types assigned.
    """
    if teachers is None:
        teachers = list(classroom.teachers.all())
        if not teachers:
            teachers = [User.objects.filter(role="teacher").first()]

    # Ensure MaterialTypes exist (skip if already exists)
    material_type_keys_labels = [
        ("file", "File"),
        ("url", "URL"),
        ("announcement", "Announcement"),
        ("general", "General"),
    ]
    type_objs = []
    for key, label in material_type_keys_labels:
        t, _ = MaterialType.objects.get_or_create(key=key, defaults={"label": label})
        type_objs.append(t)

    # Create Materials
    for i in range(count_per_type):
        # Pick 1-2 random types for this material
        if i % 2 == 0:
            material_types = random.sample(type_objs, k=1)
        else:
            material_types = random.sample(type_objs, k=2)
        teacher = random.choice(teachers)
        title = f"Material {i+1}"
        details = f"Details for material {i+1}"
        content = []
        # Example file/url for 'file' or 'url'
        if any(t.key == "file" for t in material_types):
            content = [{
                "url": f"https://files.example.com/material_{i+1}.pdf",
                "filename": f"material_{i+1}.pdf",
                "mimetype": "application/pdf",
            }]
        elif any(t.key == "url" for t in material_types):
            content = [{
                "url": f"https://example.com/resource/{i+1}",
                "filename": "",
                "mimetype": "text/html",
            }]
        # Create the material
        material = Material.objects.create(
            title=title,
            details=details,
            created_by=teacher,
            classroom=classroom,
            content=content,
            likes=random.randint(0, 10),
        )
        material.types.set(material_types)
        material.save()
    print(f"✅ Created {count_per_type} mock materials for classroom '{classroom.name}'.")