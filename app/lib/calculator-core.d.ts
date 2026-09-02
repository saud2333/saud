export type CalculatorFunction = (a: number, b: number, c: number, d: number) => number;
export const calculatorFunctions: Record<"concrete" | "slab" | "excavation" | "backfill" | "block" | "rebar" | "formwork" | "steel", CalculatorFunction>;
export const estimateHouseRange: (builtArea: number, lowRate: number, highRate: number) => [number, number] | null;
