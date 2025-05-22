from pydantic import BaseModel, Field, validator, RootModel
from typing import Dict, List, Optional, Union, Literal, Literal

##########################################
# Schemas are for LLM responses, 1-1 for the most part to models but not always. 
# This is for LLM to understand what format to return data in.# 
###########################################


class GradingResponse(BaseModel):
    items: List[str]

# class QuizQuestion(BaseModel):
#     question: str
#     solution: str
#     type: str  # must be "text"

# class QuizList(BaseModel):
#     items: List[QuizQuestion]
class QuizQuestion(BaseModel):
    question: str
    options: Optional[List[str]] = None          # only for MC
    correct_answer: str
    type: Literal["multiple_choice", "true_false", "short_answer"]


class QuizStructure(BaseModel):
    quiz_title: str
    quiz_duration: int                           # minutes
    questions: List[QuizQuestion]
    
    
class SlideScript(BaseModel):
    scripts: Dict[str, str]

class Styling(BaseModel):
    centered: Optional[bool]
    spacing: Optional[Literal['small', 'medium', 'large']]
    font_size: Optional[Literal['small', 'normal', 'large']]
    highlight: Optional[bool]

class ContentBlock(BaseModel):
    block_type: Literal[
        'introduction', 'learning_objectives', 'definition', 'concept_explanation', 'worked_example',
        'practice_exercise', 'visual_aid', 'real_world_link', 'misconception', 'comparison',
        'summary', 'reflection', 'challenge_problem', 'interactive_element', 'video'
    ]
    render_type: Literal['content', 'html', 'video']
    description: Optional[str]
    content: Optional[str]
    styling: Optional[Styling]
    transition_text: Optional[str]

class ContentList(BaseModel):
    items:List[ContentBlock]

class FeedbackResponse(BaseModel):
    feedback: str
    updated_preferences: List[str]

class EvaluationFeedback(BaseModel):
    evaluation: str

class ContentEvaluationScores(BaseModel):
    completeness: int
    technical_correctness: int
    readability: int
    structure: int
    renderability: int
    video_content: int
    content_diversity: int

    @validator('*')
    def score_must_be_1_to_5(cls, v):
        if not (1 <= v <= 5):
            raise ValueError('Must be between 1 and 5')
        return v


class ContentEvaluationFeedback(BaseModel):
    completeness: str
    technical_correctness: str
    readability: str
    structure: str
    renderability: str
    video_content: str
    content_diversity: str


class ContentEvaluation(BaseModel):
    scores: ContentEvaluationScores
    feedback: ContentEvaluationFeedback
    overall_verdict: str
    improvement_suggestions: List[str]

    @property
    def average_score(self) -> float:
        """Calculate the average score across all evaluation criteria"""
        score_values = vars(self.scores).values()
        return sum(score_values) / len(score_values)

    @property
    def is_valid(self) -> bool:
        """Determine if content is valid based on verdict"""
        return self.overall_verdict == "VALID"
class ChapterSchema(BaseModel):
    name: str
    next: Optional[str]
    learning_goals: List[str]

class ModuleItem(BaseModel):
    name: str
    chapter: str
    learning_goals: List[str]
    module_description: str
    prerequisite_modules: List[str]
    next_modules: List[str]

class InsightResponse(BaseModel):
    insights: str

# Add this to your schemas.py file
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union, Any

class InsightResponse(BaseModel):
    insights: str

class ChapterStructure(BaseModel):
    name: str
    learning_goals: List[str]
    required_quiz: Optional[QuizStructure] = None
    next: Optional[str] = None
    learning_goals: List[str] = Field(default_factory=list)
    description: Optional[str] = None

class ModuleStructure(BaseModel):
    name: str
    chapter: str
    learning_goals: List[str]
    module_description: str
    prerequisite_modules: List[str] = Field(default_factory=list)
    next_modules: List[str] = Field(default_factory=list)

class PathwayStructure(BaseModel):
    chapters: List[ChapterStructure]
    modules: List[ModuleStructure]

class EnhancedEvaluationFeedback(BaseModel):
    evaluation: str
    suggested_improvements: Optional[str] = None
    chapters_count: Optional[int] = None
    modules_count: Optional[int] = None
    coverage_score: Optional[int] = None

class EnhancedInsightResponse(BaseModel):
    expanded_learning_goals: List[str]
    insights: str
    estimated_complexity: Optional[str] = None
    recommended_structure: Optional[Dict[str, Any]] = None


class ModuleListStructure(BaseModel):
    modules: List[ModuleStructure]
class ChapterListStructure(BaseModel):
    chapters: List[ChapterStructure]



