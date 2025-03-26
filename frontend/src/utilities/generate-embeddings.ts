import { RawProfile } from "../types/types";
import OpenAI from "openai";

export async function generate_embedding(query: string | RawProfile) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (typeof query === "string") {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    return embedding.data[0].embedding;
  } else {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: JSON.stringify(query),
    });
    return embedding.data[0].embedding;
  }
}
