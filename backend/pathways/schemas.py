from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Union
class GradingResponse(BaseModel):
    items: List[str]

class QuizQuestion(BaseModel):
    question: str
    solution: str
    type: str  # must be "text"

class QuizList(BaseModel):
    items: List[QuizQuestion]

class SlideScript(BaseModel):
    scripts: Dict[str, str]

class ContentItem(BaseModel):
    type: str  # 'html', 'content', or 'video'
    content: str

class ContentList(BaseModel):
    items: List[ContentItem]

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
    next: Optional[str] = None

class ModuleStructure(BaseModel):
    name: str
    chapter: str
    learning_goals: List[str]
    module_description: str
    prerequisite_modules: List[str] = Field(default_factory=list)
    next_modules: List[str] = Field(default_factory=list)

class RoadmapStructure(BaseModel):
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
