import { openai } from "@ai-sdk/openai";

export const transcriptionService = {
  transcribeAudio: async (audio: File): Promise<string> => {
    const audioBuffer = await audio.arrayBuffer();
    const model = openai.transcription("gpt-4o-transcribe");
    const { text } = await model.doGenerate({
      audio: new Uint8Array(audioBuffer),
      mediaType: audio.type || "audio/mp4",
    });
    return text;
  },
};
