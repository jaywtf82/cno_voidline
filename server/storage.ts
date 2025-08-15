import {
  users,
  userPreferences,
  projects,
  presets,
  exportTargets,
  userSessions,
  type User,
  type UpsertUser,
  type UserPreference,
  type InsertUserPreference,
  type Project,
  type InsertProject,
  type Preset,
  type InsertPreset,
  type ExportTarget,
  type InsertExportTarget,
  type UserSession,
  type InsertUserSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserPreference | undefined>;
  upsertUserPreferences(preferences: InsertUserPreference): Promise<UserPreference>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Presets
  getPreset(id: string): Promise<Preset | undefined>;
  getUserPresets(userId: string): Promise<Preset[]>;
  getBuiltInPresets(): Promise<Preset[]>;
  getPublicPresets(): Promise<Preset[]>;
  createPreset(preset: InsertPreset): Promise<Preset>;
  updatePreset(id: string, updates: Partial<InsertPreset>): Promise<Preset>;
  deletePreset(id: string): Promise<void>;
  incrementPresetUsage(id: string): Promise<void>;
  
  // Export targets
  getExportTargets(): Promise<ExportTarget[]>;
  getExportTarget(id: string): Promise<ExportTarget | undefined>;
  createExportTarget(target: InsertExportTarget): Promise<ExportTarget>;
  
  // User sessions
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(id: string, updates: Partial<InsertUserSession>): Promise<UserSession>;
  getUserSessions(userId: string): Promise<UserSession[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<UserPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreference): Promise<UserPreference> {
    const [result] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(project).returning();
    return result;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [result] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Presets
  async getPreset(id: string): Promise<Preset | undefined> {
    const [preset] = await db.select().from(presets).where(eq(presets.id, id));
    return preset;
  }

  async getUserPresets(userId: string): Promise<Preset[]> {
    return await db
      .select()
      .from(presets)
      .where(eq(presets.userId, userId))
      .orderBy(desc(presets.updatedAt));
  }

  async getBuiltInPresets(): Promise<Preset[]> {
    return await db
      .select()
      .from(presets)
      .where(eq(presets.isBuiltIn, true))
      .orderBy(desc(presets.usageCount));
  }

  async getPublicPresets(): Promise<Preset[]> {
    return await db
      .select()
      .from(presets)
      .where(and(eq(presets.isPublic, true), eq(presets.isBuiltIn, false)))
      .orderBy(desc(presets.usageCount));
  }

  async createPreset(preset: InsertPreset): Promise<Preset> {
    const [result] = await db.insert(presets).values(preset).returning();
    return result;
  }

  async updatePreset(id: string, updates: Partial<InsertPreset>): Promise<Preset> {
    const [result] = await db
      .update(presets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presets.id, id))
      .returning();
    return result;
  }

  async deletePreset(id: string): Promise<void> {
    await db.delete(presets).where(eq(presets.id, id));
  }

  async incrementPresetUsage(id: string): Promise<void> {
    await db
      .update(presets)
      .set({ usageCount: sql`usage_count + 1` })
      .where(eq(presets.id, id));
  }

  // Export targets
  async getExportTargets(): Promise<ExportTarget[]> {
    return await db.select().from(exportTargets);
  }

  async getExportTarget(id: string): Promise<ExportTarget | undefined> {
    const [target] = await db.select().from(exportTargets).where(eq(exportTargets.id, id));
    return target;
  }

  async createExportTarget(target: InsertExportTarget): Promise<ExportTarget> {
    const [result] = await db.insert(exportTargets).values(target).returning();
    return result;
  }

  // User sessions
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [result] = await db.insert(userSessions).values(session).returning();
    return result;
  }

  async updateUserSession(id: string, updates: Partial<InsertUserSession>): Promise<UserSession> {
    const [result] = await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.id, id))
      .returning();
    return result;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.createdAt));
  }
}

export const storage = new DatabaseStorage();
