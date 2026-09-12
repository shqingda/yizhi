import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resumes = sqliteTable("resumes", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	data: text("data").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export type ResumeRow = typeof resumes.$inferSelect;
export type NewResumeRow = typeof resumes.$inferInsert;
