from .vector_index import search_similar_chunks
from ..generation import get_llm_response

def ask_assistant(html: str, message: str) -> str:
    similar_chunks = search_similar_chunks(message, top_k=5)
    context = "\n---\n".join(similar_chunks)

    prompt = f"""
You are a helpful assistant on a website.

Here is the current page HTML:
---
{html}
---

Here is relevant content from other parts of the site:
---
{context}
---

The user asked:
"{message}"

Answer clearly using the current page and any relevant site information.
"""

    return get_llm_response(prompt=prompt)
