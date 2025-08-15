import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertProjectSchema,
  insertPresetSchema,
  insertUserPreferenceSchema,
  PresetParametersSchema,
  AnalysisResultsSchema,
  ExportFormat,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (configurable)
  const requireAuth = process.env.VITE_REQUIRE_AUTH === 'true';
  if (requireAuth) {
    await setupAuth(app);
  }

  // Auth routes (only if auth is required)
  const authMiddleware = requireAuth ? isAuthenticated : (req: any, res: any, next: any) => next();
  
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return anonymous user when auth is disabled
        return res.json({
          id: 'anonymous',
          email: 'anonymous@example.com',
          firstName: 'Anonymous',
          lastName: 'User',
          preferences: { theme: 'classic', defaultExportFormat: 'streaming' }
        });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      
      // Get user preferences
      const preferences = await storage.getUserPreferences(userId);
      
      res.json({
        ...user,
        preferences: preferences || { theme: 'classic', defaultExportFormat: 'streaming' }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User preferences routes
  app.get('/api/preferences', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return default preferences when auth is disabled
        return res.json({ theme: 'classic', defaultExportFormat: 'streaming' });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || { theme: 'classic', defaultExportFormat: 'streaming' });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/preferences', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return success but don't save when auth is disabled
        return res.json(req.body);
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertUserPreferenceSchema.parse({
        ...req.body,
        userId,
      });
      
      const preferences = await storage.upsertUserPreferences(validatedData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Project routes
  app.get('/api/projects', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return empty projects when auth is disabled
        return res.json([]);
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return basic project data when auth is disabled
        return res.json({
          id: req.params.id,
          name: 'Demo Project',
          userId: 'anonymous',
          isPublic: true
        });
      }
      
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check ownership
      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return success but don't save when auth is disabled
        return res.json({
          id: 'demo-' + Date.now(),
          ...req.body,
          userId: 'anonymous'
        });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId,
      });
      
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return success but don't save when auth is disabled
        return res.json({ id: req.params.id, ...req.body });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const project = await storage.getProject(req.params.id);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const updates = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(req.params.id, updates);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
      if (!requireAuth) {
        // Return success but don't actually delete when auth is disabled
        return res.json({ message: "Project deleted" });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const project = await storage.getProject(req.params.id);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Preset routes
  app.get('/api/presets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [userPresets, builtInPresets, publicPresets] = await Promise.all([
        storage.getUserPresets(userId),
        storage.getBuiltInPresets(),
        storage.getPublicPresets(),
      ]);
      
      res.json({
        user: userPresets,
        builtIn: builtInPresets,
        public: publicPresets,
      });
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  app.get('/api/presets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const preset = await storage.getPreset(req.params.id);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }
      
      // Check access permissions
      const userId = req.user.claims.sub;
      if (!preset.isBuiltIn && !preset.isPublic && preset.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(preset);
    } catch (error) {
      console.error("Error fetching preset:", error);
      res.status(500).json({ message: "Failed to fetch preset" });
    }
  });

  app.post('/api/presets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPresetSchema.parse({
        ...req.body,
        userId,
        parameters: PresetParametersSchema.parse(req.body.parameters),
      });
      
      const preset = await storage.createPreset(validatedData);
      res.json(preset);
    } catch (error) {
      console.error("Error creating preset:", error);
      res.status(500).json({ message: "Failed to create preset" });
    }
  });

  app.patch('/api/presets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const preset = await storage.getPreset(req.params.id);
      if (!preset || preset.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Preset not found" });
      }
      
      const updates = insertPresetSchema.partial().parse(req.body);
      if (updates.parameters) {
        updates.parameters = PresetParametersSchema.parse(updates.parameters);
      }
      
      const updatedPreset = await storage.updatePreset(req.params.id, updates);
      res.json(updatedPreset);
    } catch (error) {
      console.error("Error updating preset:", error);
      res.status(500).json({ message: "Failed to update preset" });
    }
  });

  app.delete('/api/presets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const preset = await storage.getPreset(req.params.id);
      if (!preset || preset.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Preset not found" });
      }
      
      await storage.deletePreset(req.params.id);
      res.json({ message: "Preset deleted" });
    } catch (error) {
      console.error("Error deleting preset:", error);
      res.status(500).json({ message: "Failed to delete preset" });
    }
  });

  app.post('/api/presets/:id/use', isAuthenticated, async (req: any, res) => {
    try {
      const preset = await storage.getPreset(req.params.id);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }
      
      await storage.incrementPresetUsage(req.params.id);
      res.json({ message: "Usage recorded" });
    } catch (error) {
      console.error("Error recording preset usage:", error);
      res.status(500).json({ message: "Failed to record usage" });
    }
  });

  // Export targets routes
  app.get('/api/export-targets', async (req, res) => {
    try {
      const targets = await storage.getExportTargets();
      res.json(targets);
    } catch (error) {
      console.error("Error fetching export targets:", error);
      res.status(500).json({ message: "Failed to fetch export targets" });
    }
  });

  // Audio processing routes
  app.post('/api/dsp/analyze', isAuthenticated, async (req, res) => {
    try {
      const { audioData } = req.body;
      
      if (!audioData) {
        return res.status(400).json({ message: "Audio data is required" });
      }
      
      // In a real implementation, this would process the audio
      // For now, return mock analysis data
      const analysis = {
        lufs: -14.2,
        dbtp: -1.1,
        dbfs: -3.5,
        lra: 6.8,
        correlation: 0.94,
        spectrum: Array.from({ length: 512 }, (_, i) => Math.random() * 0.8),
        peakFrequency: 4200,
        dynamicRange: 12.5,
        stereoWidth: 0.82,
        noiseFloor: -60.2,
        voidlineScore: 87,
      };
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing audio:", error);
      res.status(500).json({ message: "Failed to analyze audio" });
    }
  });

  app.post('/api/dsp/process', isAuthenticated, async (req, res) => {
    try {
      const { audioData, parameters, presetId } = req.body;
      
      if (!audioData) {
        return res.status(400).json({ message: "Audio data is required" });
      }
      
      // Validate parameters
      const validatedParams = PresetParametersSchema.parse(parameters);
      
      // In a real implementation, this would process the audio
      // For now, return the same audio data
      res.json({
        processedAudio: audioData,
        parameters: validatedParams,
        processingTime: Math.random() * 2000 + 500, // Mock processing time
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ message: "Failed to process audio" });
    }
  });

  app.post('/api/dsp/render', isAuthenticated, async (req, res) => {
    try {
      const { audioData, parameters, exportFormat } = req.body;
      
      if (!audioData || !exportFormat) {
        return res.status(400).json({ message: "Audio data and export format are required" });
      }
      
      const validatedFormat = ExportFormat.parse(exportFormat);
      const validatedParams = PresetParametersSchema.parse(parameters);
      
      // In a real implementation, this would render the final audio
      // For now, return mock render data
      res.json({
        renderedAudio: audioData,
        format: validatedFormat,
        parameters: validatedParams,
        fileSize: Math.floor(Math.random() * 10000000) + 1000000, // Mock file size
        renderTime: Math.random() * 5000 + 1000, // Mock render time
      });
    } catch (error) {
      console.error("Error rendering audio:", error);
      res.status(500).json({ message: "Failed to render audio" });
    }
  });

  // Session tracking
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createUserSession({
        userId,
        sessionData: req.body.sessionData || {},
      });
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.updateUserSession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
