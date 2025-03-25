import { RawProfile } from "../types/profile";
import OpenAI from "openai";


export async function generate_embedding(query: String | RawProfile){
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (typeof query === "string") {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    return embedding.data[0].embedding;
  }
  else {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: JSON.stringify(query),
    });
    return embedding.data[0].embedding;
  }

}