# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
import csv
import io
import PyPDF2
from pathways.models.classroom import Classroom, Unit, Week
from pathways.serializers.curriculum_serializer import UnitSerializer, WeekSerializer
from typing import List
from pathways.utils.generation import get_llm_response
from pathways.utils.schema import CurriculumResponse
from pathways.utils.helpers import *

from datetime import datetime



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_pdf_curriculum(request):
    """
    Process uploaded PDF and generate curriculum structure using AI
    """
    try:
        classroom_id = request.data.get('classroom_id')
        pdf_file = request.FILES.get('file')
        if not classroom_id or not pdf_file:
            return Response({
                'detail': 'Classroom ID and PDF file are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify classroom exists and user has permission
        classroom = get_object_or_404(Classroom, id=classroom_id)
        if request.user not in classroom.teachers.all():
            return Response({
                'detail': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        # Extract text from PDF
        pdf_text = extract_pdf_text(pdf_file)

        if not pdf_text.strip():
            return Response({
                'detail': 'Could not extract text from PDF'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate curriculum structure using AI
        suggested_units = generate_curriculum_from_text(pdf_text)

        return Response({
            'units': suggested_units,
            'message': 'PDF processed successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'detail': f'Error processing PDF: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv_curriculum(request):
    """
    Process uploaded CSV file using AI to generate curriculum structure.
    """
    try:
        classroom_id = request.data.get('classroom_id')
        csv_file = request.FILES.get('file')

        if not classroom_id or not csv_file:
            return Response({
                'detail': 'Classroom ID and CSV file are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify classroom exists and user has permission
        classroom = get_object_or_404(Classroom, id=classroom_id)
        if request.user not in classroom.teachers.all():
            return Response({
                'detail': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        # Decode and read full CSV content as text
        csv_content = csv_file.read().decode('utf-8')
        if not csv_content.strip():
            return Response({
                'detail': 'Uploaded CSV is empty or unreadable.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Use LLM to generate curriculum from raw CSV content
        suggested_units = generate_curriculum_from_text(csv_content)

        return Response({
            'units': suggested_units,
            'message': 'CSV processed successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'detail': f'Error processing CSV: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_curriculum(request):
    """
    Create curriculum from structured data (manual or processed).
    Only classroom teachers can use this endpoint.
    Materials/assignments/tests in the classroom will be auto-mapped to weeks if their created_at falls within the week.
    """
    try:
        classroom_id = request.data.get('classroom_id')
        units_data = request.data.get('units', [])

        if not classroom_id or not units_data:
            return Response({
                'detail': 'Classroom ID and units data are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # RBAC: Verify classroom exists and user is a teacher in it
        classroom = get_object_or_404(Classroom, id=classroom_id)
        if not is_teacher_in_classroom(request.user, classroom):
            return Response({
                'detail': 'Permission denied. You must be a teacher in this classroom.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Validate units data
        for unit_data in units_data:
            if not unit_data.get('name', '').strip():
                return Response({
                    'detail': 'All units must have a name'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Prepare all content in the classroom for auto-assignment to weeks
        all_materials = list(classroom.materials.all())
        all_assignments = list(getattr(classroom, "assignments", []).all(
        ) if hasattr(classroom, "assignments") else [])
        all_tests = list(getattr(classroom, "tests", []).all()
                         if hasattr(classroom, "tests") else [])

        created_units = []
        with transaction.atomic():
            for unit_data in units_data:
                unit = Unit.objects.create(
                    name=unit_data['name'].strip(),
                    description=unit_data.get('description', '').strip(),
                    classroom=classroom
                )

                weeks_data = unit_data.get('weeks', [])
                for week_data in weeks_data:
                    if week_data.get('learning_goal', '').strip():
                        week = Week.objects.create(
                            unit=unit,
                            learning_goal=week_data['learning_goal'].strip(),
                            start_date=week_data.get('start_date', None),
                            end_date=week_data.get('end_date', None)
                        )

                        def fits_week(obj):
                            if not week.start_date or not week.end_date or not hasattr(obj, "created_at"):
                                return False
                            week_start = week.start_date
                            week_end = week.end_date
                            if isinstance(week_start, str):
                                week_start = datetime.strptime(week_start, "%Y-%m-%d").date()
                            if isinstance(week_end, str):
                                week_end = datetime.strptime(week_end, "%Y-%m-%d").date()
                            created = obj.created_at
                            if isinstance(created, str):
                                created = datetime.strptime(created.split("T")[0], "%Y-%m-%d").date()
                            elif hasattr(created, "date"):
                                created = created.date()
                            return week_start <= created <= week_end


                        # Attach materials
                        for m in all_materials:
                            if fits_week(m):
                                week.materials.add(m)

                        # Attach assignments
                        for a in all_assignments:
                            if fits_week(a):
                                if hasattr(week, 'assignments'):
                                    week.assignments.add(a)

                        # Attach tests
                        for t in all_tests:
                            if fits_week(t):
                                if hasattr(week, 'tests'):
                                    week.tests.add(t)

                created_units.append(unit)

        serializer = UnitSerializer(created_units, many=True)
        return Response({
            'units': serializer.data,
            'message': f'Successfully created {len(created_units)} units (materials/tests auto-assigned to weeks where possible).'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(str(e))
        return Response({
            'detail': f'Error creating curriculum: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_classroom_curriculum(request, classroom_id):
    """
    Get curriculum for a specific classroom
    """
    try:
        classroom = get_object_or_404(Classroom, id=classroom_id)
        print(
            f"Fetching curriculum for classroom: {classroom.name} (ID: {classroom.id})")
        # Check if user has access to this classroom
        if (request.user not in classroom.teachers.all() and
                request.user not in classroom.students.all()):
            return Response({
                'detail': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        units = Unit.objects.filter(
            classroom=classroom).prefetch_related('weeks')
        print(f"Found {units.count()} units for classroom: {classroom.name}")
        serializer = UnitSerializer(units, many=True)

        return Response({
            'units': serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'detail': f'Error fetching curriculum: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def extract_pdf_text(pdf_file):
    """
    Extract text content from uploaded PDF file
    """
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""

        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n"

        return text
    except Exception as e:
        raise Exception(f"Failed to extract PDF text: {str(e)}")


def generate_curriculum_from_text(text: str) -> List[Unit]:
    """
    Generate a validated curriculum using the LLM response helper and Pydantic models.
    Returns a list of Unit objects.
    """
    prompt = f"""
    Based on the following content, generate a JSON object of units with weeks and learning goals.

    Content:
    {text[:4000]}

    Return JSON like this:
    {{
    "units": [
        {{
        "name": "Unit 1",
        "description": "...",
        "weeks": [{{"learning_goal": "..."}}]
        }},
        ...
    ]
    }}

    Only return the JSON object. Do not include markdown or explanations.
    """

    response = get_llm_response(
        prompt=prompt,
        response_model=CurriculumResponse,
        mode="loads",
        temperature=0.7,
        model="gpt-4o-mini"
    )
    return response.model_dump(exclude_none=True).get('units', [])


def parse_csv_curriculum(csv_file):
    """
    Parse CSV file and extract curriculum structure
    Expected CSV format:
    unit_name,unit_description,week_number,learning_goal
    """
    try:
        # Read CSV content
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        units_dict = {}

        for row in csv_reader:
            unit_name = row.get('unit_name', '').strip()
            if not unit_name:
                continue

            if unit_name not in units_dict:
                units_dict[unit_name] = {
                    'name': unit_name,
                    'description': row.get('unit_description', '').strip(),
                    'weeks': []
                }

            learning_goal = row.get('learning_goal', '').strip()
            if learning_goal:
                units_dict[unit_name]['weeks'].append({
                    'learning_goal': learning_goal
                })

        return list(units_dict.values())

    except Exception as e:
        raise Exception(f"Failed to parse CSV: {str(e)}")
