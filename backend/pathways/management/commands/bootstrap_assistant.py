import requests
import numpy as np
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from bs4 import BeautifulSoup

from pathways.models import Classroom, Comment, Unit, Week, Material
from pathways.utils.mock_users import attach_mock_students_to_classroom
from pathways.utils.mock_data import (
    create_mock_materials_for_classroom,
    create_mock_deliverables_for_classroom
)
from pathways.utils.assistant.vector_index import index, doc_store, embed_texts, chunk_text

MOCK_USERNAME = "mockbot_admin"
MOCK_PASSWORD = "mockpassword123"
MOCK_EMAIL = "mockbot@mock.local"
MOCK_CLASSROOM_NAME = "Mock Assistant Classroom"
BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "http://localhost:8000/api/login/"

class Command(BaseCommand):
    help = "Create mock classroom, content, and index site pages for assistant vector search"

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

        user = self.get_or_create_mock_admin()
        classroom = self.create_mock_classroom(user)
        session = self.authenticate_session()

        for url in self.generate_urls(classroom):
            try:
                self.stdout.write(f"🌐 Indexing {url}")
                html = self.fetch_page(session, url)
                self.index_html(url, html)
            except Exception as e:
                self.stderr.write(f"❌ Failed to index {url}: {e}")

        self.stdout.write(self.style.SUCCESS("✅ Assistant bootstrap complete."))

    def get_or_create_mock_admin(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=MOCK_USERNAME,
            defaults={
                "email": MOCK_EMAIL,
                "role": "teacher",
                "first_name": "Mock",
                "last_name": "Bot",
                "is_staff": True,
            }
        )
        if created:
            user.set_password(MOCK_PASSWORD)
            user.save()
        return user

    def create_mock_classroom(self, teacher):
        classroom = Classroom.objects.create(
            name=MOCK_CLASSROOM_NAME,
            join_id="mock-join-id",
            details="Auto-generated for assistant vector indexing."
        )
        classroom.teachers.add(teacher)

        students = attach_mock_students_to_classroom(classroom, number_of_students=10)
        materials = create_mock_materials_for_classroom(classroom, teachers=[teacher], count_per_type=5)
        create_mock_deliverables_for_classroom(materials, classroom.id, students=students)

        return classroom

    def authenticate_session(self):
        session = requests.Session()
        res = session.post(LOGIN_ENDPOINT, json={
            "username": MOCK_USERNAME,
            "password": MOCK_PASSWORD
        })

        if res.status_code != 200:
            raise Exception(f"Login failed: {res.text}")
        return session

    def fetch_page(self, session, url):
        res = session.get(url)
        res.raise_for_status()
        return res.text

    def index_html(self, url, html):
        soup = BeautifulSoup(html, "html.parser")
        [s.extract() for s in soup(["script", "style", "nav", "footer", "header"])]
        text = soup.get_text(separator=" ", strip=True)

        chunks = chunk_text(text)
        embeddings = embed_texts(chunks)
        vectors = np.array(embeddings).astype("float32")
        index.add(vectors)

        for i, chunk in enumerate(chunks):
            doc_store[len(doc_store)] = {"url": url, "content": chunk}

    def generate_urls(self, classroom):
        return [
            f"{BASE_URL}/classrooms/{classroom.id}",
            f"{BASE_URL}/classrooms/{classroom.id}/materials",
            f"{BASE_URL}/classrooms/{classroom.id}/dashboard",
            f"{BASE_URL}/classrooms/{classroom.id}/curriculum",
            f"{BASE_URL}/classrooms/{classroom.id}/students",
        ]

    def clean_mock_data(self):
        User = get_user_model()
        try:
            # Delete classroom and cascade
            classroom = Classroom.objects.filter(name=MOCK_CLASSROOM_NAME).first()
            if classroom:
                Comment.objects.filter(material__classroom=classroom).delete()
                Material.objects.filter(classroom=classroom).delete()
                Unit.objects.filter(classroom=classroom).delete()
                Week.objects.filter(unit__classroom=classroom).delete()
                classroom.delete()

            # Delete the mock user
            User.objects.filter(username=MOCK_USERNAME).delete()

            self.stdout.write("🧹 Mock data cleaned.")
        except Exception as e:
            self.stderr.write(f"❌ Failed to clean data: {e}")
