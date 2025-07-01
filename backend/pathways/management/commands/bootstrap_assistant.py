import requests
import numpy as np
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import uuid

from pathways.models import Classroom, Comment, Unit, Week, Material
from pathways.utils.mock_users import attach_mock_students_to_classroom
from pathways.utils.mock_data import (
    create_mock_materials_for_classroom,
    create_mock_deliverables_for_classroom
)
from pathways.utils.assistant.vector_index import (
    get_rendered_dom_html,  # ✅ new method (replaces get_text_from_url)
    chunk_text,
    embed_texts,
    save_index_and_store,
    teacher_index,
    student_index,
    teacher_doc_store,
    student_doc_store
)

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "http://localhost:8000/api/login/"

TEACHER_USERNAME = "mockbot_teacher"
STUDENT_USERNAME = "mockbot_student"
MOCK_PASSWORD = "mockpassword123"
def MOCK_EMAIL(role): return f"{role}@mock.local"

MOCK_CLASSROOM_NAME = "Mock Assistant Classroom"

class Command(BaseCommand):
    help = "Create mock classroom, content, and index site pages for assistant vector search"

    def extract_cookies(self, session):
        return [
            {
                "name": c.name,
                "value": c.value,
                "domain": "localhost",
                "path": c.path,
                "httpOnly": True,
                "secure": False,
                "sameSite": "Lax"
            }
            for c in session.cookies
        ]

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help="Force re-bootstrap and delete existing mock data")

    def handle(self, *args, **options):
        if options['force']:
            self.stdout.write("⚠️ Force option enabled. Cleaning existing mock data...")
            self.clean_mock_data()

        if Classroom.objects.filter(name=MOCK_CLASSROOM_NAME).exists():
            self.stdout.write(self.style.WARNING("⚠️ Assistant bootstrap already done. Skipping. Use --force to reset."))
            return

        self.stdout.write(self.style.SUCCESS("🚀 Bootstrapping assistant..."))

        teacher = self.get_or_create_mock_user(TEACHER_USERNAME, "teacher")
        student = self.get_or_create_mock_user(STUDENT_USERNAME, "student")
        classroom = self.create_mock_classroom(teacher)

        teacher_session = self.authenticate_session(TEACHER_USERNAME)
        cookies = self.extract_cookies(teacher_session)

        role = "teacher"
        doc_store = teacher_doc_store
        index_obj = teacher_index

        for tab in ["stream", "materials", "assignments", "tests", "gradebook", "students", "attendance", "curriculum"]:
            url = f"{BASE_URL}/classroom/{classroom.id}?tab={tab}"
            self.stdout.write(f"🌐 Indexing [{role.upper()}] {url}")

            html = get_rendered_dom_html(url, cookies=cookies)

            if not html.strip():
                self.stderr.write(f"❌ Failed to index [{role}] {url}: No content returned.")
                continue

            try:
                self.index_html_generic(url, html, index_obj, doc_store)
            except Exception as e:
                self.stderr.write(f"❌ Failed to index [{role}] {url}: {e}")

        self.stdout.write(self.style.SUCCESS("✅ Assistant bootstrap complete."))
        save_index_and_store(teacher_index, teacher_doc_store, "teacher")

    def get_or_create_mock_user(self, username, role):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": MOCK_EMAIL(role),
                "role": role,
                "first_name": "Mock",
                "last_name": role.title(),
            }
        )
        if created:
            user.set_password(MOCK_PASSWORD)
            user.save()
        return user

    def create_mock_classroom(self, teacher):
        classroom = Classroom.objects.create(
            name=MOCK_CLASSROOM_NAME,
            join_id=f"mock-{uuid.uuid4().hex[:8]}",
            details="Auto-generated for assistant vector indexing."
        )
        classroom.teachers.add(teacher)
        students = attach_mock_students_to_classroom(classroom, number_of_students=10)
        materials = create_mock_materials_for_classroom(classroom, teachers=[teacher], count_per_type=5)
        if not materials:
            raise Exception("❌ No materials created — cannot continue bootstrap.")
        create_mock_deliverables_for_classroom(materials, classroom.id, students=students)
        return classroom

    def authenticate_session(self, username):
        session = requests.Session()
        res = session.post(LOGIN_ENDPOINT, json={
            "username": username,
            "password": MOCK_PASSWORD
        })
        if res.status_code != 200:
            raise Exception(f"Login failed for {username}: {res.text}")
        return session

    def index_html_generic(self, url, html, index_store, doc_store_ref):
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        [s.extract() for s in soup(["script", "style", "nav", "footer", "header", "noscript"])]
        text = soup.get_text(separator=" ", strip=True)

        chunks = chunk_text(text)
        embeddings = embed_texts(chunks)
        vectors = np.array(embeddings).astype("float32")
        index_store.add(vectors)

        for i, chunk in enumerate(chunks):
            doc_store_ref[len(doc_store_ref)] = {
                "url": url,
                "content": chunk,
                "raw_html": html if i == 0 else None
            }

    def clean_mock_data(self):
        User = get_user_model()
        try:
            classroom = Classroom.objects.filter(name=MOCK_CLASSROOM_NAME).first()
            if classroom:
                Comment.objects.filter(material__classroom=classroom).delete()
                Material.objects.filter(classroom=classroom).delete()
                Unit.objects.filter(classroom=classroom).delete()
                Week.objects.filter(unit__classroom=classroom).delete()
                classroom.delete()

            User.objects.filter(username__in=[TEACHER_USERNAME, STUDENT_USERNAME]).delete()
            self.stdout.write("🧹 Mock data cleaned.")
        except Exception as e:
            self.stderr.write(f"❌ Failed to clean data: {e}")
