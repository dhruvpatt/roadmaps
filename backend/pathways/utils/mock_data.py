import random
from datetime import timedelta
from django.utils import timezone
from pathways.models import (
    Classroom, Unit, Week, Material, Test, Homework, CheckIn,
    Question, Comment, User, MaterialType, AssignmentSubmission
)
from pathways.models.deliverable import Assignment

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from io import BytesIO
from reportlab.pdfgen import canvas
from PIL import Image

from pathways.models import (
    Classroom, Unit, Week, Material, Test, Homework, CheckIn,
    Question, Comment, User, MaterialType, AssignmentSubmission,
    Analytics, DifficultyBreakdown
)

def create_mock_png_file(filename="demo.png", text="Hello!"):
    file_path = f"uploads/materials/{filename}"
    if not default_storage.exists(file_path):
        img = Image.new("RGB", (200, 80), color=(73, 109, 137))
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        file_content = ContentFile(buffer.read())
        default_storage.save(file_path, file_content)
    return default_storage.url(file_path)

def create_mock_txt_file(filename="demo.txt", content="This is a sample file!"):
    file_path = f"uploads/materials/{filename}"
    if not default_storage.exists(file_path):
        file_content = ContentFile(content.encode("utf-8"))
        default_storage.save(file_path, file_content)
    return default_storage.url(file_path)

def create_mock_pdf_file(filename="demo.pdf", text="Hello, this is a demo PDF."):
    file_path = f"uploads/materials/{filename}"
    if not default_storage.exists(file_path):
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, text)
        p.save()
        buffer.seek(0)
        file_content = ContentFile(buffer.read())
        default_storage.save(file_path, file_content)
    return default_storage.url(file_path)



def create_mock_materials_for_classroom(classroom, teachers=None, count_per_type=5):
    """
    Adds a batch of mock Material objects to a classroom and returns them.
    Ensures each material has at least a title or one content item.
    Details are only included if paired with a title or content.
    """
    if teachers is None:
        teachers = list(classroom.teachers.all())
        if not teachers:
            teachers = [User.objects.filter(role="teacher").first()]

    material_type_keys_labels = [
        ("file", "File"),
        ("link", "Link"),
        ("announcement", "Announcement"),
        ("general", "General"),
    ]

    type_objs = []
    for key, label in material_type_keys_labels:
        t, _ = MaterialType.objects.get_or_create(key=key, defaults={"label": label})
        type_objs.append(t)

    materials = []
    for i in range(count_per_type):
        teacher = random.choice(teachers)
        material_types = random.sample(type_objs, k=random.randint(1, 2))
        content = []

        # Populate content based on types
        for t in material_types:
            if t.key == "file":
                file_type = random.choice(["txt", "pdf", "png"])
                if file_type == "txt":
                    file_url = create_mock_txt_file(filename=f"material_{i+1}.txt", content=f"This is the content of file {i+1}.")
                    content.append({
                        "link": file_url,
                        "filename": f"material_{i+1}.txt",
                        "mimetype": "text/plain",
                        "type": "file",
                    })
                elif file_type == "pdf":
                    file_url = create_mock_pdf_file(filename=f"material_{i+1}.pdf", text=f"This is PDF {i+1}")
                    content.append({
                        "link": file_url,
                        "filename": f"material_{i+1}.pdf",
                        "mimetype": "application/pdf",
                        "type": "file",
                    })
                elif file_type == "png":
                    file_url = create_mock_png_file(filename=f"material_{i+1}.png")
                    content.append({
                        "link": file_url,
                        "filename": f"material_{i+1}.png",
                        "mimetype": "image/png",
                        "type": "file",
                    })
            elif t.key == "link":
                content.append({
                    "link": f"https://example.com/resource/{i+1}",
                    "filename": "",
                    "mimetype": "text/html",
                    "type": "link",
                })
            elif t.key == "announcement":
                content.append({
                    "type": "announcement",
                    "text": f"Announcement info for material {i+1}",
                })
            elif t.key == "general":
                content.append({
                    "type": "general",
                    "text": f"General info for material {i+1}",
                })

        has_content = bool(content)
        has_title = random.choice([True, False]) if has_content else True  # must have title if no content
        has_details = random.choice([True, False]) if has_title or has_content else False  # only allow details if paired

        title = f"Material {i+1}" if has_title else ""
        details = f"Details for material {i+1}" if has_details else ""

        material = Material.objects.create(
            title=title,
            details=details,
            created_by=teacher,
            classroom=classroom,
            content=content if has_content else [],
            likes=random.randint(0, 10),
        )
        material.types.set(material_types)
        material.save()
        materials.append(material)

    print(f"✅ Created {count_per_type} compliant mock materials for classroom '{classroom.name}'.")
    return materials

def create_mock_deliverables_for_classroom(materials, classroom_id: int, students: list[User] = None):
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        print(f"Classroom with id {classroom_id} not found.")
        return

    if students is None:
        students = list(classroom.students.all())

    teachers = list(classroom.teachers.all())
    mock_teacher = User.objects.filter(role="teacher").exclude(id__in=[t.id for t in teachers]).first()
    if mock_teacher and mock_teacher not in teachers:
        teachers.append(mock_teacher)
    for t in teachers:
        classroom.teachers.add(t)

    for student in students:
        easy = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)
        medium = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)
        hard = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)

        Analytics.objects.get_or_create(
            student=student,
            classroom=classroom,
            defaults={"easy": easy, "medium": medium, "hard": hard}
        )

    # for i in range(1, 3):
    #     unit = Unit.objects.create(
    #         name=f"Unit {i}",
    #         classroom=classroom,
    #         description=f"Unit {i} description"
    #     )
    #     for j in range(1, 3):
    #         Week.objects.create(unit=unit, learning_goal=f"Goal {i}.{j}")

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
        test.assigned_to.set(students)
        test.handouts.set(materials)

    # Now create other deliverables that reference materials:
    # for i in range(3):
    #     test = Test.objects.create(
    #         title=f"Test {i}",
    #         description="Test details",
    #         mandatory=True,
    #         points_possible=random.choice([20, 25, 30]),
    #         number_of_questions=5 + i,
    #         estimated_time=timedelta(minutes=30 + 5 * i),
    #         shuffle_questions=bool(i % 2),
    #         time_limit=timedelta(minutes=30),
    #         show_correct_answers=bool(i % 2)
    #     )
    #     test.save()
    #     test.assigned_to.set(students)
    #     test.handouts.set(materials)

    for i in range(3):
        hw = Homework.objects.create(
            type="homework",
            title=f"Homework {i}",
            details=f"Complete exercise set {i}",
            mandatory=True,
            out_of=10 + i * 5,
            estimated_time=timedelta(minutes=20 + 5 * i)
        )
        hw.assigned_to.set(students)
        hw.handouts.set(materials)
    # for i in range(3):
    #     hw = Homework.objects.create(
    #         title=f"Homework {i}",
    #         description=f"Complete exercise set {i}",
    #         mandatory=True,
    #         points_possible=10 + i * 5,
    #         estimated_time=timedelta(minutes=20 + 5 * i)
    #     )
    #     hw.save()
    #     hw.assigned_to.set(students)
    #     hw.handouts.set(materials)

    for i in range(2):
        checkin = CheckIn.objects.create(
            type="checkin",
            title=f"Check-In {i}",
            details="Wellness check",
            max_responses=3 + i
        )
        checkin.assigned_to.set(students)
        checkin.handouts.set(materials)
    # for i in range(2):
    #     checkin = CheckIn.objects.create(
    #         title=f"Check-In {i}",
    #         description="Wellness check",
    #         max_responses=3 + i
    #     )
    #     checkin.save()
    #     checkin.assigned_to.set(students)
    #     checkin.handouts.set(materials)

    # for i in range(5):
    #     Question.objects.create(
    #         content=f"What is {i} + {i}?",
    #         options=[str(2 * i), str(i), str(i + 1)],
    #         solution=str(2 * i),
    #         explanation="Basic math",
    #         points=1,
    #         type="mcq",
    #         difficulty=random.choice([1, 2, 3])
    #     )

    # for i in range(3):
    #     Comment.objects.create(
    #         content=f"This is comment {i}",
    #         posted_by=random.choice(students + teachers)
        # )

    print(f"✅ Successfully populated classroom '{classroom.name}' with full mock data (including deliverables and {len(materials)} materials).")
    print(
        f"✅ Successfully populated classroom '{classroom.name}' with full mock data (including deliverables and {len(materials)} materials).")

def create_mock_materials_for_classroom(classroom, teachers=None, count_per_type=5):
    """
    Adds a batch of valid Material objects with clean content rules:
    - Only one general
    - Only one announcement
    - Title and announcement are mutually exclusive
    """
    if teachers is None:
        teachers = list(classroom.teachers.all())
        if not teachers:
            teachers = [User.objects.filter(role="teacher").first()]

    material_type_keys_labels = [
        ("file", "File"),
        ("link", "Link"),
        ("announcement", "Announcement"),
        ("general", "General"),
    ]

    type_objs = []
    for key, label in material_type_keys_labels:
        t, _ = MaterialType.objects.get_or_create(key=key, defaults={"label": label})
        type_objs.append(t)

    materials = []
    for i in range(count_per_type):
        teacher = random.choice(teachers)
        material_types = random.sample(type_objs, k=random.randint(1, 2))
        content = []
        has_announcement = False
        has_general = False

        for t in material_types:
            if t.key == "file":
                file_type = random.choice(["txt", "pdf", "png"])
                if file_type == "txt":
                    url = create_mock_txt_file(f"material_{i+1}.txt")
                    content.append({
                        "link": url,
                        "filename": f"material_{i+1}.txt",
                        "mimetype": "text/plain",
                        "type": "file",
                    })
                elif file_type == "pdf":
                    url = create_mock_pdf_file(f"material_{i+1}.pdf")
                    content.append({
                        "link": url,
                        "filename": f"material_{i+1}.pdf",
                        "mimetype": "application/pdf",
                        "type": "file",
                    })
                elif file_type == "png":
                    url = create_mock_png_file(f"material_{i+1}.png")
                    content.append({
                        "link": url,
                        "filename": f"material_{i+1}.png",
                        "mimetype": "image/png",
                        "type": "file",
                    })

            elif t.key == "link":
                content.append({
                    "link": f"https://example.com/resource/{i+1}",
                    "filename": "",
                    "mimetype": "text/html",
                    "type": "link",
                })

            elif t.key == "announcement" and not has_announcement:
                content.append({
                    "type": "announcement",
                    "text": f"Announcement info for material {i+1}",
                })
                has_announcement = True

            elif t.key == "general" and not has_general:
                content.append({
                    "type": "general",
                    "text": f"General info for material {i+1}",
                })
                has_general = True

        # Ensure validation: title XOR announcement
        if has_announcement:
            title = ""
        else:
            # If no announcement, title is present (or random if you want sometimes no title and just other content)
            title = f"Material {i+1}"

        material = Material.objects.create(
            title=title,
            created_by=teacher,
            classroom=classroom,
            content=content,
            likes=random.randint(0, 10),
        )
        material.types.set(material_types)
        material.save()
        materials.append(material)

    print(f"✅ Created {count_per_type} clean mock materials for classroom '{classroom.name}'.")
    return materials

def create_mock_assignments_for_classroom(classroom, teachers=None, count=8):
    print(f"Starting to create {count} assignments for classroom: {classroom.name}")
    if teachers is None:
        teachers = list(classroom.teachers.all())
        if not teachers:
            teachers = [User.objects.filter(role="teacher").first()]
    print(f"Teachers available: {[t.get_full_name() for t in teachers]}")
    
    students = list(classroom.students.all())
    
    assignment_types = ['essay', 'project', 'homework']
    assignment_titles = {
        'essay': ['Argumentative Essay on Climate Change', 'Personal Narrative Essay', 'Compare and Contrast Essay'],
        'project': ['Science Fair Project', 'Group Research Project', 'Creative Portfolio'],
        'homework': ['Math Problem Set 1', 'Reading Assignment Ch. 3', 'Practice Exercises']
    }
    
    for i in range(count):
        assignment_type = random.choice(assignment_types)
        title = random.choice(assignment_titles[assignment_type]) + f" {i+1}"
        
        # Generate due dates - mix of past, current, and future
        now = timezone.now()
        if i < 2:  # 2 overdue assignments
            due_date = now - timedelta(days=random.randint(1, 7))
        elif i < 4:  # 2 due soon (within 24 hours)
            due_date = now + timedelta(hours=random.randint(1, 23))
        else:  # rest are future assignments
            due_date = now + timedelta(days=random.randint(2, 30))
        
        points_possible = random.choice([50, 75, 100, 150, 200])
        
        descriptions = {
            'essay': 'Write a well-structured essay with proper citations and arguments.',
            'project': 'Work individually or in groups to complete this comprehensive project.',
            'homework': 'Complete the assigned exercises and submit your work.'
        }
        
        instructions = {
            'essay': 'Your essay should be 3-5 pages, double-spaced, with at least 3 credible sources.',
            'project': 'Follow the project guidelines provided in class. Include a bibliography.',
            'homework': 'Show all your work. Partial credit will be given for correct methodology.'
        }
        
        assignment = Assignment.objects.create(
            title=title,
            description=descriptions[assignment_type],
            instructions=instructions[assignment_type],
            created_by=random.choice(teachers),
            classroom=classroom,
            due_date=due_date,
            points_possible=points_possible,
            assignment_type=assignment_type,
            is_published=True
        )

        for student in random.sample(students, k=random.randint(1, len(students))):
            AssignmentSubmission.objects.create(
                assignment=assignment,
                student=student,
                content={"text": f"Submission for {assignment.title}"},
                submitted_at=timezone.now(),
                grade=random.uniform(60, 100),
                feedback="Well done!",
                status="graded"
            )

    print(f"✅ Created {count} mock assignments for classroom '{classroom.name}'.")
