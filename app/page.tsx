"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type Language = "ar" | "en";
type Theme = "light" | "dark";

const evidenceLinks = [
  "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  "https://www.cement.org/a-sustainable-future/reaching-our-goal/blended-cements/",
  "https://www.iea.org/reports/cement-3",
];

const sourceLinks = [
  "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  "https://www.cement.org/a-sustainable-future/reaching-our-goal/blended-cements/",
  "https://www.iea.org/reports/cement-3",
  "https://wedocs.unep.org/handle/20.500.11822/47261?show=full",
];

const sectionIds = new Set(["top", "program", "lab", "impact", "sources"]);

function scrollToCurrentHash(behavior: ScrollBehavior) {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash) return;

  let sectionId: string;
  try {
    sectionId = decodeURIComponent(rawHash);
  } catch {
    return;
  }

  if (!sectionIds.has(sectionId)) return;
  const target = document.getElementById(sectionId);
  if (!target) return;

  const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 12;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

const translations = {
  ar: {
    brand: "الاستدامة بالبناء 47",
    brandSub: "الدورة الصيفية",
    backToTopLabel: "العودة إلى بداية الموقع",
    navLabel: "التنقل الرئيسي",
    mobileNavLabel: "التنقل للجوال",
    nav: ["البرنامج", "تجربة الخلط", "الأثر بالأرقام", "المصادر"],
    menu: "القائمة",
    switchLanguage: "عرض الموقع بالإنجليزية",
    languageButton: "English",
    switchToDark: "تفعيل الوضع الداكن",
    switchToLight: "تفعيل الوضع الفاتح",
    dark: "داكن",
    light: "فاتح",
    hero: {
      eyebrow: "طلبة الدورة الصيفية 47",
      titleOne: "نصنع المعرفة.",
      titleTwo: "ونبني أثرًا يدوم.",
      lead: "في برنامج الاستدامة في البناء انتقلنا من السؤال إلى التجربة: تعلّمنا كيف تتكوّن المونة والخرسانة، وكيف يمكن لقرارات صغيرة في الخلطة أن تصنع فرقًا في الأداء والأثر.",
      primary: "اكتشف تجربتنا",
      secondary: "شاهد الأرقام",
    },
    visual: {
      label: "مختبر المواد",
      sublabel: "خلطة / قياس / مقارنة",
      concrete: "خرسانة",
      sample: "عينة",
      sand: "رمل",
      fine: "ناعم",
      aggregate: "ركام",
      graded: "متدرّج",
      binder: "مادة رابطة",
      measured: "محسوبة",
      aria: "تصور بصري لمكوّنات المونة والخرسانة",
    },
    ticker: ["قياس دقيق", "خلط واعٍ", "مواد بكفاءة", "أداء قابل للمقارنة"],
    program: {
      kicker: "عن البرنامج",
      title: "تجربة طلابية تبدأ من المادة نفسها.",
      introOne: "فهمنا أن الاستدامة في البناء ليست شكلًا أخضر يُضاف في النهاية؛ بل سلسلة قرارات تبدأ من اختيار المادة ونِسب الخلط وطريقة التنفيذ.",
      introTwo: "جمع البرنامج بين الشرح والتطبيق، فصنعنا المونة وتعرّفنا إلى مكوّنات الخلطات الخرسانية المستدامة وأهمية اختبارها قبل اعتمادها.",
      points: [
        { number: "01", title: "النِّسب تصنع الفرق", text: "تعلّمنا أن جودة الخلطة تبدأ من وزن المواد وتسجيلها بدقة، لا من التقدير العشوائي." },
        { number: "02", title: "الماء قرار هندسي", text: "زيادة الماء قد تسهّل الخلط لحظيًا، لكنها قد تغيّر الأداء؛ لذلك نضيفه تدريجيًا ونراقب القوام." },
        { number: "03", title: "الاستدامة أداءٌ وأثر", text: "الخلطة المستدامة لا تقلّل المواد بلا حساب؛ بل توازن بين المتانة، قابلية التشغيل والبصمة الكربونية." },
        { number: "04", title: "الاختبار قبل الحكم", text: "الملاحظة والقياس والمعالجة والمقارنة هي ما يحوّل الفكرة إلى نتيجة يمكن الوثوق بها." },
      ],
    },
    lab: {
      kicker: "داخل المختبر",
      titleOne: "مادتان.",
      titleTwo: "درس واحد: لا شيء عشوائي.",
      disclaimer: "المقادير الظاهرة هنا تعليمية لوصف المكوّنات، وليست وصفة تنفيذية. أي خلطة حقيقية يجب أن تُصمَّم وتُختبر وفق الاستخدام والمعايير المختصة.",
      mortar: { type: "مونة", title: "الطبقة التي تربط وتسوّي.", text: "تعرفنا إلى دور المادة الرابطة والرمل والماء، وكيف يتغيّر القوام مع النِّسب وطريقة الخلط.", tags: ["مادة رابطة", "رمل ناعم", "ماء محسوب"] },
      concrete: { type: "خرسانة مستدامة", title: "أداء مطلوب بمواد أكثر كفاءة.", text: "درسنا كيف يعمل الركام مع المادة الرابطة، ولماذا يقل الأثر عندما نقلّل الكلنكر أو نستخدم بدائل مناسبة مع الحفاظ على الأداء.", tags: ["ركام ناعم وخشن", "مادة رابطة محسّنة", "اختبار ومعالجة"] },
      processKicker: "من الفكرة إلى العيّنة",
      processTitle: "خمس خطوات جعلت الخلطة درسًا كاملًا.",
      steps: [
        { number: "١", title: "نحدّد الهدف", text: "هل نريد مونة سهلة التطبيق أم خرسانة متماسكة؟ نبدأ من الاستخدام المطلوب." },
        { number: "٢", title: "نزن المواد", text: "نسجّل المادة الرابطة والرمل والركام والماء حتى تصبح التجربة قابلة للتكرار." },
        { number: "٣", title: "نخلط بالتدرّج", text: "نمزج المكوّنات الجافة أولًا، ثم نضيف الماء تدريجيًا ونراقب التجانس." },
        { number: "٤", title: "نشكّل ونعالج", text: "نضع الخلطة في القالب بعناية ونحافظ على ظروف المعالجة المناسبة." },
        { number: "٥", title: "نقارن ونتعلّم", text: "نوثّق القوام والمظهر والنتائج، ثم نربط الأداء بكمية المواد وأثرها." },
      ],
    },
    impact: {
      kicker: "لماذا يهم ما تعلمناه؟",
      titleOne: "لأن أثر البناء",
      titleTwo: "أكبر من حجم العيّنة.",
      intro: "هذه أرقام عالمية من جهات موثوقة، وليست نتائج قياس خاصة بالدورة. وضعناها لتوضيح حجم الفرصة التي تبدأ من قرارات المواد والخلطات.",
      evidence: [
        { value: "37%", title: "من انبعاثات ثاني أكسيد الكربون عالميًا", text: "ترتبط بقطاع المباني والإنشاءات وفق أحدث تقرير عالمي للقطاع.", source: "UNEP · تقرير 2025–2026" },
        { value: "≈50%", title: "من استخراج المواد عالميًا", text: "يرتبط بقطاع المباني والإنشاءات، ما يجعل كفاءة استخدام المواد أولوية.", source: "UNEP · تقرير 2025–2026" },
        { value: "حتى 10%", title: "خفض في البصمة الكربونية للأسمنت", text: "عند استخدام الأسمنت البورتلاندي الجيري بدل البورتلاندي التقليدي في الخلطات المناسبة.", source: "American Cement Association" },
        { value: "0.71 → 0.65", title: "مسار خفض نسبة الكلنكر إلى الأسمنت", text: "من متوسط 2022 إلى المستوى المطلوب عالميًا في 2030 ضمن مسار صافي الصفر.", source: "IEA · Cement 2023" },
      ],
      comparisonKicker: "مثال تفاعلي",
      comparisonTitle: "غيّر النسبة وشاهد أثرها على المؤشر.",
      comparisonText: (reduction: number, score: number) => `عند اختيار خفض توضيحي بنسبة ${reduction}% ينتقل مؤشر البصمة من 100 إلى ${score}. هذا تمثيل تعليمي فقط؛ النتيجة الفعلية تعتمد على تصميم الخلطة والمواد المحلية وبيانات المنتج.`,
      sliderLabel: "نسبة الخفض التوضيحية",
      conventional: "تقليدي",
      lowerCarbon: "أقل كربونًا",
      comparisonAria: "مقارنة تفاعلية لمؤشر البصمة الكربونية",
    },
    sources: {
      kicker: "اقرأ وتحقّق",
      title: "المصادر وراء الأرقام.",
      intro: "روابط مباشرة إلى الصفحات الأصلية المستخدمة. نعرض الأرقام للتوعية، مع إبقاء المصدر متاحًا للمراجعة.",
      items: [
        { tag: "تقرير عالمي", title: "حالة المباني والإنشاءات 2025–2026", publisher: "برنامج الأمم المتحدة للبيئة · UNEP" },
        { tag: "مواد البناء", title: "الأسمنت المخلوط واستدامة الخرسانة", publisher: "American Cement Association" },
        { tag: "مسار تقني", title: "الأسمنت في مسار صافي الانبعاثات الصفري", publisher: "وكالة الطاقة الدولية · IEA" },
        { tag: "ملخص بيانات", title: "الرسائل الرئيسية للمباني والإنشاءات 2024–2025", publisher: "UNEP + GlobalABC" },
      ],
    },
    closing: { kicker: "الخلاصة", start: "الاستدامة ليست مادة سحرية؛ إنها ", emphasis: "قياسٌ أفضل، خلطةٌ أوعى، وقرارٌ يمكن اختباره." },
    footer: "طلبة الدورة الصيفية 47 · برنامج الاستدامة في البناء",
    backToTop: "إلى الأعلى ↑",
  },
  en: {
    brand: "Sustainable Construction 47",
    brandSub: "Summer Course",
    backToTopLabel: "Back to the top",
    navLabel: "Main navigation",
    mobileNavLabel: "Mobile navigation",
    nav: ["Program", "Mixing Experience", "Impact in Numbers", "Sources"],
    menu: "Menu",
    switchLanguage: "عرض الموقع بالعربية",
    languageButton: "العربية",
    switchToDark: "Enable dark mode",
    switchToLight: "Enable light mode",
    dark: "Dark",
    light: "Light",
    hero: {
      eyebrow: "Summer Course 47 Students",
      titleOne: "We create knowledge.",
      titleTwo: "We build an impact that lasts.",
      lead: "In the sustainable construction program, we moved from questions to experiments. We learned how mortar and concrete are made, and how small mix-design decisions can change both performance and environmental impact.",
      primary: "Explore our experience",
      secondary: "See the numbers",
    },
    visual: {
      label: "Materials Lab",
      sublabel: "Mix / Measure / Compare",
      concrete: "Concrete",
      sample: "Sample",
      sand: "Sand",
      fine: "Fine",
      aggregate: "Aggregate",
      graded: "Graded",
      binder: "Binder",
      measured: "Measured",
      aria: "Visual interpretation of mortar and concrete components",
    },
    ticker: ["Accurate measurement", "Purposeful mixing", "Material efficiency", "Comparable performance"],
    program: {
      kicker: "About the Program",
      title: "A student experience that starts with the material itself.",
      introOne: "We learned that sustainable construction is not a green layer added at the end. It is a chain of decisions that begins with material selection, mix ratios and execution.",
      introTwo: "The program joined explanation with practice. We made mortar, explored sustainable concrete components and learned why every mix must be tested before it is adopted.",
      points: [
        { number: "01", title: "Ratios make the difference", text: "A good mix begins with weighing and recording materials accurately, not with guesswork." },
        { number: "02", title: "Water is an engineering decision", text: "Extra water may help briefly, but it can change performance. We add it gradually and monitor consistency." },
        { number: "03", title: "Sustainability means performance and impact", text: "A sustainable mix balances durability, workability and carbon footprint instead of simply removing materials." },
        { number: "04", title: "Test before you judge", text: "Observation, measurement, curing and comparison turn an idea into a result we can trust." },
      ],
    },
    lab: {
      kicker: "Inside the Lab",
      titleOne: "Two materials.",
      titleTwo: "One lesson: nothing is random.",
      disclaimer: "The components shown here are educational, not an executable recipe. A real mix must be designed and tested for its intended use and applicable standards.",
      mortar: { type: "Mortar", title: "The layer that bonds and levels.", text: "We explored the roles of binder, sand and water, and how consistency changes with ratios and mixing method.", tags: ["Binder", "Fine sand", "Measured water"] },
      concrete: { type: "Sustainable concrete", title: "Required performance with more efficient materials.", text: "We studied how aggregate works with the binder, and why reducing clinker or using suitable alternatives can lower impact while maintaining performance.", tags: ["Fine and coarse aggregate", "Improved binder", "Testing and curing"] },
      processKicker: "From idea to sample",
      processTitle: "Five steps turned each mix into a complete lesson.",
      steps: [
        { number: "1", title: "Define the goal", text: "Do we need workable mortar or cohesive concrete? We begin with the intended use." },
        { number: "2", title: "Weigh the materials", text: "We record binder, sand, aggregate and water so the experiment can be repeated." },
        { number: "3", title: "Mix gradually", text: "We combine dry components first, then add water gradually and monitor uniformity." },
        { number: "4", title: "Cast and cure", text: "We place the mix carefully in its mould and maintain suitable curing conditions." },
        { number: "5", title: "Compare and learn", text: "We document consistency, appearance and results, then connect performance to material use and impact." },
      ],
    },
    impact: {
      kicker: "Why does our learning matter?",
      titleOne: "Because construction's impact",
      titleTwo: "is bigger than the sample.",
      intro: "These are global figures from trusted organizations, not measurements from the course. They show the scale of the opportunity that begins with material and mix decisions.",
      evidence: [
        { value: "37%", title: "of global carbon dioxide emissions", text: "is linked to the buildings and construction sector in the latest global status report.", source: "UNEP · 2025–2026 Report" },
        { value: "≈50%", title: "of global material extraction", text: "is associated with buildings and construction, making material efficiency a priority.", source: "UNEP · 2025–2026 Report" },
        { value: "Up to 10%", title: "lower cement carbon footprint", text: "when portland-limestone cement replaces ordinary portland cement in suitable concrete mixes.", source: "American Cement Association" },
        { value: "0.71 → 0.65", title: "clinker-to-cement ratio pathway", text: "from the 2022 average to the 2030 level needed under the global net-zero pathway.", source: "IEA · Cement 2023" },
      ],
      comparisonKicker: "Interactive example",
      comparisonTitle: "Move the slider and see the index change.",
      comparisonText: (reduction: number, score: number) => `At an illustrative ${reduction}% reduction, the footprint index moves from 100 to ${score}. This is an educational visualization; actual results depend on mix design, local materials and product data.`,
      sliderLabel: "Illustrative reduction",
      conventional: "Conventional",
      lowerCarbon: "Lower carbon",
      comparisonAria: "Interactive carbon footprint index comparison",
    },
    sources: {
      kicker: "Read and Verify",
      title: "The sources behind the numbers.",
      intro: "Direct links to the original pages used. The figures are presented for learning, and every source remains available for review.",
      items: [
        { tag: "Global report", title: "Global Status Report for Buildings and Construction 2025–2026", publisher: "United Nations Environment Programme · UNEP" },
        { tag: "Building materials", title: "Blended Cement and Sustainable Concrete", publisher: "American Cement Association" },
        { tag: "Technical pathway", title: "Cement on the Net Zero Emissions Pathway", publisher: "International Energy Agency · IEA" },
        { tag: "Data summary", title: "Buildings and Construction Key Messages 2024–2025", publisher: "UNEP + GlobalABC" },
      ],
    },
    closing: { kicker: "The takeaway", start: "Sustainability is not a magic material. It is ", emphasis: "better measurement, a smarter mix and a decision we can test." },
    footer: "Summer Course 47 Students · Sustainable Construction Program",
    backToTop: "Back to top ↑",
  },
} as const;

function Logo({ language }: { language: Language }) {
  const t = translations[language];
  return (
    <span className="site-logo">
      <span className="logo-mark" aria-hidden="true">
        <b>47</b><i /><i /><i />
      </span>
      <span className="logo-copy">
        <strong>{t.brand}</strong>
        <small>{t.brandSub}</small>
      </span>
    </span>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [reduction, setReduction] = useState(10);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const t = translations[language];
  const score = 100 - reduction;
  const sectionLinks = ["#program", "#lab", "#impact", "#sources"];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLanguage = window.localStorage.getItem("kisr47-language");
      const savedTheme = window.localStorage.getItem("kisr47-theme");
      const detectedTheme = document.documentElement.dataset.theme;
      if (savedLanguage === "en" || savedLanguage === "ar") setLanguage(savedLanguage);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      else if (detectedTheme === "dark") setTheme("dark");
      setPreferencesReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = language === "ar"
      ? "الاستدامة بالبناء 47 | من الخلطة إلى أثر يدوم"
      : "Sustainable Construction 47 | From the Mix to Lasting Impact";
    window.localStorage.setItem("kisr47-language", language);
  }, [language, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("kisr47-theme", theme);
  }, [theme, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) return;
    let secondFrame: number | undefined;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => scrollToCurrentHash("auto"));
    });
    const handleHashChange = () => {
      window.requestAnimationFrame(() => scrollToCurrentHash("smooth"));
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") mobileMenuRef.current?.removeAttribute("open");
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    window.addEventListener("pageshow", handleHashChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
      window.removeEventListener("pageshow", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [preferencesReady]);

  const closeMobileMenuAfterNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.blur();
    window.setTimeout(() => mobileMenuRef.current?.removeAttribute("open"), 0);
  };

  return (
    <main id="top" className="site-shell" data-language={language}>
      <header className="site-header">
        <a className="brand-link" href="#top" aria-label={t.backToTopLabel}><Logo language={language} /></a>

        <nav className="desktop-nav" aria-label={t.navLabel}>
          {t.nav.map((label, index) => <a href={sectionLinks[index]} key={sectionLinks[index]}>{label}</a>)}
        </nav>

        <div className="header-controls">
          <button className="control-button" type="button" onClick={() => setLanguage(language === "ar" ? "en" : "ar")} aria-label={t.switchLanguage}>
            <span className="control-icon" aria-hidden="true">文</span><span className="control-label">{t.languageButton}</span>
          </button>
          <button className="control-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? t.switchToDark : t.switchToLight} aria-pressed={theme === "dark"}>
            <span className="control-icon" aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span><span className="control-label">{theme === "light" ? t.dark : t.light}</span>
          </button>
        </div>

        <details className="mobile-nav" ref={mobileMenuRef}>
          <summary aria-label={t.menu}>{t.menu} <span aria-hidden="true">☰</span></summary>
          <nav aria-label={t.mobileNavLabel}>
            {t.nav.map((label, index) => <a href={sectionLinks[index]} key={sectionLinks[index]} onClick={closeMobileMenuAfterNavigation}>{label}</a>)}
          </nav>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true" />{t.hero.eyebrow}</p>
          <h1 id="hero-title">{t.hero.titleOne}<em>{t.hero.titleTwo}</em></h1>
          <p className="hero-lead">{t.hero.lead}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#program">{t.hero.primary}<span aria-hidden="true">↓</span></a>
            <a className="button button-ghost" href="#impact">{t.hero.secondary}<span aria-hidden="true">{language === "ar" ? "←" : "→"}</span></a>
          </div>
        </div>

        <div className="mix-visual" aria-label={t.visual.aria}>
          <div className="visual-label"><span>{t.visual.label}</span><b>{t.visual.sublabel}</b></div>
          <div className="mix-ring ring-one" aria-hidden="true" /><div className="mix-ring ring-two" aria-hidden="true" />
          <div className="sample sample-cube" aria-hidden="true"><span>{t.visual.concrete}</span></div>
          <div className="sample sample-cylinder" aria-hidden="true"><span>{t.visual.sample}</span></div>
          <div className="ingredient ingredient-sand">{t.visual.sand}<b>{t.visual.fine}</b></div>
          <div className="ingredient ingredient-aggregate">{t.visual.aggregate}<b>{t.visual.graded}</b></div>
          <div className="ingredient ingredient-binder">{t.visual.binder}<b>{t.visual.measured}</b></div>
          <div className="visual-stamp" aria-hidden="true">47</div>
        </div>
      </section>

      <section className="ticker" aria-label={t.navLabel}>
        {t.ticker.map((item, index) => <span className="ticker-item" key={item}>{item}{index < t.ticker.length - 1 && <i aria-hidden="true" />}</span>)}
      </section>

      <section className="program-section" id="program">
        <div className="section-heading">
          <div><p className="section-kicker">{t.program.kicker}</p><h2>{t.program.title}</h2></div>
          <div className="section-intro"><p>{t.program.introOne}</p><p>{t.program.introTwo}</p></div>
        </div>
        <div className="learning-grid">
          {t.program.points.map((point) => <article key={point.number}><span>{point.number}</span><h3>{point.title}</h3><p>{point.text}</p></article>)}
        </div>
      </section>

      <section className="lab-section" id="lab">
        <div className="lab-title">
          <p className="section-kicker section-kicker-light">{t.lab.kicker}</p>
          <h2>{t.lab.titleOne}<br /><em>{t.lab.titleTwo}</em></h2>
          <p>{t.lab.disclaimer}</p>
        </div>
        <div className="material-cards">
          <article className="material-card mortar-card">
            <div className="material-number">01</div><div className="material-icon mortar-icon" aria-hidden="true"><i /><i /><i /></div>
            <p className="material-type">{t.lab.mortar.type}</p><h3>{t.lab.mortar.title}</h3><p>{t.lab.mortar.text}</p>
            <ul>{t.lab.mortar.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          </article>
          <article className="material-card concrete-card">
            <div className="material-number">02</div><div className="material-icon concrete-icon" aria-hidden="true"><i /><i /><i /><i /></div>
            <p className="material-type">{t.lab.concrete.type}</p><h3>{t.lab.concrete.title}</h3><p>{t.lab.concrete.text}</p>
            <ul>{t.lab.concrete.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          </article>
        </div>
        <div className="process-block">
          <div className="process-copy"><span>{t.lab.processKicker}</span><h3>{t.lab.processTitle}</h3></div>
          <ol className="process-list">{t.lab.steps.map((step) => <li key={step.number}><span>{step.number}</span><div><h4>{step.title}</h4><p>{step.text}</p></div></li>)}</ol>
        </div>
      </section>

      <section className="impact-section" id="impact">
        <div className="impact-heading">
          <p className="section-kicker section-kicker-light">{t.impact.kicker}</p>
          <h2>{t.impact.titleOne}<br /><em>{t.impact.titleTwo}</em></h2><p>{t.impact.intro}</p>
        </div>
        <div className="evidence-grid">
          {t.impact.evidence.map((item, index) => (
            <article key={item.value + item.title}><div className="evidence-value" dir="ltr">{item.value}</div><h3>{item.title}</h3><p>{item.text}</p><a href={evidenceLinks[index]} target="_blank" rel="noreferrer">{item.source}<span aria-hidden="true">↗</span></a></article>
          ))}
        </div>
        <div className="comparison-card">
          <div><span>{t.impact.comparisonKicker}</span><h3>{t.impact.comparisonTitle}</h3><p aria-live="polite">{t.impact.comparisonText(reduction, score)}</p></div>
          <div className="comparison-interactive">
            <label htmlFor="reduction-range"><span>{t.impact.sliderLabel}</span><b>{reduction}%</b></label>
            <input id="reduction-range" type="range" min="0" max="10" step="1" value={reduction} onChange={(event) => setReduction(Number(event.target.value))} dir="ltr" />
            <div className="range-scale" dir="ltr"><span>0%</span><span>10%</span></div>
            <div className="comparison-bars" aria-label={t.impact.comparisonAria}>
              <div><span>{t.impact.conventional}</span><i style={{ width: "100%" }} /><b>100</b></div>
              <div><span>{t.impact.lowerCarbon}</span><i style={{ width: `${score}%` }} /><b>{score}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="sources-heading"><p className="section-kicker">{t.sources.kicker}</p><h2>{t.sources.title}</h2><p>{t.sources.intro}</p></div>
        <div className="source-list">
          {t.sources.items.map((source, index) => <a href={sourceLinks[index]} target="_blank" rel="noreferrer" key={source.title}><span className="source-index">0{index + 1}</span><span className="source-tag">{source.tag}</span><span><strong>{source.title}</strong><small>{source.publisher}</small></span><b aria-hidden="true">↗</b></a>)}
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-mark" aria-hidden="true">47</div><div><p>{t.closing.kicker}</p><blockquote>{t.closing.start}<em>{t.closing.emphasis}</em></blockquote></div>
      </section>

      <footer><Logo language={language} /><p>{t.footer}</p><a href="#top">{t.backToTop}</a></footer>
    </main>
  );
}
