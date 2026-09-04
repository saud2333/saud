export type AiRole = "user" | "assistant";
export type AiMessage = { role: AiRole; content: string; createdAt: string };
export type AiSource = { label: string; url: string };

export declare const DEFAULT_AI_MODEL: string;
export declare function sanitizeHistory(value: unknown, limit?: number): AiMessage[];
export declare function buildInstructions(options: {
  locale: "ar" | "en";
  disciplineName: string;
  disciplineGuidance: string;
  sourceList: AiSource[];
}): string;
export declare function extractResponseText(payload: unknown): string;
export declare function requestOpenAI(options: {
  apiKey: string | null;
  model?: string;
  instructions: string;
  history: AiMessage[];
  message: string;
  safetyIdentifier?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ reply: string; model: string } | null>;
