export type AiRole = "user" | "assistant";
export type AiMessage = { role: AiRole; content: string; createdAt: string };
export type AiSource = { label: string; url: string };

export const DEFAULT_AI_MODEL: string;
export function sanitizeHistory(value: unknown, limit?: number): AiMessage[];
export function buildInstructions(options: {
  locale: "ar" | "en";
  disciplineName: string;
  disciplineGuidance: string;
  sourceList: AiSource[];
}): string;
export function extractResponseText(payload: unknown): string;
export function requestOpenAI(options: {
  apiKey: string | null;
  model?: string;
  instructions: string;
  history: AiMessage[];
  message: string;
  safetyIdentifier?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ reply: string; model: string } | null>;
