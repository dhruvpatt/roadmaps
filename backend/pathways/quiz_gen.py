import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from google import genai
from google.genai import types
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Module, User, Quiz, Question
from django.conf import settings
import json

# Gemini API key setup
api_key = getattr(settings, 'LLM_API_KEY')
client = genai.Client(api_key=api_key)

def clean_response(response):
    splitted = response.split('```json')
    if len(splitted) < 2:
        raise ValueError("No JSON part found in the input string.")

    # Extract the JSON part and remove trailing backticks
    return splitted[1].split('```')[0].strip()

def bulk_ai_grade_text_answers(questions):
    prompt_items = "\n".join([
        f"Question: {q['question']}\nCorrect Answer: {q['solution']}\nStudent Answer: {q['answer']}" for q in questions
    ])
    prompt = f"""
    Evaluate the following student's answers to a quiz. For each item, respond with either 'correct' or 'incorrect' in order.

    {prompt_items}

    Format the result as a JSON list:
    ["correct", "incorrect", ...]
    """
    config = types.GenerateContentConfig(temperature=0.3)
    response = client.models.generate_content(
        model='gemini-2.0-flash-lite-preview',
        contents=prompt,
        config=config
    )
    try:
        result = json.loads(clean_response(response.text))
        return result
    except Exception as e:
        raise ValueError(f"AI grading failed: {e}")

class QuizEvaluationAPIView(APIView):
    def post(self, request):
        quiz_id = request.data.get("quiz_id")
        user_answers = request.data.get("answers")  # { question_id: answer }

        if not quiz_id or not user_answers:
            return Response({"error": "quiz_id and answers are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz = Quiz.objects.get(pk=quiz_id)
            total = quiz.questions.count()
            correct = 0
            failed_questions = []

            text_questions = []
            text_index_map = {}

            for question in quiz.questions.all():
                submitted = user_answers.get(str(question.id), "").strip()
                question.answer = submitted
                question.save()

                if question.type == 'text':
                    text_index_map[question.id] = len(text_questions)
                    text_questions.append({
                        "question": question.question,
                        "solution": question.solution,
                        "answer": submitted
                    })

            ai_results = bulk_ai_grade_text_answers(text_questions) if text_questions else []

            for question in quiz.questions.all():
                if question.type == 'text':
                    idx = text_index_map.get(question.id)
                    is_correct = ai_results[idx] == 'correct' if idx is not None and idx < len(ai_results) else False
                else:
                    submitted = question.answer.strip().lower()
                    correct_answer = question.solution.strip().lower()
                    is_correct = submitted == correct_answer

                if is_correct:
                    correct += 1
                else:
                    failed_questions.append(question)

            quiz.failed_questions.set(failed_questions)
            quiz.scores.append({"score": correct, "total": total})
            quiz.save()

            return Response({
                "score": correct,
                "total": total,
                "failed": [q.id for q in failed_questions]
            }, status=status.HTTP_200_OK)

        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizGenerationAPIView(APIView):
    def post(self, request):
        module_id = request.data.get('module_id')
        user_id = request.data.get('user_id')

        if not module_id or not user_id:
            return Response({"error": "module_id and user_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            user = User.objects.get(pk=user_id)
            learning_goals = module.learning_goals or []

            failed_questions = Question.objects.filter(failed_in_quizzes__user=user).distinct()
            failed_topics = [q.question for q in failed_questions[:5]]

            focus_text = f" The student previously struggled with: {', '.join(failed_topics)}." if failed_topics else ""

            prompt = f"""
            Create a quiz for the module titled '{module.name}'.
            Learning goals: {', '.join(learning_goals)}.{focus_text}

            Ensure the quiz includes review and new questions. Emphasize previously missed concepts while keeping it varied.

            Return a JSON array of question objects. Each object must include:
            - question (string)
            - solution (string)
            - type (either 'text' or 'multiple_choice')
            """

            generation_config = types.GenerateContentConfig(temperature=0.7)
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=generation_config
            )

            try:
                print(response.text)
                quiz_data = json.loads(clean_response(response.text))
                quiz = Quiz.objects.create(user=user)

                for q in quiz_data:
                    if not all(k in q for k in ['question', 'solution', 'type']):
                        continue
                    question = Question.objects.create(
                        question=q['question'],
                        solution=q['solution'],
                        type=q['type']
                    )
                    quiz.questions.add(question)

                quiz.save()
                module.practice = quiz
                module.save()

                return Response({"message": "Quiz generated successfully.", "quiz_id": quiz.id}, status=status.HTTP_201_CREATED)

            except json.JSONDecodeError:
                return Response({"error": "Failed to parse Gemini response as JSON."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Module.DoesNotExist:
            return Response({"error": "Module not found."}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

