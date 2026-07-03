import { openai } from "@ai-sdk/openai";
import { transcribe } from "ai";

export const transcriptionService = {
  transcribeAudio: async (audio: File): Promise<string> => {
    const audioBuffer = await audio.arrayBuffer();
    const { text } = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: new Uint8Array(audioBuffer),
    });
    return text;
  },
};
