# CivilKuwait — Product Architecture

## نطاق المنتج

CivilKuwait منصة ثنائية اللغة تجمع أربعة أسطح مترابطة: الإنشاءات، هندسة المياه، البنية التحتية والطرق، وCivil AI. صُممت النسخة الحالية لتعمل كمنتج قابل للتوسعة مع فصل تام بين الواجهة، بيانات العرض التجريبية، البيانات الموثقة، التخزين، وموفري الذكاء الاصطناعي.

## المعمارية

```text
Browser (Arabic RTL / English LTR)
  ├─ Product UI: hubs, calculators, BOQ, directories, dashboards
  ├─ Public read APIs: materials, engineers, suppliers, projects
  └─ Authenticated write APIs
       ├─ D1: structured product records and authorization ownership
       ├─ R2: PDFs, spreadsheets, photos, and generated reports
       └─ AI adapter: OpenAI Responses API → safe local fallback
```

- الواجهة: Next.js App Router + React + TypeScript، مبنية لخادم Cloudflare Worker عبر Vinext.
- البيانات العلائقية: Cloudflare D1 / SQLite مع مخطط Drizzle ومهاجرات محفوظة في المشروع.
- الملفات: Cloudflare R2؛ تخزن D1 بيانات الملكية والاسم والنوع والحالة فقط.
- الهوية: رؤوس هوية المنصة `oai-authenticated-user-*`. جميع قرارات الملكية والأدوار تُطبق في الخادم، لا في الواجهة.
- النشر: OpenAI Sites مع ربط منطقي `DB` و`FILES`.

### نشر GitHub Pages

نسخة GitHub المستقلة تُبنى من `github/main.tsx` إلى `docs/` وتعمل تحت `/saud/` بمسارات Hash. تستخدم Supabase Auth وPostgres وStorage بدل وظائف الخادم غير المتاحة في GitHub Pages. مخطط Supabase موجود في `supabase/migrations/0001_civilkuwait_platform.sql`، ويغطي الملفات الشخصية والمشاريع وBOQ وقوائم الفحص والمحادثات والمستندات.

التفويض ليس إخفاءً بصريًا: كل جدول مكشوف يفعّل RLS، وتُسحب امتيازات `anon`، ويُربط الوصول بـ `auth.uid()`. صلاحية الإدارة محمية بدالة `security definer` ورمز تأسيس محفوظ كبصمة SHA-256، مع فهرس جزئي يمنع وجود أكثر من حساب بدور `admin`.

## الصفحات

| المسار | الوظيفة |
| --- | --- |
| `/` | الصفحة الرئيسية، البحث الموحد، القطاعات، مؤشر المواد، Civil AI |
| `/construction` | الأدلة، سوق المواد، BOQ، ابني بيتك، الحاسبات، خارطة البناء |
| `/water` | Hazen-Williams، قدرة المضخة، Rational Method، مساحة شبكة أولية |
| `/infrastructure` | المرور، مدخلات الرصف، سوق الطرق، بلاغات العيوب |
| `/dashboard` | ميزانية المشروع، BOQ، الفريق، الملفات والمهام |
| `/admin` | المصادر، التحقق، المراجعات، البلاغات، المستخدمون والأدوار |

## واجهات API

- `GET /api/materials` و`GET /api/materials/:id`
- `GET /api/engineers`
- `GET /api/suppliers`
- `GET /api/infrastructure-projects`
- `GET|POST /api/projects` — يتطلب هوية للقراءة والكتابة
- `GET|POST /api/road-reports` — يتطلب هوية
- `POST /api/documents/upload` — R2 + سجل D1، حد 10MB وقائمة أنواع مسموحة
- `POST /api/boq/analyze` — تحليل CSV شفاف دون إضافة أسعار سوقية
- `POST /api/ai` — محول آمن يستخدم OpenAI Responses API عند ضبط المفتاح، ويعود تلقائيًا إلى الإرشاد المحلي عند تعذر الموفر
- `GET /api/me` — حالة الهوية الحالية

كل استجابة بيانات متغيرة تميز بين `source` و`last_updated` و`confidence`. عندما لا يوجد مصدر موثوق تكون القيمة `null` وتعرض الواجهة `Data unavailable`.

## قاعدة البيانات

المخطط في `db/schema.ts` ويشمل: users، engineers، contractors، consultants، suppliers، materials، material_prices، price_history، projects، boqs، boq_items، engineer_reviews، supplier_reviews، road_reports، water_projects، infrastructure_projects، documents، ai_conversations، calculators، notifications، وdata_sources.

الفهارس مبنية على أنماط الاستعلام الفعلية: ملكية المشاريع، تخصص المهندس وحالة التحقق، المادة/المواصفة/الوحدة، سجل السعر الزمني، وحالة البلاغ.

## محرك مقارنة المواد

لا تُقارن عروض مختلفة مباشرة. مفتاح مجموعة المقارنة هو:

```text
material_id + normalized_specification + quality_grade + unit + certification requirements
```

داخل المجموعة المطابقة فقط، يُحسب الترتيب من السعر الأساسي، التوصيل، حد الطلب، تقييم المورد الموثق، والتوفر. لا يُستخدم وصف «الأرخص» عندما تختلف المواصفة أو الجودة.

## AI architecture

يستخدم كل تخصص System Policy مستقلًا مع طبقة مشتركة للسلامة:

1. تصنيف الطلب إلى Construction / Structural / Water / Roads / Materials / BOQ.
2. استخراج الوحدات والمدخلات، ثم طلب البيانات الناقصة.
3. تشغيل الحاسبة الحتمية عند وجود صيغة معروفة بدل الاعتماد على نص النموذج.
4. استرجاع بيانات موثقة فقط مع المصدر وتاريخ التحديث والثقة.
5. إرفاق الافتراضات والتحذير، ومنع تقديم اعتماد هندسي نهائي.
6. تسجيل التدقيق بعد موافقة الخصوصية، مع حجب المعلومات الحساسة.

لا يوجد مفتاح ذكاء اصطناعي داخل الكود. تقرأ نقطة `/api/ai` المتغير السري `OPENAI_API_KEY` واسم النموذج الاختياري `OPENAI_MODEL` من بيئة التشغيل، وترسل آخر سياق آمن عبر Responses API. عند غياب المفتاح أو تعذر الاتصال تستمر المحادثة في وضع `safe_local_source_router` بدل الفشل الكامل.

## مصادر البيانات المقترحة

- مشاريع وتراخيص: واجهات أو ملفات الجهات الكويتية الرسمية بعد التحقق من شروط الاستخدام.
- الأسعار والتوفر: تغذية مباشرة من الموردين الموثقين أو استيراد معتمد يخضع للمراجعة.
- الأدلة: إدخال ذاتي موثق، مراجعة المسؤول، أو استيراد من مصدر مرخص.
- المعايير: روابط مرجعية رسمية فقط؛ لا تُنسخ النصوص المحمية.

كل مصدر يملك سجلًا في `data_sources` وحالة اتصال وآخر مزامنة ومستوى ثقة. لا تنتقل البيانات إلى الإنتاج قبل التحقق البشري.

## الأمان والخصوصية

- المصادقة مقدمة من منصة الاستضافة؛ التفويض في مسارات الخادم حسب الدور والملكية.
- الأسعار والمراجعات وبيانات الدليل تمر بحالة مراجعة قبل النشر.
- قيود نوع وحجم للملفات، ومفاتيح R2 لا تكشف اسم المستخدم أو مسارًا عامًا.
- رؤوس CSP وHSTS وX-Content-Type-Options وframe-ancestors مفعلة في الـWorker.
- لا تُعرض أرقام خاصة أو معلومات حساسة. الاتصال العام حقل منفصل يقرره صاحب الملف.
- مطلوب تحديد معدل الاستخدام، فحص الملفات، وسياسة احتفاظ قبل الإطلاق العام واسع النطاق.

## مراحل الإطلاق

1. **Core**: الأدلة، المشاريع، BOQ، الحاسبات، والمراجعة الإدارية.
2. **Verified data**: ربط أول موردين ومصادر مشاريع رسمية مع سجل تدقيق.
3. **AI provider**: موفر خارجي، تحليل مستندات، سياسات تخصصية واختبارات تقييم.
4. **Maps & alerts**: خرائط وموقع بإذن صريح، مهام مجدولة وتنبيهات الأسعار.
5. **Production hardening**: rate limits، malware scanning، observability، backups، وعمليات امتثال.
