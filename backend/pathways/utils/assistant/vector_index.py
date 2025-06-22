import faiss
import numpy as np
import uuid
import requests
from bs4 import BeautifulSoup
from openai import OpenAI

openai_client = OpenAI(api_key="your-api-key")

embedding_dim = 1536  # for text-embedding-3-small
index = faiss.IndexFlatL2(embedding_dim)
doc_store = {}  # maps index id to content

def get_text_from_url(url: str) -> str:
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        [s.extract() for s in soup(["script", "style", "nav", "footer", "header"])]
        return soup.get_text(separator=" ", strip=True)
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

def chunk_text(text: str, max_words=200):
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def embed_texts(texts: list[str]) -> list[list[float]]:
    res = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [d.embedding for d in res.data]

def index_url(url: str):
    print(f"Indexing {url}")
    text = get_text_from_url(url)
    if not text:
        return

    chunks = chunk_text(text)
    embeddings = embed_texts(chunks)

    vectors = np.array(embeddings).astype("float32")
    index.add(vectors)

    for i, chunk in enumerate(chunks):
        doc_store[len(doc_store)] = {"url": url, "content": chunk}

def search_similar_chunks(query: str, top_k=5):
    query_embedding = embed_texts([query])[0]
    query_vector = np.array([query_embedding]).astype("float32")
    
    D, I = index.search(query_vector, top_k)
    return [doc_store[i]["content"] for i in I[0] if i in doc_store]

