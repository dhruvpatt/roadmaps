import random
import string
from django.contrib.auth import get_user_model
from pathways.models import Classroom, Analytics, DifficultyBreakdown
User = get_user_model()

ADJECTIVES = [
    "quick", "lazy", "sleepy", "noisy", "brave", "jolly", "proud", "witty",
    "curious", "clever", "zany", "bouncy", "grumpy", "fuzzy", "sneaky", "shiny",
    "fierce", "gentle", "tiny", "giant", "loyal", "chatty", "quirky", "spunky",
    "glowy", "rusty", "cheery", "frosty", "stormy", "dusty", "sunny", "peppy"
]

NOUNS = [
    "lion", "panda", "tiger", "eagle", "shark", "wizard", "ninja", "robot",
    "dragon", "fox", "otter", "raven", "badger", "koala", "goblin", "phoenix",
    "cheetah", "viking", "pirate", "mermaid", "elf", "sloth", "walrus", "monkey",
    "sphinx", "orc", "ferret", "coyote", "unicorn", "griffin", "yeti", "kangaroo"
]

MOCK_EMAIL_DOMAIN = "mockstudent.local"


def generate_mock_username():
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{adj}_{noun}_{suffix}"


def get_or_create_mock_students(required_count=10):
    """
    Return a list of mock student User instances.
    If there aren't enough, create more.
    """
    mock_students = list(User.objects.filter(
        email__endswith=f"@{MOCK_EMAIL_DOMAIN}", role="student"))

    while len(mock_students) < required_count:
        attempts = 0
        while True:
            username = generate_mock_username()
            if not User.objects.filter(username=username).exists() or attempts == len(ADJECTIVES) * len(NOUNS) - 1:
                break
            else:
                attempts += 1
        email = f"{username}@{MOCK_EMAIL_DOMAIN}"
        user = User.objects.create_user(
            username=username,
            email=email,
            password="test1234",
            first_name=username.split("_")[0].capitalize(),
            last_name=username.split("_")[1].capitalize(),
            grade=random.randint(1, 12),
            age=random.randint(10, 18),
            role="student"
        )
        mock_students.append(user)

    return mock_students[:required_count]


def attach_mock_students_to_classroom(classroom, number_of_students=10):
    mock_students = get_or_create_mock_students(required_count=number_of_students)
    
    for student in mock_students:
        classroom.students.add(student)

        # Create difficulty breakdowns
        easy = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)
        medium = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)
        hard = DifficultyBreakdown.objects.create(count=0, accuracy=0.0)

        # Create Analytics if one doesn't exist
        Analytics.objects.get_or_create(
            student=student,
            classroom=classroom,
            defaults={
                "easy": easy,
                "medium": medium,
                "hard": hard,
            }
        )

    return mock_students
