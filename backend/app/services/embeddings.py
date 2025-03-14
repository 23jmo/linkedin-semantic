import os
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def generate_embedding(text):
    """
    Generate an embedding for the given text using OpenAI
    """
    response = await client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    
    return response.data[0].embedding
