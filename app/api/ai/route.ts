const disciplinePrompts: Record<string, { ar: string; en: string }> = {
  "Construction AI": {
    ar: "قبل التقدير أحتاج: مساحة البناء الصافية، عدد الأدوار، المنطقة، وجود سرداب أو مصعد، مستوى التشطيب، وما إذا كانت معدلات التكلفة من مصدر حديث.",
    en: "Before estimating, provide net built area, floor count, location, basement or lift requirements, finish level, and whether your cost rates come from a current source.",
  },
  "Structural AI": {
    ar: "قبل أي حساب إنشائي أحتاج النظام الإنشائي، الأبعاد، الأحمال، مقاومات المواد، تقرير التربة، والكود المعتمد. لا يمكن اعتماد النتيجة دون مهندس إنشائي مرخص.",
    en: "Before any structural calculation, provide the structural system, dimensions, loads, material strengths, soil report, and governing code. A licensed structural engineer must approve the result.",
  },
  "Water AI": {
    ar: "أحتاج عدد المستخدمين أو الوحدات، نمط الطلب، ساعات التخزين، المناسيب، الضغط المتاح، مادة وقطر وطول الأنبوب، ودرجة حرارة التشغيل قبل الحساب.",
    en: "Provide occupants or units, demand pattern, storage hours, elevations, available pressure, pipe material/diameter/length, and operating temperature before calculation.",
  },
  "Roads AI": {
    ar: "أحتاج AADT، نسبة المركبات الثقيلة، النمو، فترة التصميم، CBR، المناخ، التصريف، ومنهج التصميم المعتمد. الناتج سيكون فحصًا أوليًا فقط.",
    en: "Provide AADT, heavy-vehicle share, growth, design life, CBR, climate, drainage, and the approved design method. Output will be preliminary only.",
  },
  "Materials AI": {
    ar: "للمقارنة العادلة أحتاج المواصفة والدرجة والوحدة والكمية وموقع التسليم والشهادات المطلوبة. لن أقارن سعرين بمواصفات مختلفة على أنهما بديلان متساويان.",
    en: "For a fair comparison, provide specification, grade, unit, quantity, delivery location, and required certifications. Differing specifications will not be treated as equivalent.",
  },
  "BOQ AI": {
    ar: "ارفع BOQ أو الصق البنود، وحدد العملة والوحدات ونطاق المشروع. سأفصل القيم المستخرجة عن أي تقديرات، وأشير إلى البنود غير الواضحة للمراجعة.",
    en: "Upload or paste the BOQ, then specify currency, units, and project scope. Extracted values will remain separate from estimates, with ambiguous items flagged for review.",
  },
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { discipline?: string; message?: string; locale?: "ar" | "en" } | null;
  const message = payload?.message?.trim() ?? "";
  if (!message || message.length > 5000) return Response.json({ error: "A message between 1 and 5000 characters is required" }, { status: 400 });
  const locale = payload?.locale === "en" ? "en" : "ar";
  const discipline = disciplinePrompts[payload?.discipline ?? "Construction AI"] ?? disciplinePrompts["Construction AI"];
  return Response.json({
    reply: discipline[locale],
    mode: "safe_local_fallback",
    needs_clarification: true,
    external_ai_connected: false,
    disclaimer: locale === "ar" ? "نتيجة تقديرية وتعليمية تحتاج مراجعة مهندس مختص ومرخص." : "Preliminary educational output requiring review by a qualified, licensed engineer.",
  });
}
