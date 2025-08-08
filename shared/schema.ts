import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entity: text("entity"),
  serialNumber: text("serial_number"),
  workersId: text("workers_id").notNull().unique(),
  nameOfWorkers: text("name_of_workers").notNull(),
  designation: text("designation"),
  contactNo: text("contact_no"),
  nationality: text("nationality"),
  wpNo: text("wp_no"),
  nricFinNo: text("nric_fin_no"),
  dateOfExpiry: timestamp("date_of_expiry"),
  dateOfBirth: timestamp("date_of_birth"),
  isActive: boolean("is_active").default(true),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // in hours
  isActive: boolean("is_active").default(true),
});

export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").references(() => workers.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  name: text("name").notNull(),
  certificateNumber: text("certificate_number"),
  issuedDate: timestamp("issued_date"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("active"), // active, expired, expiring_soon
});

export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
}).extend({
  dateOfExpiry: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
}).extend({
  issuedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certifications.$inferSelect;

export interface WorkerWithCertifications extends Worker {
  certifications: (Certification & { course: Course })[];
}

export interface WorkerWithCourses extends Worker {
  courses: Course[];
}
