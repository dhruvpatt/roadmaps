import tiktoken
import openai
from pydantic import BaseModel
from typing import Optional, Type
from openai import LengthFinishReasonError
from django.conf import settings


openai.api_key = getattr(settings, 'LLM_API_KEY')


def count_tokens(prompt: str, model: str = "gpt-4o-mini") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(prompt))


def get_llm_response(
    prompt: str = "",
    temperature: float = 0.7,
    response_model: Optional[Type[BaseModel]] = None,
    mode: str = "dumps",
    max_tokens: int = 4000,  # Start reasonably
    model: str = "gpt-4o-mini"
):
    try:
        model_context_limit = 128_000  # GPT-4o context window
        prompt_tokens = count_tokens(prompt, model)

        # Leave room for safety buffer
        safe_max_tokens = min(max_tokens, model_context_limit - prompt_tokens - 1000)

        if safe_max_tokens <= 0:
            raise ValueError("Prompt is too long for the model context window.")

        if response_model:
            response = openai.beta.chat.completions.parse(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format=response_model,
                max_tokens=safe_max_tokens
            )
            return (
                response.choices[0].message.parsed.model_dump()
                if mode == "dumps"
                else response.choices[0].message.parsed
            )

        else:
            response = openai.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=safe_max_tokens
            )
            return response.choices[0].message.content.strip()

    except LengthFinishReasonError:
        print(f"⚠️ Output was cut off (max_tokens={max_tokens}). Retrying with more...")

        if max_tokens >= 15000:
            raise ValueError("Max retry token limit (15000) reached. Cannot parse full response.")

        return get_llm_response(
            prompt=prompt,
            temperature=temperature,
            response_model=response_model,
            mode=mode,
            max_tokens=min(max_tokens + 2000, 15000),  # Increase in 2k chunks
            model=model
        )

    except Exception as e:
        print(e)
        raise ValueError(f"LLM response generation failed: {e}")
