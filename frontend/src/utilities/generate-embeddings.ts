import { Profile } from "../types/profile";
import OpenAI from "openai";


export async function generate_embedding(query: String | Profile){
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  return embedding.data[0].embedding;

}