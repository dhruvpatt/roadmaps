from pydantic import BaseModel
from typing import List, Dict, Optional

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

class RoadmapStructure(BaseModel):
    chapters: List[ChapterSchema]
    modules: List[ModuleItem]

class InsightResponse(BaseModel):
    insights: str
