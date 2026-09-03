declare module "cloudflare:workers" {
  type D1Result<T = unknown> = { results?: T[]; success: boolean; meta?: Record<string, unknown> };
  type D1PreparedStatement = {
    bind(...values: unknown[]): D1PreparedStatement;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    first<T = unknown>(): Promise<T | null>;
  };
  export type D1Database = {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  };
  export type R2Bucket = {
    put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  };
  export const env: {
    DB?: D1Database;
    FILES?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    [key: string]: unknown;
  };
}
