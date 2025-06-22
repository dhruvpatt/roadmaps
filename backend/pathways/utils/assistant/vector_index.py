import faiss
import numpy as np
import uuid
import requests
from bs4 import BeautifulSoup
import openai
from django.conf import settings
from playwright.sync_api import sync_playwright
import os
import json


openai.api_key = getattr(settings, 'LLM_API_KEY')

embedding_dim = 1536  # For text-embedding-3-small
teacher_index = faiss.IndexFlatL2(embedding_dim)
student_index = faiss.IndexFlatL2(embedding_dim)
teacher_doc_store = {}  # ID -> chunk data
student_doc_store = {}

def chunk_text(text: str, max_words=200) -> list[str]:
    """Split plain text into smaller chunks for embedding."""
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of text chunks using OpenAI's API, skipping empty entries."""
    texts = [t for t in texts if t.strip()]  # filter blanks
    if not texts:
        raise ValueError("No valid text chunks to embed.")

    response = openai.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    return [r.embedding for r in response.data]


def index_html_generic(url: str, html: str, index, doc_store: dict):
    """Index HTML content into the specified vector index."""
    soup = BeautifulSoup(html, "html.parser")
    [s.extract() for s in soup(["script", "style", "nav", "footer", "header"])]

    raw_html = soup.prettify()
    text = soup.get_text(separator=" ", strip=True)

    if not text.strip():
        raise ValueError(f"Empty text extracted from {url}")

    chunks = chunk_text(text)
    embeddings = embed_texts(chunks)
    vectors = np.array(embeddings).astype("float32")
    index.add(vectors)

    for i, chunk in enumerate(chunks):
        doc_store[len(doc_store)] = {
            "url": url,
            "content": chunk,
            "raw_html": raw_html if i == 0 else None  # only store once per URL
        }


INTERACTIVE_TAGS = {"button", "a", "input", "select", "textarea", "label"}

def extract_clean_html_with_interactives(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")

    # Remove unwanted tags completely
    for tag in soup.find_all():
        if tag.name not in INTERACTIVE_TAGS:
            tag.unwrap()  # Keep text but remove the tag

    # Optional: Remove hidden input elements or elements styled to be invisible
    for el in soup.find_all(style=True):
        if "display: none" in el["style"] or "visibility: hidden" in el["style"]:
            el.decompose()

    return soup.prettify()

def get_rendered_dom_html(url: str, cookies: list[dict] = None) -> str:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            if cookies:
                context.add_cookies(cookies)
            page = context.new_page()
            page.goto(url, wait_until="networkidle")
            page.wait_for_selector("#__next", timeout=10000)
            html = page.content()
            browser.close()
            return html.strip()
    except Exception as e:
        print(f"❌ Failed to get rendered HTML: {e}")
        return ""


def get_text_from_url(url: str, cookies: list[dict] = None) -> str:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            print("🍪 Setting cookies in Playwright:", cookies)

            if cookies:
                context.add_cookies(cookies)

            page = context.new_page()
            print(f"🔍 Navigating to {url}")
            page.goto(url, wait_until="networkidle")
            
            # Wait for classroom content to show (adjust selector as needed)
            page.wait_for_selector("#__next", timeout=10000)

            # Optional: screenshot to debug
            page.screenshot(path="debug.png")

            content = page.inner_text("body")
            browser.close()
            return content.strip()
    except Exception as e:
        print(f"❌ Playwright failed to render {url}: {e}")
        return ""
    

VECTOR_DATA_DIR = "vector_data"
os.makedirs(VECTOR_DATA_DIR, exist_ok=True)

def save_index_and_store(index, doc_store, prefix: str):
    faiss.write_index(index, f"{VECTOR_DATA_DIR}/{prefix}_index.faiss")
    with open(f"{VECTOR_DATA_DIR}/{prefix}_store.json", "w", encoding="utf-8") as f:
        json.dump(doc_store, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved vector index and doc store for '{prefix}'")

def load_index_and_store(prefix: str):
    index_path = f"{VECTOR_DATA_DIR}/{prefix}_index.faiss"
    store_path = f"{VECTOR_DATA_DIR}/{prefix}_store.json"

    if not os.path.exists(index_path) or not os.path.exists(store_path):
        print(f"⚠️ No saved index/store found for '{prefix}'")
        return None, None

    index = faiss.read_index(index_path)
    with open(store_path, "r", encoding="utf-8") as f:
        doc_store = json.load(f)

    # convert keys from str to int
    doc_store = {int(k): v for k, v in doc_store.items()}

    print(f"✅ Loaded vector index and doc store for '{prefix}'")
    return index, doc_store

def try_load_vector_store(prefix):
    index, store = load_index_and_store(prefix)
    if index is None or store is None:
        print(f"🔁 No vector data found for '{prefix}' — using fresh empty index.")
        index = faiss.IndexFlatL2(embedding_dim)
        store = {}
    return index, store

def search_similar_chunks(query: str, role: str = "teacher", top_k: int = 5) -> list[dict]:
    """Query against the teacher or student index for relevant content chunks and return with URLs."""
    query_embedding = embed_texts([query])[0]
    query_vector = np.array([query_embedding]).astype("float32")

    teacher_index, teacher_doc_store = try_load_vector_store("teacher")
    student_index, student_doc_store = try_load_vector_store("student")

    index = teacher_index if role == "teacher" else student_index
    doc_store = teacher_doc_store if role == "teacher" else student_doc_store

    D, I = index.search(query_vector, top_k)

    results = []
    for i in I[0]:
        if i in doc_store:
            doc = doc_store[i]
            results.append({
                "content": doc["content"],
                "url": doc.get("url", "")
            })

    return results
