export const calculatorFunctions = {
  concrete: (length, width, depth, count) => length * width * depth * (count || 1),
  slab: (length, width, thickness, count) => length * width * thickness * (count || 1),
  excavation: (length, width, depth, count) => length * width * depth * (count || 1),
  backfill: (excavation, structure, factor) => Math.max(0, excavation - structure) * (factor || 1),
  block: (area, blockLengthCm, blockHeightCm, wastePercent) => blockLengthCm * blockHeightCm ? area / ((blockLengthCm / 100) * (blockHeightCm / 100)) * (1 + wastePercent / 100) : 0,
  rebar: (diameterMm, barLengthM, count, wastePercent) => (diameterMm * diameterMm / 162) * barLengthM * count * (1 + wastePercent / 100),
  formwork: (length, width, height, count) => 2 * (length + width) * height * (count || 1),
  steel: (length, width, thicknessMm, count) => length * width * (thicknessMm / 1000) * 7850 * (count || 1),
};

export const estimateHouseRange = (builtArea, lowRate, highRate) => {
  if (builtArea <= 0 || lowRate <= 0 || highRate < lowRate) return null;
  return [builtArea * lowRate, builtArea * highRate];
};
