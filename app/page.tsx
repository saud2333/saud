const learningPoints = [
  {
    number: "01",
    title: "النِّسب تصنع الفرق",
    text: "تعلّمنا أن جودة الخلطة تبدأ من وزن المواد وتسجيلها بدقة، لا من التقدير العشوائي.",
  },
  {
    number: "02",
    title: "الماء قرار هندسي",
    text: "زيادة الماء قد تسهّل الخلط لحظيًا، لكنها قد تغيّر الأداء؛ لذلك نضيفه تدريجيًا ونراقب القوام.",
  },
  {
    number: "03",
    title: "الاستدامة أداءٌ وأثر",
    text: "الخلطة المستدامة لا تقلّل المواد بلا حساب؛ بل توازن بين المتانة، قابلية التشغيل والبصمة الكربونية.",
  },
  {
    number: "04",
    title: "الاختبار قبل الحكم",
    text: "الملاحظة والقياس والمعالجة والمقارنة هي ما يحوّل الفكرة إلى نتيجة يمكن الوثوق بها.",
  },
];

const labSteps = [
  {
    number: "١",
    title: "نحدّد الهدف",
    text: "هل نريد مونة سهلة التطبيق أم خرسانة متماسكة؟ نبدأ من الاستخدام المطلوب.",
  },
  {
    number: "٢",
    title: "نزن المواد",
    text: "نسجّل المادة الرابطة والرمل والركام والماء حتى تصبح التجربة قابلة للتكرار.",
  },
  {
    number: "٣",
    title: "نخلط بالتدرّج",
    text: "نمزج المكوّنات الجافة أولًا، ثم نضيف الماء تدريجيًا ونراقب التجانس.",
  },
  {
    number: "٤",
    title: "نشكّل ونعالج",
    text: "نضع الخلطة في القالب بعناية ونحافظ على ظروف المعالجة المناسبة.",
  },
  {
    number: "٥",
    title: "نقارن ونتعلّم",
    text: "نوثّق القوام والمظهر والنتائج، ثم نربط الأداء بكمية المواد وأثرها.",
  },
];

type EvidenceItem = {
  value: string;
  title: string;
  text: string;
  source: string;
  href: string;
  valueDirection?: "ltr" | "rtl";
};

const evidence: EvidenceItem[] = [
  {
    value: "37%",
    title: "من انبعاثات ثاني أكسيد الكربون عالميًا",
    text: "ترتبط بقطاع المباني والإنشاءات وفق أحدث تقرير عالمي للقطاع.",
    source: "UNEP · تقرير 2025–2026",
    href: "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  },
  {
    value: "≈50%",
    title: "من استخراج المواد عالميًا",
    text: "يرتبط بقطاع المباني والإنشاءات، ما يجعل كفاءة استخدام المواد أولوية.",
    source: "UNEP · تقرير 2025–2026",
    href: "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  },
  {
    value: "حتى 10%",
    title: "خفض في البصمة الكربونية للأسمنت",
    text: "عند استخدام الأسمنت البورتلاندي الجيري بدل البورتلاندي التقليدي في الخلطات المناسبة.",
    source: "American Cement Association",
    href: "https://www.cement.org/a-sustainable-future/reaching-our-goal/blended-cements/",
  },
  {
    value: "0.71 → 0.65",
    valueDirection: "ltr",
    title: "مسار خفض نسبة الكلنكر إلى الأسمنت",
    text: "من متوسط 2022 إلى المستوى المطلوب عالميًا في 2030 ضمن مسار صافي الصفر.",
    source: "IEA · Cement 2023",
    href: "https://www.iea.org/reports/cement-3",
  },
];

const sourceLibrary = [
  {
    tag: "تقرير عالمي",
    title: "حالة المباني والإنشاءات 2025–2026",
    publisher: "برنامج الأمم المتحدة للبيئة · UNEP",
    href: "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-2025-2026",
  },
  {
    tag: "مواد البناء",
    title: "الأسمنت المخلوط واستدامة الخرسانة",
    publisher: "American Cement Association",
    href: "https://www.cement.org/a-sustainable-future/reaching-our-goal/blended-cements/",
  },
  {
    tag: "مسار تقني",
    title: "الأسمنت في مسار صافي الانبعاثات الصفري",
    publisher: "وكالة الطاقة الدولية · IEA",
    href: "https://www.iea.org/reports/cement-3",
  },
  {
    tag: "ملخص بيانات",
    title: "الرسائل الرئيسية للمباني والإنشاءات 2024–2025",
    publisher: "UNEP + GlobalABC",
    href: "https://wedocs.unep.org/handle/20.500.11822/47261?show=full",
  },
];

function Logo() {
  return (
    <span className="site-logo">
      <span className="logo-mark" aria-hidden="true">
        <b>47</b>
        <i />
        <i />
        <i />
      </span>
      <span className="logo-copy">
        <strong>الاستدامة بالبناء 47</strong>
        <small>الدورة الصيفية</small>
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="العودة إلى بداية الموقع">
          <Logo />
        </a>

        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <a href="#program">البرنامج</a>
          <a href="#lab">تجربة الخلط</a>
          <a href="#impact">الأثر بالأرقام</a>
          <a href="#sources">المصادر</a>
        </nav>

        <a className="header-link" href="#lab">
          ادخل المختبر
          <span aria-hidden="true">↙</span>
        </a>

        <details className="mobile-nav">
          <summary aria-label="فتح قائمة التنقل">القائمة <span aria-hidden="true">☰</span></summary>
          <nav aria-label="التنقل للجوال">
            <a href="#program">البرنامج</a>
            <a href="#lab">تجربة الخلط</a>
            <a href="#impact">الأثر بالأرقام</a>
            <a href="#sources">المصادر</a>
          </nav>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true" /> طلبة الدورة الصيفية 47</p>
          <h1 id="hero-title">
            نخلط المعرفة.
            <em>ونبني أثرًا أقل.</em>
          </h1>
          <p className="hero-lead">
            في برنامج الاستدامة في البناء انتقلنا من السؤال إلى التجربة: تعلّمنا كيف تتكوّن
            المونة والخرسانة، وكيف يمكن لقرارات صغيرة في الخلطة أن تصنع فرقًا في الأداء والأثر.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#program">اكتشف تجربتنا <span aria-hidden="true">↓</span></a>
            <a className="button button-ghost" href="#impact">شاهد الأرقام <span aria-hidden="true">←</span></a>
          </div>
          <div className="hero-meta" aria-label="ملخص البرنامج">
            <span><b>47</b> دورة صيفية</span>
            <span><b>2</b> أنواع خلطات</span>
            <span><b>5</b> مراحل عملية</span>
          </div>
        </div>

        <div className="mix-visual" aria-label="تصور بصري لمكوّنات المونة والخرسانة">
          <div className="visual-label"><span>مختبر المواد</span><b>خلطة / قياس / مقارنة</b></div>
          <div className="mix-ring ring-one" aria-hidden="true" />
          <div className="mix-ring ring-two" aria-hidden="true" />
          <div className="sample sample-cube" aria-hidden="true"><span>خرسانة</span></div>
          <div className="sample sample-cylinder" aria-hidden="true"><span>عينة</span></div>
          <div className="ingredient ingredient-sand">رمل <b>ناعم</b></div>
          <div className="ingredient ingredient-aggregate">ركام <b>متدرّج</b></div>
          <div className="ingredient ingredient-binder">مادة رابطة <b>محسوبة</b></div>
          <div className="visual-stamp" aria-hidden="true">47</div>
        </div>
      </section>

      <section className="ticker" aria-label="مبادئ البرنامج">
        <span>قياس دقيق</span><i aria-hidden="true" />
        <span>خلط واعٍ</span><i aria-hidden="true" />
        <span>مواد بكفاءة</span><i aria-hidden="true" />
        <span>أداء قابل للمقارنة</span>
      </section>

      <section className="program-section" id="program">
        <div className="section-heading">
          <div>
            <p className="section-kicker">عن البرنامج</p>
            <h2>تجربة طلابية تبدأ من المادة نفسها.</h2>
          </div>
          <div className="section-intro">
            <p>فهمنا أن الاستدامة في البناء ليست شكلًا أخضر يُضاف في النهاية؛ بل سلسلة قرارات تبدأ من اختيار المادة ونِسب الخلط وطريقة التنفيذ.</p>
            <p>جمع البرنامج بين الشرح والتطبيق، فصنعنا المونة وتعرّفنا إلى مكوّنات الخلطات الخرسانية المستدامة وأهمية اختبارها قبل اعتمادها.</p>
          </div>
        </div>

        <div className="learning-grid">
          {learningPoints.map((point) => (
            <article key={point.number}>
              <span>{point.number}</span>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lab-section" id="lab">
        <div className="lab-title">
          <p className="section-kicker section-kicker-light">داخل المختبر</p>
          <h2>مادتان.<br /><em>درس واحد: لا شيء عشوائي.</em></h2>
          <p>المقادير الظاهرة هنا تعليمية لوصف المكوّنات، وليست وصفة تنفيذية. أي خلطة حقيقية يجب أن تُصمَّم وتُختبر وفق الاستخدام والمعايير المختصة.</p>
        </div>

        <div className="material-cards">
          <article className="material-card mortar-card">
            <div className="material-number">01</div>
            <div className="material-icon mortar-icon" aria-hidden="true"><i /><i /><i /></div>
            <p className="material-type">مونة</p>
            <h3>الطبقة التي تربط وتسوّي.</h3>
            <p>تعرفنا إلى دور المادة الرابطة والرمل والماء، وكيف يتغيّر القوام مع النِّسب وطريقة الخلط.</p>
            <ul>
              <li>مادة رابطة</li>
              <li>رمل ناعم</li>
              <li>ماء محسوب</li>
            </ul>
          </article>

          <article className="material-card concrete-card">
            <div className="material-number">02</div>
            <div className="material-icon concrete-icon" aria-hidden="true"><i /><i /><i /><i /></div>
            <p className="material-type">خرسانة مستدامة</p>
            <h3>أداء مطلوب بمواد أكثر كفاءة.</h3>
            <p>درسنا كيف يعمل الركام مع المادة الرابطة، ولماذا يقل الأثر عندما نقلّل الكلنكر أو نستخدم بدائل مناسبة مع الحفاظ على الأداء.</p>
            <ul>
              <li>ركام ناعم وخشن</li>
              <li>مادة رابطة محسّنة</li>
              <li>اختبار ومعالجة</li>
            </ul>
          </article>
        </div>

        <div className="process-block">
          <div className="process-copy">
            <span>من الفكرة إلى العيّنة</span>
            <h3>خمس خطوات جعلت الخلطة درسًا كاملًا.</h3>
          </div>
          <ol className="process-list">
            {labSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><h4>{step.title}</h4><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="impact-section" id="impact">
        <div className="impact-heading">
          <p className="section-kicker section-kicker-light">لماذا يهم ما تعلمناه؟</p>
          <h2>لأن أثر البناء<br /><em>أكبر من حجم العيّنة.</em></h2>
          <p>هذه أرقام عالمية من جهات موثوقة، وليست نتائج قياس خاصة بالدورة. وضعناها لتوضيح حجم الفرصة التي تبدأ من قرارات المواد والخلطات.</p>
        </div>

        <div className="evidence-grid">
          {evidence.map((item) => (
            <article key={item.value + item.title}>
              <div className="evidence-value" dir={item.valueDirection}>{item.value}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a href={item.href} target="_blank" rel="noreferrer">{item.source} <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>

        <div className="comparison-card">
          <div>
            <span>مثال توضيحي</span>
            <h3>إذا اعتبرنا البصمة الأساسية 100 نقطة…</h3>
            <p>فإن خفضًا يصل إلى 10% باستخدام الأسمنت البورتلاندي الجيري في تطبيق مناسب يعني اقتراب المؤشر من 90 نقطة. النتيجة الفعلية تعتمد على تصميم الخلطة والمواد المحلية وبيانات المنتج.</p>
          </div>
          <div className="comparison-bars" aria-label="مقارنة توضيحية بين مؤشر بصمة 100 و90">
            <div><span>تقليدي</span><i style={{ width: "100%" }} /><b>100</b></div>
            <div><span>أقل كربونًا</span><i style={{ width: "90%" }} /><b>90</b></div>
          </div>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="sources-heading">
          <p className="section-kicker">اقرأ وتحقّق</p>
          <h2>المصادر وراء الأرقام.</h2>
          <p>روابط مباشرة إلى الصفحات الأصلية المستخدمة. نعرض الأرقام للتوعية، مع إبقاء المصدر متاحًا للمراجعة.</p>
        </div>
        <div className="source-list">
          {sourceLibrary.map((source, index) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.title}>
              <span className="source-index">0{index + 1}</span>
              <span className="source-tag">{source.tag}</span>
              <span><strong>{source.title}</strong><small>{source.publisher}</small></span>
              <b aria-hidden="true">↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-mark" aria-hidden="true">47</div>
        <div>
          <p>الخلاصة</p>
          <blockquote>الاستدامة ليست مادة سحرية؛ إنها <em>قياسٌ أفضل، خلطةٌ أوعى، وقرارٌ يمكن اختباره.</em></blockquote>
        </div>
      </section>

      <footer>
        <Logo />
        <p>طلبة الدورة الصيفية 47 · برنامج الاستدامة في البناء</p>
        <a href="#top">إلى الأعلى ↑</a>
      </footer>
    </main>
  );
}
