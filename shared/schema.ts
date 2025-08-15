import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences and settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: varchar("theme").notNull().default("classic"),
  defaultExportFormat: varchar("default_export_format").default("streaming"),
  autoSave: boolean("auto_save").default(true),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audio projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  originalFileName: varchar("original_file_name"),
  audioData: text("audio_data"), // Base64 encoded audio data
  processingParams: jsonb("processing_params").default({}),
  analysisResults: jsonb("analysis_results").default({}),
  voidlineScore: integer("voidline_score").default(0),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom presets
export const presets = pgTable("presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default("custom"),
  codeName: varchar("code_name"), // e.g., "BERLIN_CONCRETE"
  parameters: jsonb("parameters").notNull(),
  isBuiltIn: boolean("is_built_in").default(false),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export targets configuration
export const exportTargets = pgTable("export_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  sampleRate: integer("sample_rate").notNull(),
  bitDepth: integer("bit_depth").notNull(),
  targetLUFS: real("target_lufs").notNull(),
  ceilingDb: real("ceiling_db").notNull(),
  dither: boolean("dither").default(false),
  isBuiltIn: boolean("is_built_in").default(true),
});

// User sessions and activity
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionData: jsonb("session_data").default({}),
  duration: integer("duration"), // in seconds
  projectsWorked: integer("projects_worked").default(0),
  presetsUsed: text("presets_used").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertUserPreference = typeof userPreferences.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;

export type InsertProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

export type InsertPreset = typeof presets.$inferInsert;
export type Preset = typeof presets.$inferSelect;

export type InsertExportTarget = typeof exportTargets.$inferInsert;
export type ExportTarget = typeof exportTargets.$inferSelect;

export type InsertUserSession = typeof userSessions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;

// Zod schemas for validation
export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresetSchema = createInsertSchema(presets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertExportTargetSchema = createInsertSchema(exportTargets).omit({
  id: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  endedAt: true,
});

// Export format enum
export const ExportFormat = z.enum(["CLUB", "STREAMING", "VINYL", "RADIO"]);
export type ExportFormatType = z.infer<typeof ExportFormat>;

// Theme enum
export const Theme = z.enum(["classic", "matrix", "cyberpunk", "retro"]);
export type ThemeType = z.infer<typeof Theme>;

// Preset parameters schema
export const PresetParametersSchema = z.object({
  harmonicBoost: z.number().min(-10).max(10).default(0),
  subweight: z.number().min(-10).max(10).default(0),
  transientPunch: z.number().min(-10).max(10).default(0),
  airlift: z.number().min(-10).max(10).default(0),
  spatialFlux: z.number().min(-10).max(10).default(0),
  compression: z.object({
    threshold: z.number().min(-60).max(0).default(-20),
    ratio: z.number().min(1).max(20).default(4),
    attack: z.number().min(0.1).max(100).default(10),
    release: z.number().min(10).max(1000).default(100),
  }).default({}),
  eq: z.object({
    lowShelf: z.object({
      frequency: z.number().min(20).max(500).default(100),
      gain: z.number().min(-15).max(15).default(0),
    }).default({}),
    highShelf: z.object({
      frequency: z.number().min(2000).max(20000).default(8000),
      gain: z.number().min(-15).max(15).default(0),
    }).default({}),
  }).default({}),
  stereo: z.object({
    width: z.number().min(0).max(2).default(1),
    bassMonoFreq: z.number().min(50).max(500).default(120),
  }).default({}),
});

export type PresetParameters = z.infer<typeof PresetParametersSchema>;

// Analysis results schema
export const AnalysisResultsSchema = z.object({
  lufs: z.number(),
  dbtp: z.number(),
  dbfs: z.number(),
  lra: z.number(),
  correlation: z.number().min(-1).max(1),
  spectrum: z.array(z.number()),
  peakFrequency: z.number(),
  dynamicRange: z.number(),
  stereoWidth: z.number(),
  noiseFloor: z.number(),
  voidlineScore: z.number().min(0).max(100),
});

export type AnalysisResults = z.infer<typeof AnalysisResultsSchema>;
