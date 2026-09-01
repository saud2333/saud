CREATE TABLE `ai_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` integer,
	`discipline` text NOT NULL,
	`transcript_json` text DEFAULT '[]' NOT NULL,
	`safety_flags_json` text DEFAULT '[]' NOT NULL,
	`model` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_owner_created` ON `ai_conversations` (`owner_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `boq_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`boq_id` integer NOT NULL,
	`code` text,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`rate` real,
	`amount` real,
	`material_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`boq_id`) REFERENCES `boqs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_boq_items_boq` ON `boq_items` (`boq_id`);--> statement-breakpoint
CREATE INDEX `idx_boq_items_material` ON `boq_items` (`material_id`);--> statement-breakpoint
CREATE TABLE `boqs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_boqs_project` ON `boqs` (`project_id`);--> statement-breakpoint
CREATE TABLE `calculators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`discipline` text NOT NULL,
	`version` text NOT NULL,
	`formula` text NOT NULL,
	`assumptions_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_calculators_slug_version` ON `calculators` (`slug`,`version`);--> statement-breakpoint
CREATE TABLE `consultants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text,
	`specialties_json` text DEFAULT '[]' NOT NULL,
	`areas_json` text DEFAULT '[]' NOT NULL,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`source_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contractors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text,
	`name_ar` text NOT NULL,
	`name_en` text,
	`classification` text NOT NULL,
	`specialties_json` text DEFAULT '[]' NOT NULL,
	`areas_json` text DEFAULT '[]' NOT NULL,
	`equipment_json` text DEFAULT '[]' NOT NULL,
	`completed_projects` integer,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`source_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contractors_classification_verification` ON `contractors` (`classification`,`verification_status`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`source_type` text NOT NULL,
	`base_url` text,
	`status` text DEFAULT 'not_connected' NOT NULL,
	`last_sync_at` text,
	`confidence` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_data_sources_name` ON `data_sources` (`name`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` integer,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`analysis_status` text DEFAULT 'pending' NOT NULL,
	`extracted_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_documents_object_key` ON `documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_documents_owner_project` ON `documents` (`owner_user_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `engineer_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`engineer_id` integer NOT NULL,
	`author_user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text,
	`moderation_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`engineer_id`) REFERENCES `engineers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_engineer_reviews_engineer_status` ON `engineer_reviews` (`engineer_id`,`moderation_status`);--> statement-breakpoint
CREATE TABLE `engineers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text,
	`name_ar` text NOT NULL,
	`name_en` text,
	`specialty` text NOT NULL,
	`experience_years` integer,
	`company` text,
	`university` text,
	`certificates_json` text DEFAULT '[]' NOT NULL,
	`project_types_json` text DEFAULT '[]' NOT NULL,
	`areas_json` text DEFAULT '[]' NOT NULL,
	`services_json` text DEFAULT '[]' NOT NULL,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`source_url` text,
	`source_updated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_engineers_specialty_verification` ON `engineers` (`specialty`,`verification_status`);--> statement-breakpoint
CREATE INDEX `idx_engineers_owner_user_id` ON `engineers` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `infrastructure_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text,
	`area` text,
	`project_type` text NOT NULL,
	`contractor` text,
	`consultant` text,
	`announced_value` real,
	`status` text,
	`start_date` text,
	`completion_date` text,
	`source_url` text NOT NULL,
	`source_updated_at` text NOT NULL,
	`confidence` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_infrastructure_projects_type_status` ON `infrastructure_projects` (`project_type`,`status`);--> statement-breakpoint
CREATE TABLE `material_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`material_id` integer NOT NULL,
	`supplier_id` integer NOT NULL,
	`price` real NOT NULL,
	`currency` text DEFAULT 'KWD' NOT NULL,
	`unit` text NOT NULL,
	`specification` text NOT NULL,
	`minimum_order` real,
	`delivery_cost` real,
	`availability` text,
	`source_url` text NOT NULL,
	`source_updated_at` text NOT NULL,
	`confidence` text DEFAULT 'low' NOT NULL,
	`approved_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_material_prices_material_spec_unit` ON `material_prices` (`material_id`,`specification`,`unit`);--> statement-breakpoint
CREATE INDEX `idx_material_prices_supplier` ON `material_prices` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`specification` text NOT NULL,
	`unit` text NOT NULL,
	`quality_grade` text,
	`certifications_json` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_materials_slug` ON `materials` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_materials_category` ON `materials` (`category`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`kind` text NOT NULL,
	`material_id` integer,
	`condition_json` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_triggered_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_owner_status` ON `notifications` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`material_price_id` integer NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`unit` text NOT NULL,
	`specification` text NOT NULL,
	`source_url` text NOT NULL,
	`observed_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`material_price_id`) REFERENCES `material_prices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_price_history_price_observed` ON `price_history` (`material_price_id`,`observed_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`project_type` text NOT NULL,
	`area` text,
	`budget` real,
	`currency` text DEFAULT 'KWD' NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_projects_owner_status` ON `projects` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `road_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporter_user_id` text NOT NULL,
	`defect_type` text NOT NULL,
	`ai_suggested_type` text,
	`location_text` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`severity` text NOT NULL,
	`description` text,
	`image_object_key` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`reviewed_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_road_reports_status_created` ON `road_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_road_reports_reporter` ON `road_reports` (`reporter_user_id`);--> statement-breakpoint
CREATE TABLE `supplier_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`author_user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`delivery_rating` integer,
	`body` text,
	`moderation_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_supplier_reviews_supplier_status` ON `supplier_reviews` (`supplier_id`,`moderation_status`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text,
	`name_ar` text NOT NULL,
	`name_en` text,
	`phone_public` text,
	`website` text,
	`latitude` real,
	`longitude` real,
	`delivery_areas_json` text DEFAULT '[]' NOT NULL,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`source_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_verification` ON `suppliers` (`verification_status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text,
	`role` text DEFAULT 'homeowner' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`locale` text DEFAULT 'ar' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role_status` ON `users` (`role`,`status`);--> statement-breakpoint
CREATE TABLE `water_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`system_type` text NOT NULL,
	`assumptions_json` text DEFAULT '{}' NOT NULL,
	`model_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_water_projects_project` ON `water_projects` (`project_id`);