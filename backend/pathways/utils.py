import openai
from django.conf import settings
from pydantic import BaseModel
from typing import Optional, Type

openai.api_key = getattr(settings, 'LLM_API_KEY')

def get_llm_response(
    prompt: str = "",
    temperature: float = 0.7,
    response_model: Optional[Type[BaseModel]] = None,
    mode: str = "dumps",
    max_tokens: int = 15000
):
    try:
        if response_model:
            response = openai.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format=response_model,
                max_tokens=max_tokens
            )
            if mode == "dumps":
                return response.choices[0].message.parsed.model_dump()
            else:
                return response.choices[0].message.parsed

        else:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()

    except Exception as e:
        print(e)
        raise ValueError(f"LLM response generation failed: {e}")
