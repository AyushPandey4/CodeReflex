import { NextResponse } from "next/server";
import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("MISSING_ENV_VAR: OPENROUTER_API_KEY is not set.");
}

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": "CodeReflex",
  },
});

export async function POST(request) {
  let messages;
  try {
    const body = await request.json();
    messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required and must be a non-empty array" },
        { status: 400 }
      );
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: "nousresearch/deephermes-3-llama-3-8b-preview:free",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    if (!completion.choices || completion.choices.length === 0) {
      console.error("OpenRouter API returned no choices.");
      return NextResponse.json(
        { error: "AI did not return a response." },
        { status: 500 }
      );
    }

    return NextResponse.json(completion.choices[0].message);
  } catch (error) {
    console.error("Error with OpenRouter API:", error);

    let errorMessage = "Failed to get response from AI.";
    let statusCode = 500;

    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenRouter API Error: ${error.message}`;
      statusCode = error.status || 500;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      errorMessage = "Network error: Could not connect to OpenRouter API.";
      statusCode = 504;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
