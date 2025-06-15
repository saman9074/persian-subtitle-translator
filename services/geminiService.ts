import { GoogleGenAI } from "@google/genai";
import { SubtitleSubject } from '../types'; // Use SubtitleSubject type

// IMPORTANT: In a real-world client-side application, API keys should not be hardcoded or directly
// embedded. They should be managed via a backend proxy or environment variables securely
// injected at build time (e.g., import.meta.env.VITE_API_KEY for Vite).
// The instruction "Assume this variable is pre-configured, valid, and accessible" is followed here.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("API_KEY for Gemini is not defined. Please ensure process.env.API_KEY is set.");
}

export const translateTextWithContext = async (
  mainText: string,
  previousLines: string[],
  followingLines: string[],
  subject: SubtitleSubject,
  modelName: string,
  customContextWindowSize: number
): Promise<string> => {
  if (!ai) {
    return "Error: Gemini API client not initialized. API Key may be missing.";
  }

  // Ensure previous and following lines don't exceed the custom context window.
  const relevantPreviousLines = previousLines.slice(-customContextWindowSize);
  const relevantFollowingLines = followingLines.slice(0, customContextWindowSize);

  let subjectSpecificInstruction = "You are an expert subtitle translator."; // Default

  switch (subject) {
    case 'Film':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in Film scripts and dialogue.";
      break;
    case 'TV Series':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in dialogue for TV Series.";
      break;
    case 'Music Video':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in song lyrics and dialogue for Music Videos. Pay attention to rhythm and artistic expression if applicable.";
      break;
    case 'General Education':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in general educational content.";
      break;
    case 'Specialized Education':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in specific academic or professional educational material.";
      break;
    case 'Specialized Programming Education':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in technical content for Programming Education. Maintain accuracy of technical terms and code-related phrasing.";
      break;
    case 'Specialized Computer Education':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in technical content for Computer Education and IT. Maintain accuracy of technical terms.";
      break;
    case 'Documentary':
      subjectSpecificInstruction = "You are an expert subtitle translator specializing in narration and interviews for Documentaries.";
      break;
  }

  const prompt = `
${subjectSpecificInstruction} Your task is to translate the **MAIN_TEXT** from its original language into fluent, accurate, and natural-sounding Persian.
Use the **PREVIOUS_LINES** and **FOLLOWING_LINES** provided below strictly for contextual understanding to improve the translation of the **MAIN_TEXT**.
Do NOT translate the PREVIOUS_LINES or FOLLOWING_LINES themselves.
Only provide the Persian translation for the **MAIN_TEXT**. Output only the translated text, with no extra commentary or labels.

**PREVIOUS_LINES:**
${relevantPreviousLines.join('\n') || '(No previous lines for context)'}

**MAIN_TEXT:**
${mainText}

**FOLLOWING_LINES:**
${relevantFollowingLines.join('\n') || '(No following lines for context)'}

Persian Translation of MAIN_TEXT:
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error translating text with Gemini:", error);
    if (error instanceof Error) {
        return `Error during translation: ${error.message}`;
    }
    return "Error: An unknown error occurred during translation.";
  }
};
