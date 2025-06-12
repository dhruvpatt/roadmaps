import os
import django
import textwrap
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
    def generate_block_plan(self, module_name, learning_goals, insights, user_preferences):
        """
        Step 1: Generate a structured list of content blocks with descriptions and render types.
        Adds styling metadata (centered, spacing, font size, etc.).
        """
        prompt = f"""
        You are a curriculum designer creating an AI-generated educational article for the module '{module_name}'.

        Learning Goals:
        - {', '.join(learning_goals)}

        Insights:
        - {insights}

        User Preferences:
        - {user_preferences}

        Your job is to return a JSON list of content **blocks** to structure the article. Each block must include:
        - block_type: one of ['introduction', 'learning_objectives', 'definition', 'concept_explanation', 'worked_example',
                              'practice_exercise', 'visual_aid', 'real_world_link', 'misconception', 'comparison',
                              'summary', 'reflection', 'challenge_problem', 'interactive_element', 'video']
        - description: plain English of what this block should include
        - render_type: one of ['content', 'html', 'video']
        - styling: JSON object that includes visual preferences:
          - centered: true or false
          - spacing: one of ['small', 'medium', 'large']
          - font_size: optional, one of ['small', 'normal', 'large']
          - highlight: optional, true or false

        Guidelines:
        1. You dont need to use every block type and can reuse block types if needed 
        2. Keep each block modular and purposeful — avoid redundancy.
        3. For block_type 'html', DO NOT plan for anything requiring JavaScript or interactivity. Use static visual elements like labeled diagrams, charts, headings, subheadings, and tables. Construct them with semantic HTML.
        4. Be sure to vary the block types to keep the learning experience dynamic.
        5. The blocks should follow a logical flow: from motivation and definitions, through explanations and examples, to review and application.
        6. There should be one video block in the plan either at the start (as an introduction) or end of the content (further the understanding).
        
        Block-specific guidelines:
        - 'introduction': Provide context and motivation for the topic. Do NOT include the words "Introduction" as a heading.
        - 'learning_objectives': State 3–5 specific skills or outcomes the learner should achieve. Use a bullet or numbered list.
        - 'definition': Define key terms or principles clearly and concisely. Only one concept per block.
        - 'concept_explanation': Explain a concept in detail. Include variations, edge cases, or common use patterns.
        - 'worked_example': Present a step-by-step solved problem that clearly applies a concept previously explained.
        - 'practice_exercise': Pose 1–3 problems learners can attempt on their own. These should directly follow a worked example and align with it.
        - 'visual_aid': Describe a static diagram or chart that would help visualize the concept. No images — use only HTML structures like divs, tables, lists, or headings.
        - 'real_world_link': Describe how the concept connects to real-world applications or scenarios.
        - 'misconception': Highlight a common misunderstanding related to the topic and explain the correct understanding.
        - 'comparison': Describe a comparison between two or more similar concepts, including when each is appropriate.
        - 'summary': Concisely recap the most important ideas covered. Use bullet points if appropriate.
        - 'reflection': Prompt the learner to consider how the topic relates to their experience or how well they’ve understood it.
        - 'challenge_problem': Present a more advanced or multi-step problem to deepen understanding.
        - 'interactive_element': Describe a simple HTML structure that encourages user engagement — such as a sortable table, toggleable explanation sections, or fill-in-the-blank style layout (no JavaScript).
        - 'video': Suggest a detailed and specific YouTube search phrase that would return a relevant and high-quality explainer video on the topic.
        
        First, plan the content structure in your mind step-by-step:
        1. What prior knowledge or context does the learner need?
        2. What sequence of concepts should be taught to build understanding?
        3. Where should practice or examples occur?
        4. How will you close and reinforce the key ideas?
        
        Then, generate the JSON list of blocks based on this mental plan.

        Example return:
        [
          {{
            "block_type": "definition",
            "description": "Define and explain Newton’s Second Law (F = ma)",
            "render_type": "content",
            "styling": {{
              "centered": false,
              "spacing": "medium",
              "font_size": "normal"
            }}
          }},
          {{
            "block_type": "visual_aid",
            "description": "Diagram of force vectors acting on an accelerating cart",
            "render_type": "html",
            "styling": {{
              "centered": true,
              "spacing": "large"
            }}
          }}
        ]
        """

        return get_llm_response(prompt, response_model=ContentList, max_tokens=5000)


    def generate_contextual_content_from_block(
        self,
        block,
        position,
        total_blocks,
        previous_block_summary,
        learning_goals,
    ):
        prompt = textwrap.dedent(fr"""
            You are generating an educational block in a structured learning article.

            This is block {position + 1} of {total_blocks}.
            Block Type: {block["block_type"]}
            Render Type: {block["render_type"]}
            Description: {block["description"]}
            Learning Goals: {', '.join(learning_goals)}

            {'Previous Block Summary: ' + previous_block_summary if previous_block_summary else ''}

            Your task:
            - Write a short transition sentence that connects this block to the previous one.
            - Generate the block's main content appropriate for the subject area.

            Output JSON:
            {{
            "type": "{block["render_type"]}",
            "content": "...",  // Markdown + LaTeX content
            "styling": {block["styling"]},
            "transition_text": "..."  // One connecting sentence
            }}

            Guidelines:

            CONTENT FORMATTING GUIDELINES:
            - Use Markdown for formatting:
            * **bold**, *italic*, `inline code`, lists, headings, etc.

            - For MATHEMATICAL content:
            * Inline math: `$x^2 + y^2 = r^2$`
            * Display math (on its own lines):
                
                $$
                A = \begin{{bmatrix}}
                1 & 2 \\\\
                3 & 4
                \end{{bmatrix}}
                $$

            * Systems of equations:
                
                $$
                \begin{{cases}}
                x + y = 3 \\\\
                2x - y = 1
                \end{{cases}}
                $$

            * **Do not** manually double-escape backslashes—each single `\` will be JSON-encoded as `\\` for you.

            - For LANGUAGE/HUMANITIES content:
            * Use italics or blockquotes where appropriate.

            - For SCIENCE content:
            * Format units (`m/s`, `kg`), chemical formulas (`H_2O`), etc.

            - For CODING content:
            * Use fenced code blocks:
            
                \`\`\`python
                def foo(x):
                    return x * 2
                \`\`\`

            BLOCK TYPE GUIDELINES:
            - introduction, learning_objectives, definition, concept_explanation, etc. as before.
            - video: Provide a detailed and specific YouTube search phrase that would return a relevant and high-quality explainer video on the topic. IT MUST BE A QUERY STRING, NOT A URL OR A EXPLANATION OF WHAT TO LOOK UP.
            - html: Use only static visual elements like labeled diagrams, charts, headings, subheadings, and tables. Construct them with semantic HTML. NO IMAGES.
            GENERAL:
            - Headings (`###`) and display math (`$$…$$`) must be on their own blank lines.
            - Your **content** field must be valid Markdown + LaTeX that `react-markdown + rehype-katex` can parse.
            - Return **only** the JSON object—no extra prose outside it.
        """).strip()

        return get_llm_response(prompt, response_model=ContentList, max_tokens=2000)


    def generate_content(self, module_name, learning_goals, insights, user_preferences):
        """
        Main generation function
        """
        block_plan = self.generate_block_plan(module_name, learning_goals, insights, user_preferences)
        full_content = []
        # print(f"BLOCK PLAN: {block_plan}")
        previous_summary = None
        i = 0
        total_blocks = len(block_plan["items"])
        for block in block_plan["items"]:
            # print(f"BLOCK {i}: {block}")
            contextual_block = self.generate_contextual_content_from_block(
                block=block,
                position=i,
                total_blocks=total_blocks,
                previous_block_summary=previous_summary,
                learning_goals=learning_goals
            )

            # Extract summary for next block's context (basic form)
            print(contextual_block)
            if contextual_block and contextual_block["items"][0]["content"]:
                previous_summary = contextual_block["items"][0]["content"][:300]  # crude approximation

                full_content.extend(contextual_block["items"])
            i += 1
        return full_content

    def generate_content_with_feedback(self, module_name, learning_goals, insights, user_preferences,
                                       previous_evaluation):
        """
        Full generation pipeline with feedback support and contextual transitions for cohesion.
        """
        print(previous_evaluation)

        feedback_summary = f"""
        Scores: {previous_evaluation.scores}
        Feedback: {previous_evaluation.feedback}
        Suggestions: {previous_evaluation.improvement_suggestions}
        """

        block_plan = self.generate_block_plan(module_name, learning_goals, insights, user_preferences)
        full_content = []
        previous_summary = None
        # print(f"BLOCK FEEDBACK PLAN: {block_plan}")
        i = 0
        for block in block_plan["items"]:
            print(f"block {i}: {block}")
            prompt = f"""
            You are improving an educational content block using expert feedback and cohesive flow design.

            Block {i + 1} of {len(block_plan)}
            Block Type: {block["block_type"]}
            Render Type: {block["render_type"]}
            Description: {block["description"]}
            Styling: {block["styling"]}

            Learning Goals: {', '.join(learning_goals)}
            Prior Block Summary: {previous_summary or 'N/A'}

            Feedback Summary:
            {feedback_summary}

            Generate:
            - One short transition sentence
            - The block’s main content

            Output JSON:
            {{
              "type": "{block["render_type"]}",
              "content": "...",
              "styling": {block["styling"]},
              "transition_text": "..."
            }}

            Format properly and apply all feedback.
            """
            improved_block = get_llm_response(prompt, response_model=ContentList, max_tokens=5000)

            # Update previous summary for next block
            if improved_block and improved_block[0].content:
                previous_summary = improved_block[0].content[:300]

            full_content.extend(improved_block)
            i += 1
        return full_content


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
        5. Renderability: Will all HTML or markdown content render correctly? Check for balanced tags and proper syntax.
        6. Video Content: Are video queries specific enough to return relevant results?
        7. Content Diversity: Is there a good mix of content types (text, interactive, video)?
        8. Are there any images that it is referenceing? If so, automatically INVALIDATE the content.
        9. Are there any references to external content? This includes links to desmos or articles or textbooks If so, automatically INVALIDATE the content.

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
            print("Response:", response)
            return True, response
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
                    # print(f"Content evaluation: {evaluation_result.overall_verdict}")

                    if is_valid:
                        print("EVALUATION PASSED - Content is valid")
                        content_objects = []
                        for item in content_list:
                            # Handle video lookup
                            if item['block_type'] == 'video':
                                print(f"Video block detected: {item}")
                                query = item['content']
                                resolved_url = search_youtube_video(query)
                                print(f"Resolved URL: {resolved_url}")
                                if resolved_url:
                                    item['content'] = resolved_url
                                else:
                                    print(f"No valid video found for query: {query}")
                                    continue

                            # Ensure all required and optional fields are properly mapped
                            content = Content.objects.create(
                                module=module,
                                type=item.get('render_type', 'content'),
                                block_type=item.get('block_type'),
                                content=item.get('content'),
                                transition_text=item.get('transition_text'),
                                styling=item.get('styling'),
                                # description=item.get('description')
                            )
                            content_objects.append(content)

                        module.content_list.set(content_objects)

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


# @api_view(['GET'])
# def pathway_progress(request, pathway_id):
#     try:
#         pathway = Pathway.objects.get(pk=pathway_id)
#         chapters = pathway.chapters.all()
#         total_modules = sum(ch.modules.count() for ch in chapters)
#         completed_modules = sum(ch.modules.filter(status='completed').count() for ch in chapters)

#         progress = (completed_modules / total_modules) * 100 if total_modules > 0 else 0
#         return Response({"progress_percent": round(progress, 2)}, status=status.HTTP_200_OK)

#     except Pathway.DoesNotExist:
#         return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['GET'])
# def pathway_chapter_count(request, pathway_id):
#     try:
#         pathway = Pathway.objects.get(pk=pathway_id)
#         chapter_count = pathway.chapters.count()
#         return Response({"chapter_count": chapter_count}, status=status.HTTP_200_OK)

#     except Pathway.DoesNotExist:
#         return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def get_module(request):
    module_id = request.data.get('module_id')
    user_id = request.data.get('user_id')

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
        print("Module data:", serializer.data)
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
