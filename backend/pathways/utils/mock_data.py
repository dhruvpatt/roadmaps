import random
from datetime import timedelta
from django.utils import timezone
from pathways.models import (
    Classroom, Unit, Week, Material, Test, Homework, CheckIn,
    Question, Comment, User, MaterialType
)

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from io import BytesIO
from reportlab.pdfgen import canvas


from PIL import Image
from io import BytesIO

def create_mock_png_file(filename="demo.png", text="Hello!"):
    file_path = f"uploads/materials/{filename}"
    if not default_storage.exists(file_path):
        img = Image.new("RGB", (200, 80), color=(73, 109, 137))
        # You could add text with PIL.ImageDraw, but simple blank is fine for UI
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
    Each material gets one or more types assigned.
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
        t, _ = MaterialType.objects.get_or_create(
            key=key, defaults={"label": label})
        type_objs.append(t)

    materials = []
    for i in range(count_per_type):
        material_types = random.sample(type_objs, k=random.randint(1, 2))
        teacher = random.choice(teachers)
        title = f"Material {i+1}"
        details = f"Details for material {i+1}"
        content = []

        for t in material_types:
            if t.key == "file":
                # Randomly choose a file type for the demo
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
    
        if not content:
            content = [{"text": f"Default info for material {i+1}"}]

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
        materials.append(material)
        
    print(
        f"✅ Created {count_per_type} mock materials for classroom '{classroom.name}'.")
    return materials


def create_mock_deliverables_for_classroom(materials, classroom_id: int, students: list[User] = None):
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        print(f"Classroom with id {classroom_id} not found.")
        return

    if students is None:
        students = list(classroom.students.all())

    # Make sure teachers are present
    teachers = list(classroom.teachers.all())
    mock_teacher = User.objects.filter(role="teacher").exclude(
        id__in=[t.id for t in teachers]).first()
    if mock_teacher and mock_teacher not in teachers:
        teachers.append(mock_teacher)
    for t in teachers:
        classroom.teachers.add(t)

    # Add Units and Weeks (optional, but kept for demo)
    for i in range(1, 3):
        unit = Unit.objects.create(
            name=f"Unit {i}",
            classroom=classroom,
            description=f"Unit {i} description"
        )
        for j in range(1, 3):
            Week.objects.create(unit=unit, learning_goal=f"Goal {i}.{j}")


    # Now create other deliverables that reference materials:
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

    for i in range(3):
        Comment.objects.create(
            content=f"This is comment {i}",
            posted_by=random.choice(students + teachers)
        )

    print(
        f"✅ Successfully populated classroom '{classroom.name}' with full mock data (including deliverables and {len(materials)} materials).")
