import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // hashed password for local auth
  role: varchar("role").notNull().default("member"), // "admin", "agent", "member"
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insurance policies
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // "auto" or "home"
  status: varchar("status").notNull().default("active"), // "active", "suspended", "cancelled"
  coverageAmount: decimal("coverage_amount", { precision: 10, scale: 2 }).notNull(),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }).notNull(),
  deductible: decimal("deductible", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  vehicleInfo: jsonb("vehicle_info"), // For auto insurance
  propertyInfo: jsonb("property_info"), // For home insurance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  policyId: integer("policy_id").notNull().references(() => policies.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("submitted"), // "submitted", "processing", "approved", "denied", "paid"
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  images: jsonb("images").default([]), // Array of image URLs
  aiAssessment: jsonb("ai_assessment"), // AI analysis results
  incidentDate: timestamp("incident_date").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  policyId: integer("policy_id").references(() => policies.id),
  claimId: integer("claim_id").references(() => claims.id),
  type: varchar("type").notNull(), // "premium", "claim_payout"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("USD"),
  paymentMethod: varchar("payment_method").notNull(), // "bitcoin", "traditional"
  bitcoinAddress: varchar("bitcoin_address"),
  bitcoinTxId: varchar("bitcoin_tx_id"),
  bitcoinAmount: decimal("bitcoin_amount", { precision: 18, scale: 8 }),
  status: varchar("status").notNull().default("pending"), // "pending", "confirmed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  processedAt: true,
  paidAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

// Enhanced enrollment schemas
export const autoInsuranceSchema = z.object({
  type: z.literal("auto"),
  coverageAmount: z.string().min(1, "Coverage amount is required"),
  deductible: z.string().min(1, "Deductible is required"),
  vehicleInfo: z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.number().min(1900).max(new Date().getFullYear() + 1),
    vin: z.string().length(17, "VIN must be 17 characters"),
    mileage: z.number().min(0),
    primaryUse: z.enum(["personal", "business", "pleasure"]),
  }),
});

export const homeInsuranceSchema = z.object({
  type: z.literal("home"),
  coverageAmount: z.string().min(1, "Coverage amount is required"),
  deductible: z.string().min(1, "Deductible is required"),
  propertyInfo: z.object({
    address: z.string().min(1, "Address is required"),
    yearBuilt: z.number().min(1800).max(new Date().getFullYear()),
    squareFootage: z.number().min(1),
    propertyType: z.enum(["single_family", "condo", "townhouse", "multi_family"]),
    constructionType: z.enum(["frame", "masonry", "steel", "concrete"]),
    roofType: z.enum(["shingle", "tile", "metal", "flat"]),
    hasSecuritySystem: z.boolean(),
    hasFireAlarm: z.boolean(),
  }),
});

export const claimSubmissionSchema = insertClaimSchema.extend({
  incidentDate: z.string().min(1, "Incident date is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

// Registration schema with password strength validation
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  profileImageUrl: z.string().optional(),
});

// Type exports
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AutoInsurance = z.infer<typeof autoInsuranceSchema>;
export type HomeInsurance = z.infer<typeof homeInsuranceSchema>;
export type ClaimSubmission = z.infer<typeof claimSubmissionSchema>;
