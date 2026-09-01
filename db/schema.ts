import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role", { enum: ["admin", "engineer", "supplier", "homeowner", "contractor"] }).notNull().default("homeowner"),
  status: text("status", { enum: ["active", "suspended", "pending"] }).notNull().default("active"),
  locale: text("locale", { enum: ["ar", "en"] }).notNull().default("ar"),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("idx_users_email").on(table.email), index("idx_users_role_status").on(table.role, table.status)]);

export const engineers = sqliteTable("engineers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").references(() => users.id),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  specialty: text("specialty").notNull(),
  experienceYears: integer("experience_years"),
  company: text("company"),
  university: text("university"),
  certificatesJson: text("certificates_json").notNull().default("[]"),
  projectTypesJson: text("project_types_json").notNull().default("[]"),
  areasJson: text("areas_json").notNull().default("[]"),
  servicesJson: text("services_json").notNull().default("[]"),
  verificationStatus: text("verification_status", { enum: ["verified", "unverified", "pending", "rejected"] }).notNull().default("unverified"),
  sourceUrl: text("source_url"),
  sourceUpdatedAt: text("source_updated_at"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_engineers_specialty_verification").on(table.specialty, table.verificationStatus), index("idx_engineers_owner_user_id").on(table.ownerUserId)]);

export const contractors = sqliteTable("contractors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").references(() => users.id),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  classification: text("classification").notNull(),
  specialtiesJson: text("specialties_json").notNull().default("[]"),
  areasJson: text("areas_json").notNull().default("[]"),
  equipmentJson: text("equipment_json").notNull().default("[]"),
  completedProjects: integer("completed_projects"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  sourceUrl: text("source_url"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_contractors_classification_verification").on(table.classification, table.verificationStatus)]);

export const consultants = sqliteTable("consultants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  specialtiesJson: text("specialties_json").notNull().default("[]"),
  areasJson: text("areas_json").notNull().default("[]"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  sourceUrl: text("source_url"),
  createdAt,
  updatedAt,
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").references(() => users.id),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  phonePublic: text("phone_public"),
  website: text("website"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  deliveryAreasJson: text("delivery_areas_json").notNull().default("[]"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  sourceUrl: text("source_url"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_suppliers_verification").on(table.verificationStatus)]);

export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  specification: text("specification").notNull(),
  unit: text("unit").notNull(),
  qualityGrade: text("quality_grade"),
  certificationsJson: text("certifications_json").notNull().default("[]"),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("idx_materials_slug").on(table.slug), index("idx_materials_category").on(table.category)]);

export const materialPrices = sqliteTable("material_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("KWD"),
  unit: text("unit").notNull(),
  specification: text("specification").notNull(),
  minimumOrder: real("minimum_order"),
  deliveryCost: real("delivery_cost"),
  availability: text("availability"),
  sourceUrl: text("source_url").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull(),
  confidence: text("confidence", { enum: ["low", "medium", "high"] }).notNull().default("low"),
  approvedByUserId: text("approved_by_user_id").references(() => users.id),
  createdAt,
  updatedAt,
}, (table) => [index("idx_material_prices_material_spec_unit").on(table.materialId, table.specification, table.unit), index("idx_material_prices_supplier").on(table.supplierId)]);

export const priceHistory = sqliteTable("price_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materialPriceId: integer("material_price_id").notNull().references(() => materialPrices.id),
  price: real("price").notNull(),
  currency: text("currency").notNull(),
  unit: text("unit").notNull(),
  specification: text("specification").notNull(),
  sourceUrl: text("source_url").notNull(),
  observedAt: text("observed_at").notNull(),
  createdAt,
}, (table) => [index("idx_price_history_price_observed").on(table.materialPriceId, table.observedAt)]);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  projectType: text("project_type").notNull(),
  area: text("area"),
  budget: real("budget"),
  currency: text("currency").notNull().default("KWD"),
  status: text("status").notNull().default("planning"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_projects_owner_status").on(table.ownerUserId, table.status)]);

export const boqs = sqliteTable("boqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_boqs_project").on(table.projectId)]);

export const boqItems = sqliteTable("boq_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  boqId: integer("boq_id").notNull().references(() => boqs.id),
  code: text("code"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  rate: real("rate"),
  amount: real("amount"),
  materialId: integer("material_id").references(() => materials.id),
  createdAt,
  updatedAt,
}, (table) => [index("idx_boq_items_boq").on(table.boqId), index("idx_boq_items_material").on(table.materialId)]);

export const engineerReviews = sqliteTable("engineer_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engineerId: integer("engineer_id").notNull().references(() => engineers.id),
  authorUserId: text("author_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  body: text("body"),
  moderationStatus: text("moderation_status").notNull().default("pending"),
  createdAt,
}, (table) => [index("idx_engineer_reviews_engineer_status").on(table.engineerId, table.moderationStatus)]);

export const supplierReviews = sqliteTable("supplier_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  authorUserId: text("author_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  deliveryRating: integer("delivery_rating"),
  body: text("body"),
  moderationStatus: text("moderation_status").notNull().default("pending"),
  createdAt,
}, (table) => [index("idx_supplier_reviews_supplier_status").on(table.supplierId, table.moderationStatus)]);

export const roadReports = sqliteTable("road_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporterUserId: text("reporter_user_id").notNull().references(() => users.id),
  defectType: text("defect_type").notNull(),
  aiSuggestedType: text("ai_suggested_type"),
  locationText: text("location_text").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  severity: text("severity").notNull(),
  description: text("description"),
  imageObjectKey: text("image_object_key"),
  status: text("status").notNull().default("submitted"),
  reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
  createdAt,
  updatedAt,
}, (table) => [index("idx_road_reports_status_created").on(table.status, table.createdAt), index("idx_road_reports_reporter").on(table.reporterUserId)]);

export const waterProjects = sqliteTable("water_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  systemType: text("system_type").notNull(),
  assumptionsJson: text("assumptions_json").notNull().default("{}"),
  modelJson: text("model_json").notNull().default("{}"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_water_projects_project").on(table.projectId)]);

export const infrastructureProjects = sqliteTable("infrastructure_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  area: text("area"),
  projectType: text("project_type").notNull(),
  contractor: text("contractor"),
  consultant: text("consultant"),
  announcedValue: real("announced_value"),
  status: text("status"),
  startDate: text("start_date"),
  completionDate: text("completion_date"),
  sourceUrl: text("source_url").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull(),
  confidence: text("confidence").notNull(),
  createdAt,
  updatedAt,
}, (table) => [index("idx_infrastructure_projects_type_status").on(table.projectType, table.status)]);

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  analysisStatus: text("analysis_status").notNull().default("pending"),
  extractedJson: text("extracted_json"),
  createdAt,
}, (table) => [uniqueIndex("idx_documents_object_key").on(table.objectKey), index("idx_documents_owner_project").on(table.ownerUserId, table.projectId)]);

export const aiConversations = sqliteTable("ai_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  discipline: text("discipline").notNull(),
  transcriptJson: text("transcript_json").notNull().default("[]"),
  safetyFlagsJson: text("safety_flags_json").notNull().default("[]"),
  model: text("model"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_ai_conversations_owner_created").on(table.ownerUserId, table.createdAt)]);

export const calculators = sqliteTable("calculators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  discipline: text("discipline").notNull(),
  version: text("version").notNull(),
  formula: text("formula").notNull(),
  assumptionsJson: text("assumptions_json").notNull().default("[]"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("idx_calculators_slug_version").on(table.slug, table.version)]);

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  materialId: integer("material_id").references(() => materials.id),
  conditionJson: text("condition_json").notNull(),
  status: text("status").notNull().default("active"),
  lastTriggeredAt: text("last_triggered_at"),
  createdAt,
  updatedAt,
}, (table) => [index("idx_notifications_owner_status").on(table.ownerUserId, table.status)]);

export const dataSources = sqliteTable("data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(),
  baseUrl: text("base_url"),
  status: text("status").notNull().default("not_connected"),
  lastSyncAt: text("last_sync_at"),
  confidence: text("confidence"),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("idx_data_sources_name").on(table.name)]);
