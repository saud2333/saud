import Image from "next/image";

const focusAreas = [
  {
    number: "01",
    title: "الأداء البيئي",
    text: "قراءة أثر المبنى على امتداد دورة حياته، من الفكرة وحتى التشغيل.",
  },
  {
    number: "02",
    title: "كفاءة الموارد",
    text: "تقليل الهدر في الطاقة والمياه والمواد عبر قرارات قابلة للقياس.",
  },
  {
    number: "03",
    title: "جودة الحياة",
    text: "بيئات داخلية أكثر راحة وصحة، مصممة حول الإنسان والمناخ.",
  },
  {
    number: "04",
    title: "قابلية التطبيق",
    text: "حلول عملية تراعي الواقع المحلي وتنتقل من التوصية إلى التنفيذ.",
  },
];

const methodSteps = [
  {
    number: "١",
    title: "نقرأ الواقع",
    text: "نفهم الموقع والمناخ والاستخدام، ونحدد نقطة البداية بدقة.",
  },
  {
    number: "٢",
    title: "نقيس الأثر",
    text: "نحوّل الملاحظات إلى مؤشرات واضحة يمكن مقارنتها ومتابعتها.",
  },
  {
    number: "٣",
    title: "نختبر الحلول",
    text: "نوازن بين الأداء والكلفة والتجربة قبل اعتماد أي قرار.",
  },
  {
    number: "٤",
    title: "نصمم للتطبيق",
    text: "نترجم النتائج إلى توصيات وخطوات تنفيذ تناسب المشروع.",
  },
];

const storyCards = [
  {
    label: "القصة",
    title: "لماذا بدأ البرنامج؟",
    text: "نضع خلفية المبادرة، التحدي الذي انطلقت منه، والطموح الذي يجمع الفريق.",
  },
  {
    label: "العمل",
    title: "ماذا فعلنا؟",
    text: "نرتب الدراسات والتجارب والقرارات في تسلسل بسيط يسهل فهمه واستكشافه.",
  },
  {
    label: "الأثر",
    title: "ماذا تغيّر؟",
    text: "نحوّل النتائج الفعلية إلى مؤشرات بصرية واضحة، مع مقارنة قبل وبعد.",
  },
];

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="العودة إلى بداية الصفحة">
          <span className="brand-mark" aria-hidden="true">
            س
          </span>
          <span>
            <strong>استدامة البناء</strong>
            <small>نحو أثر يدوم</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <a href="#program">البرنامج</a>
          <a href="#method">منهجيتنا</a>
          <a href="#story">قصة الأثر</a>
          <a href="#next">الخطوة القادمة</a>
        </nav>

        <a className="header-cta" href="#story">
          استكشف التصوّر
          <span aria-hidden="true">←</span>
        </a>

        <details className="mobile-nav">
          <summary aria-label="فتح قائمة التنقل">
            <span aria-hidden="true">≡</span>
            القائمة
          </summary>
          <nav aria-label="التنقل للجوال">
            <a href="#program">البرنامج</a>
            <a href="#method">منهجيتنا</a>
            <a href="#story">قصة الأثر</a>
            <a href="#next">الخطوة القادمة</a>
          </nav>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span aria-hidden="true" />
            نسخة مبدئية · برنامج الاستدامة في البناء
          </div>
          <h1 id="hero-title">
            نبني اليوم.
            <br />
            <em>ليدوم الأثر غدًا.</em>
          </h1>
          <p>
            برنامج يحوّل الاستدامة من فكرة طموحة إلى قرارات واضحة في التصميم
            والتنفيذ والتشغيل — لبيئة مبنية أكثر كفاءة ومرونة.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#program">
              اكتشف البرنامج
              <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="#story">
              شاهد هيكل النتائج
              <span aria-hidden="true">←</span>
            </a>
          </div>
          <div className="hero-note">
            <span>تصوّر قابل للتطوير</span>
            <p>سيُحدّث المحتوى وتُضاف الأرقام فور استلام تفاصيل البرنامج.</p>
          </div>
        </div>

        <figure className="hero-visual">
          <Image
            src="/hero-sustainability.png"
            alt="تصور معماري لمبنى مستدام ملائم للمناخ الصحراوي في الكويت"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
          />
          <figcaption>
            <span>بيئة مبنية</span>
            <strong>تعمل مع المناخ، لا ضده.</strong>
          </figcaption>
        </figure>
      </section>

      <section className="focus-strip" aria-label="محاور البرنامج">
        {focusAreas.map((area) => (
          <article key={area.number}>
            <span>{area.number}</span>
            <div>
              <h2>{area.title}</h2>
              <p>{area.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="program-section" id="program">
        <div className="section-intro">
          <div>
            <span className="section-kicker">عن البرنامج</span>
            <h2>
              الاستدامة ليست إضافة
              <br />
              <em>في نهاية المشروع.</em>
            </h2>
          </div>
          <div className="intro-copy">
            <p className="lead">
              هي طريقة لاتخاذ قرار أفضل منذ اللحظة الأولى.
            </p>
            <p>
              يجمع البرنامج بين المعرفة الهندسية، فهم المناخ المحلي، وقياس
              الأداء ليصنع مسارًا متكاملًا يمكن تطبيقه وتطويره ومشاركة أثره.
            </p>
          </div>
        </div>

        <div className="principles-board">
          <div className="board-main">
            <span className="board-index">01 — 04</span>
            <p>من الاستهلاك إلى الكفاءة</p>
            <p>من التوصيات إلى التطبيق</p>
            <p>من مبنى منفرد إلى معرفة قابلة للتكرار</p>
          </div>
          <aside>
            <span>المعادلة التي تقودنا</span>
            <strong>
              أداء أفضل
              <b>+</b>
              موارد أقل
              <b>+</b>
              تجربة إنسانية
            </strong>
          </aside>
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="section-heading">
          <span className="section-kicker light">منهجية العمل</span>
          <h2>
            خطوات واضحة.
            <br />
            <em>قرارات محسوبة.</em>
          </h2>
          <p>
            رحلة مترابطة تجعل الاستدامة جزءًا من عملية المشروع، لا تقريرًا
            منفصلًا عنها.
          </p>
        </div>

        <div className="method-grid">
          {methodSteps.map((step) => (
            <article key={step.number}>
              <span className="step-number">{step.number}</span>
              <div className="step-line" aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-heading">
          <span className="section-kicker">قصة الأثر</span>
          <h2>
            كل ما أنجزتموه،
            <br />
            <em>في قصة تستحق أن تُرى.</em>
          </h2>
          <p>
            صُممت هذه المساحات لتستوعب التفاصيل الحقيقية فور تزويدنا بها،
            من دون الحاجة إلى إعادة بناء الموقع من الصفر.
          </p>
        </div>

        <div className="story-cards">
          {storyCards.map((card, index) => (
            <article key={card.label}>
              <div className="card-top">
                <span>{card.label}</span>
                <b>0{index + 1}</b>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <small>يُستكمل عند استلام بيانات البرنامج</small>
            </article>
          ))}
        </div>

        <div className="impact-preview">
          <div className="impact-copy">
            <span>معاينة لوحة النتائج</span>
            <h3>الأرقام عندما تصبح دليلًا على التغيير.</h3>
            <p>
              نعرض مؤشرات الطاقة والمياه والمواد والانبعاثات بصيغة مختصرة
              وقابلة للمقارنة.
            </p>
          </div>
          <div className="metric-list" aria-label="أمثلة على مؤشرات الأداء">
            {["كفاءة الطاقة", "ترشيد المياه", "المواد المستدامة", "خفض الكربون"].map(
              (metric, index) => (
                <div className="metric-row" key={metric}>
                  <span>{metric}</span>
                  <div aria-hidden="true">
                    <i style={{ width: `${54 + index * 11}%` }} />
                  </div>
                  <small>بانتظار البيانات</small>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="next-section" id="next">
        <div className="next-quote">
          <span className="section-kicker light">المرحلة التالية</span>
          <blockquote>
            النسخة النهائية لن توثّق ما حدث فقط؛ بل ستجعل أثر البرنامج
            <em> مفهومًا، قابلًا للقياس، وملهمًا للتكرار.</em>
          </blockquote>
        </div>

        <div className="needed-data" id="needed-data">
          <p>لتحويل هذا التصوّر إلى النسخة النهائية، نحتاج:</p>
          <ol>
            <li>
              <span>01</span>
              اسم البرنامج وهويته
            </li>
            <li>
              <span>02</span>
              نبذة وأهداف المبادرة
            </li>
            <li>
              <span>03</span>
              الأعمال والصور الميدانية
            </li>
            <li>
              <span>04</span>
              النتائج والأرقام الأساسية
            </li>
          </ol>
          <a href="#top">
            العودة إلى البداية
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">
            س
          </span>
          <span>
            <strong>استدامة البناء</strong>
            <small>نحو أثر يدوم</small>
          </span>
        </div>
        <span>الكويت · 2026</span>
      </footer>
    </main>
  );
}
