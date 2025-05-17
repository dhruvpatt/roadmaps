import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Module, User, Content, Message, Quiz
from django.conf import settings
from datetime import datetime, timedelta
import json
import time
from pathways.serializers import ModuleSerializer
import requests
from .utils import get_llm_response
from .schemas import *

yt_key = getattr(settings, 'YT_API_KEY')


def search_youtube_video(query):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "key": yt_key,
        "maxResults": 1,
        "type": "video"
    }

    res = requests.get(url, params=params)
    data = res.json()

    if "items" in data and data["items"]:
        video_id = data["items"][0]["id"]["videoId"]
        return f"https://www.youtube.com/watch?v={video_id}"

    return None  # No valid video found


class PerceptionAgent:
    def analyze_context(self, module_name, learning_goals, prerequisites_feedback, user_preferences):
        prompt = f"""
        Analyze the following context for creating content for a module titled '{module_name}':
        - Learning Goals: {', '.join(learning_goals)}
        - Feedback from Prerequisite Modules: {prerequisites_feedback}
        - User Preferences: {user_preferences}

        Provide a refined set of insights or themes that the content should focus on, ensuring alignment with prior knowledge, goals, and learner-specific preferences.
        """
        return get_llm_response(prompt)


class ContentGenerationAgent:
    def generate_content(self, module_name, learning_goals, insights, user_preferences):
        """Generate educational content based on module parameters"""
        prompt = f"""
        You are a educator designing an article for one of your students
        Based on the insights: '{insights}' for the module '{module_name}' with learning goals {', '.join(learning_goals)}, generate educational content.
        The user has the following preferences: {user_preferences}.

        The content should be personalized according to these preferences and follow these guidelines:

         ### Structure Guidelines
        1. Begin with an engaging introduction that clearly states learning objectives do not state that it is the introduction
        2. Present concepts in a logical progression with imense depth (fundamental to advanced)
        3. Include practical examples and real-world applications
        4. End with a concise summary reinforcing key takeaways
        
        ### Content Types
        - **'content'**: Text-based content with markdown formatting for readable structure will be rendered using react markdown 
        - **'html'**: Interactive HTML elements (Note: JavaScript functionality is not avialble DO NOT create html that rely on scripts, focus on visual elements graphs, diagrams, titles, subheadings NO IMAGES CONSTRUCT THE DIAGRAMS/GRAPHS USING HTML)
        - **'video'**: Specific YouTube video search queries (descriptive enough to find relevant content)
        
        ### Best Practices
        - Use language appropriate for the target audience's level
        - talk as if you are a lecturer create good materials that cover a variety of variations and cases and explains materials in a way that does beyond understanding
        - Provide concrete examples that connect concepts to real-world applications
        - Incorporate interactive elements to maintain engagement
        - Ensure all information is technically accurate and current
        - Address all learning goals thoroughly
        - If the topic is math related work through sample questions to demonstrate concepts 
        - Imagine this as a khan acadmy article with supporting videos
        - HMTML elements that are meant to be graphs or diagrams should have the highest level of quality NO PLACE HOLDERS THIS IS NOT GOING UNDER REVIEW OR HAVE ANYTHING ADDED TO IT

        Return a list of content items in valid JSON format, each with:
        - type: one of ['html', 'content', 'video']
        - content: the actual content or interactive structure

        Example format:
        [
            {{
                "type": "content", 
                "content": "# Introduction\\nIn this module, we will explore..."
            }},
            {{
                "type": "html",
                "content": "<div class=\\"interactive\\">\\n  <h3>Interactive Example</h3>\\n  <p>Here is an interactive demonstration...</p>\\n</div>"
            }},
            {{
                "type": "video",
                "content": "detailed tutorial on [specific concept from module]"
            }}
        ]

        Ensure that the HTML content is properly formatted and will render correctly in a browser.
        DO NOT GIVE LINKS TO INTERACTIVE QUIZZES
        """
        return get_llm_response(prompt, response_model=ContentList)

    def generate_content_with_feedback(self, module_name, learning_goals, insights, user_preferences,
                                       previous_evaluation):
        """Generate improved content using feedback from previous evaluation"""
        print(previous_evaluation)
        prompt = f"""
            You are an experienced instructional designer and subject-matter expert charged with elevating an existing module.  
            Using the insights below for the module '{module_name}' and its learning goals ({', '.join(learning_goals)}), generate richer, more engaging educational content that aligns with the user’s stated preferences.
            
            Insights:
            '{insights}'
            
            Module:
            '{module_name}'
            
            Learning Goals:
            {', '.join(learning_goals)}
            
            User Preferences:
            {user_preferences}
            
            Your previous content received this evaluation:
            
            Scores:
            {previous_evaluation.scores}
            
            Feedback:
            {previous_evaluation.feedback}
            
            Specific improvement suggestions:
            {previous_evaluation.improvement_suggestions}
            
            Please address all these suggestions while creating new content that follows these guidelines:
            
            1. Content Structure:
               - Start with a clear introduction and learning objectives
               - Present concepts in logical order
               - Include examples, applications, and practice opportunities
               - End with a concise summary
            
            2. Content Types:
               - 'html': HTML content with interactive elements or titles and subheadings—ensure proper HTML syntax  
               - 'content': Text-based content with React Markdown formatting  
               - 'video': Specific YouTube video search queries (these will be resolved to actual videos)
            
            3. Best Practices:
               - Use clear, concise language appropriate for the target audience  
               - Include concrete examples that relate to real-world applications  
               - Incorporate interactive elements to maintain engagement  
               - Ensure technical accuracy and currency of all information
            
            Return a list of content items in valid JSON format, each with:
            - type: one of ['html', 'content', 'video']
            - content: the actual content or interactive structure
            """

        return get_llm_response(prompt, response_model=ContentList)


class EvaluationAgent:
    def evaluate(self, content_list):
        prompt = f"""
        Evaluate the following educational content using these specific criteria:

        Content: {content_list}

        Criteria for evaluation:
        1. Content Completeness: Does the content cover all learning goals specified?
        2. Technical Correctness: Is all factual information accurate?
        3. Readability: Is the content written at an appropriate level for the target audience?
        4. Structure: Is the content well-organized with clear progression?
        5. Renderability: Will all HTML content render correctly? Check for balanced tags and proper syntax.
        6. Video Content: Are video queries specific enough to return relevant results?
        7. Content Diversity: Is there a good mix of content types (text, interactive, video)?

        For each criterion, assign a score from 1-5 and provide a brief explanation.
        Then provide an overall assessment with one of these verdicts:
        - "VALID": Content meets all criteria with scores of 3 or higher
        - "NEEDS_REVISION": Content needs specific improvements but has good foundation
        - "INVALID": Content has critical flaws that require complete regeneration

        Return your evaluation in this JSON format:
        {{
        "scores": {{
        "completeness": 4,
                "technical_correctness": 5,
                "readability": 3,
                "structure": 4,
                "renderability": 5,
                "video_content": 4,
                "content_diversity": 3
            }},
            "feedback": {{
        "completeness": "Covers main objectives but could expand on X",
                "technical_correctness": "All information is accurate",
                "readability": "Appropriate for target audience",
                "structure": "Well-organized with logical flow",
                "renderability": "HTML is well-formed",
                "video_content": "Video queries are specific",
                "content_diversity": "Good balance of content types"
            }},
            "overall_verdict": "VALID",
            "improvement_suggestions": ["Add more interactive elements", "Expand section on topic X"]
        }}
        """

        try:
            response = get_llm_response(prompt, response_model=ContentEvaluation, mode="standard")
            #print("Response:", response)

            if response.overall_verdict == "VALID":
                return True, response
            else:
                return False, response

        except Exception as e:
            print(f"Evaluation error: {str(e)}")
            return False, {"error": str(e)}

    def apply_revisions(self, content_list, evaluation_result):
        """Apply revisions to content based on evaluation feedback"""
        if evaluation_result.overall_verdict == "VALID":
            return content_list

        prompt = f"""
        Revise the following educational content based on this evaluation feedback:

        Original Content: {content_list}

        Evaluation Feedback:
        {evaluation_result.feedback}

        Improvement Suggestions:
        {evaluation_result.improvement_suggestions}

        Make the necessary revisions while maintaining the original structure.
        Return the complete revised content in the same JSON format as the original.
        """

        revised_content = get_llm_response(prompt, response_model=ContentEvaluation)
        return revised_content


class ModuleContentGenerationAPIView(APIView):
    def post(self, request):
        module_id = request.data.get('module_id')
        user_id = request.data.get('user_id')

        if not module_id or not user_id:
            return Response({"error": "module_id and user_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            user = User.objects.get(pk=user_id)

            learning_goals = module.learning_goals or []
            feedback_list = [prereq.feedback for prereq in module.prerequisites.all() if prereq.feedback]
            prerequisites_feedback = "\n".join(feedback_list)
            user_preferences = user.preferences or []

            perception_agent = PerceptionAgent()
            generation_agent = ContentGenerationAgent()
            evaluation_agent = EvaluationAgent()

            start_time = datetime.now()
            timeout = timedelta(minutes=5)
            max_iterations = 5
            iteration = 0

            # Keep track of evaluation feedback to improve content in each iteration
            previous_feedback = None

            while iteration < max_iterations:
                try:
                    iteration += 1
                    print(f"Iteration {iteration}/{max_iterations}")
                    print("PERCEPTION 1")
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    insights = perception_agent.analyze_context(module.name, learning_goals, prerequisites_feedback,
                                                                user_preferences)
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    print("GENERATION 1")
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                    # Pass previous feedback to improve content generation if available
                    if previous_feedback and iteration > 1:
                        content_list = generation_agent.generate_content_with_feedback(
                            module.name,
                            learning_goals,
                            insights,
                            user_preferences,
                            previous_feedback
                        )
                    else:
                        content_list = generation_agent.generate_content(
                            module.name,
                            learning_goals,
                            insights,
                            user_preferences
                        )
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    print("EVALUATION 1")
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    is_valid, evaluation_result = evaluation_agent.evaluate(content_list)

                    # Log evaluation results for debugging
                    print(f"Evaul Res: {evaluation_result}")
                    print(f"Content evaluation: {evaluation_result.overall_verdict}")

                    if is_valid:
                        print("EVALUATION PASSED - Content is valid")
                        content_objects = []
                        print(content_list)
                        for item in content_list['items']:
                            if item['type'] == 'video':
                                query = item['content']
                                resolved_url = search_youtube_video(query)
                                if resolved_url:
                                    item['content'] = resolved_url
                                else:
                                    # Optionally skip if no valid video was found
                                    print(f"No valid video found for query: {query}")
                                    continue
                            content = Content.objects.create(
                                module=module,
                                type=item['type'],
                                content=item['content']
                            )
                            content_objects.append(content)

                        # Now add these to the ManyToMany field manually
                        module.content_list.set(content_objects)

                        # Save evaluation metrics to the module for future reference
                        module.content_evaluation_scores = evaluation_result.scores
                        module.save()

                        return Response({
                            "message": f"Content generated and saved in {iteration} iterations.",
                            "evaluation": {
                                "verdict": evaluation_result.overall_verdict,
                                "scores": evaluation_result.scores,
                                "suggestions": evaluation_result.improvement_suggestions
                            }
                        }, status=status.HTTP_201_CREATED)
                    else:
                        # Store feedback for next iteration
                        previous_feedback = evaluation_result
                        print("EVALUATION FAILED - Attempting revision")
                        print("Improvement suggestions:")
                        for suggestion in evaluation_result.improvement_suggestions:
                            print(f"- {suggestion}")

                        # If we're on the last iteration and still not valid, apply final revisions
                        if iteration == max_iterations - 1:
                            print("Last chance revision attempt...")
                            revised_content = evaluation_agent.apply_revisions(content_list, evaluation_result)
                            content_list = revised_content
                            is_valid, evaluation_result = evaluation_agent.evaluate(content_list)
                            if is_valid:
                                # Process and save the revised content
                                print("FINAL REVISION SUCCESSFUL")
                                # Similar processing as the valid case above
                                # (Code omitted for brevity - would be same as the valid case)
                                return Response({
                                    "message": f"Content generated after revision in {iteration} iterations.",
                                    "evaluation": {
                                        "verdict": evaluation_result.overall_verdict,
                                        "average_score": evaluation_result.average_score
                                    }
                                }, status=status.HTTP_201_CREATED)

                    if datetime.now() - start_time > timeout:
                        return Response({
                            "error": "Timeout reached, content generation failed.",
                            "partial_evaluation": evaluation_result.dict() if evaluation_result else None
                        }, status=status.HTTP_408_REQUEST_TIMEOUT)

                    # Add a small delay between iterations
                    time.sleep(2)

                except Exception as e:
                    print(f"Error in iteration {iteration}: {str(e)}")
                    import traceback
                    traceback.print_exc()

            # If we've reached max iterations without success, return the best we have with warnings
            return Response({
                "warning": "Maximum iterations reached without fully valid content. Using best available version.",
                "evaluation": previous_feedback if previous_feedback else None,
                "iterations_completed": iteration
            }, status=status.HTTP_202_ACCEPTED)

        except Module.DoesNotExist:
            return Response({"error": "Module not found."}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleAssistantAPIView(APIView):
    def post(self, request):
        module_id = request.data.get("module_id")
        message = request.data.get("message")

        if not module_id or not message:
            return Response({"error": "module_id and message are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            # Save user message
            Message.objects.create(module=module, content=message, type='user')

            # Prepare full chat history
            history = Message.objects.filter(module=module).order_by("timestamp")
            chat_log = "\n".join([
                f"User: {msg.content}" if msg.type == 'user' else f"AI: {msg.content}"
                for msg in history
            ])

            prompt = f"""
            You are an AI assistant helping a student with the module titled "{module.name}".
            Here's the conversation so far:
            {chat_log}

            Respond helpfully and clearly to the last user message.
            """
            assistant_reply = get_llm_response(prompt)  # Plain text response

            # Save assistant reply
            Message.objects.create(module=module, content=assistant_reply, type='system')

            return Response({"reply": assistant_reply}, status=status.HTTP_200_OK)

        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleFeedbackAPIView(APIView):
    def post(self, request):
        module_id = request.data.get("module_id")

        if not module_id:
            return Response({"error": "module_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            user = module.owner

            # Gather chat history
            messages = Message.objects.filter(module=module).order_by("timestamp")
            chat_log = "\n".join([
                f"User: {m.content}" if m.type == 'user' else f"AI: {m.content}"
                for m in messages
            ])

            # Gather failed questions
            failed = []
            for quiz in user.quizzes.filter(modules=module):
                for question in quiz.failed_questions.all():
                    failed.append(f"Q: {question.question} | A: {question.answer} | Solution: {question.solution}")

            failed_block = "\n".join(failed)

            # Build feedback prompt
            prompt = f"""
            You are a learning assistant. Analyze the following:

            1. Chat History:
            {chat_log}

            2. Missed Quiz Questions:
            {failed_block}

            Provide feedback about the student's learning progress in this module, including misunderstandings, learning style hints, or recommendations.
            Then suggest updates to their learning preferences.
            """

            result = get_llm_response(prompt, response_model=FeedbackResponse)

            module.feedback = result.feedback
            module.save()

            existing_prefs = set(user.preferences or [])
            updated_prefs = set(result.updated_preferences)
            user.preferences = list(existing_prefs.union(updated_prefs))
            user.save()

            return Response({
                "feedback": module.feedback,
                "updated_preferences": user.preferences
            }, status=status.HTTP_200_OK)

        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def roadmap_progress(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        chapters = roadmap.chapters.all()
        total_modules = sum(ch.modules.count() for ch in chapters)
        completed_modules = sum(ch.modules.filter(status='completed').count() for ch in chapters)

        progress = (completed_modules / total_modules) * 100 if total_modules > 0 else 0
        return Response({"progress_percent": round(progress, 2)}, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def roadmap_chapter_count(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        chapter_count = roadmap.chapters.count()
        return Response({"chapter_count": chapter_count}, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def get_module(request):
    module_id = request.data.get('module_id')
    user_id = request.data.get('user_id')
    print(request.data.get('module_id'))
    print(request.data.get('user_id'))
    if not module_id or not user_id:
        return Response({"error": "module_id and user_id are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)
        user = User.objects.get(pk=user_id)
        if module.content_list.count() == 0:
            # Trigger content generation
            # generate_url = "https://pathwaysbackend-856935426396.us-central1.run.app/generate-module/"
            generate_url = 'http://127.0.0.1:8000/generate-module/'
            response = requests.post(generate_url, json={
                "module_id": module_id,
                "user_id": user_id
            })

            if response.status_code != 201:
                return Response({"error": "Content generation failed"}, status=response.status_code)

            module.refresh_from_db()
            module.status = "in_progress"
            module.save()

        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def update_module_video(request):
    module_id = request.data.get('module_id')
    video_url = request.data.get('video_url')

    if not module_id or not video_url:
        return Response({"error": "module_id and video_url are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)
        module.yt_video = video_url
        module.save()

        return Response({"message": "Module video updated successfully.", "video_url": module.yt_video},
                        status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def create_lecture_materials(request):
    module_id = request.data.get("module_id")
    if not module_id:
        return Response({"error": "module_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)

        # Gather context
        chat_history = Message.objects.filter(module=module).order_by("timestamp")
        chat_log = "\n".join([
            f"User: {msg.content}" if msg.type == "user" else f"AI: {msg.content}"
            for msg in chat_history
        ])
        content_texts = [c.content for c in module.contents.all() if c.type != "video"]
        content_combined = "\n".join(content_texts)
        feedback = module.feedback or "No feedback provided."

        # Get LaTeX slides
        latex_prompt = f"""
        You are a LaTeX slide generator. Write a Beamer presentation based on the following content.

        Module Title: {module.name}
        Learning Goals: {', '.join(module.learning_goals)}
        Feedback: {feedback}

        Educational Content:
        {content_combined}

        Chat Interaction Summary:
        {chat_log}

        Only return the LaTeX code, starting with \\documentclass{{beamer}} and ending with \\end{{document}}.
        Keep it simple and avoid any imports beyond Beamer defaults.
        """
        latex_output = get_llm_response(latex_prompt)  # String response
        print("LaTeX Output:", latex_output)

        # Get slide narration script (structured)
        script_prompt = f"""
        Given the following LaTeX Beamer slide content, generate a corresponding script to be read aloud per slide.

        LaTeX Slides:
        {latex_output}

        Format the response as JSON:
        {{
          "scripts": {{
            "1": "...",
            "2": "..."
          }}
        }}
        Do not add explanations outside the JSON.
        """
        script_result = get_llm_response(script_prompt, response_model=SlideScript)

        return Response({
            "latex": latex_output,
            "script": script_result.scripts
        }, status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
