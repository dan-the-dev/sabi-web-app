"use server";

import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

export type TranscribeResult =
  | { success: true; text: string; segments?: Array<{ text: string; startSecond: number; endSecond: number }>; language?: string; durationInSeconds?: number }
  | { success: false; error: string };

export async function transcribeAudio(formData: FormData): Promise<TranscribeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY is not set" };
  }

  const file = formData.get("audio");
  if (!file || !(file instanceof File)) {
    return { success: false, error: "No audio file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const transcript = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: arrayBuffer,
    });

    return {
      success: true,
      text: transcript.text,
      segments: transcript.segments,
      language: transcript.language,
      durationInSeconds: transcript.durationInSeconds,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return { success: false, error: message };
  }
}
