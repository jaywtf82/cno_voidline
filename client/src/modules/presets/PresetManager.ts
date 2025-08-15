import { apiRequest } from "@/lib/queryClient";
import type { Preset, InsertPreset, PresetParameters } from "@shared/schema";

export class PresetManager {
  private presets: Map<string, Preset> = new Map();
  private builtInPresets: Preset[] = [];

  constructor() {
    this.initializeBuiltInPresets();
  }

  private initializeBuiltInPresets() {
    const builtInConfigs = [
      {
        name: "Berlin Concrete",
        codeName: "BERLIN_CONCRETE",
        category: "industrial",
        description: "Industrial strength with precise dynamics",
        parameters: {
          harmonicBoost: 2.1,
          subweight: 1.8,
          transientPunch: 3.2,
          airlift: 0.5,
          spatialFlux: 0.8,
          compression: {
            threshold: -18,
            ratio: 6,
            attack: 8,
            release: 120,
          },
          eq: {
            lowShelf: { frequency: 80, gain: 2.5 },
            highShelf: { frequency: 10000, gain: 1.2 },
          },
          stereo: {
            width: 0.9,
            bassMonoFreq: 100,
          },
        },
      },
      {
        name: "Sub Abyss",
        codeName: "SUB_ABYSS",
        category: "electronic",
        description: "Deep underwater resonance",
        parameters: {
          harmonicBoost: 0.8,
          subweight: 4.2,
          transientPunch: 1.1,
          airlift: -1.5,
          spatialFlux: 2.3,
          compression: {
            threshold: -22,
            ratio: 3,
            attack: 15,
            release: 200,
          },
          eq: {
            lowShelf: { frequency: 60, gain: 4.8 },
            highShelf: { frequency: 8000, gain: -2.2 },
          },
          stereo: {
            width: 1.3,
            bassMonoFreq: 150,
          },
        },
      },
      {
        name: "Dome Shift",
        codeName: "DOME_SHIFT",
        category: "ambient",
        description: "Atmospheric space modulation",
        parameters: {
          harmonicBoost: 1.5,
          subweight: 0.3,
          transientPunch: 0.8,
          airlift: 3.2,
          spatialFlux: 3.8,
          compression: {
            threshold: -25,
            ratio: 2.5,
            attack: 20,
            release: 150,
          },
          eq: {
            lowShelf: { frequency: 120, gain: -0.5 },
            highShelf: { frequency: 6000, gain: 3.8 },
          },
          stereo: {
            width: 1.6,
            bassMonoFreq: 80,
          },
        },
      },
    ];

    this.builtInPresets = builtInConfigs.map((config, index) => ({
      id: `builtin-${index}`,
      userId: null,
      name: config.name,
      description: config.description,
      category: config.category,
      codeName: config.codeName,
      parameters: config.parameters,
      isBuiltIn: true,
      isPublic: true,
      usageCount: Math.floor(Math.random() * 1000) + 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async loadPresets(): Promise<{ builtIn: Preset[]; user: Preset[]; public: Preset[] }> {
    try {
      const response = await apiRequest("GET", "/api/presets");
      const data = await response.json();
      
      // Merge built-in presets with server data
      const result = {
        builtIn: [...this.builtInPresets, ...(data.builtIn || [])],
        user: data.user || [],
        public: data.public || [],
      };

      // Cache all presets
      [...result.builtIn, ...result.user, ...result.public].forEach(preset => {
        this.presets.set(preset.id, preset);
      });

      return result;
    } catch (error) {
      console.error("Failed to load presets:", error);
      return {
        builtIn: this.builtInPresets,
        user: [],
        public: [],
      };
    }
  }

  async createPreset(presetData: Omit<InsertPreset, "userId">): Promise<Preset> {
    const response = await apiRequest("POST", "/api/presets", presetData);
    const preset = await response.json();
    
    this.presets.set(preset.id, preset);
    return preset;
  }

  async updatePreset(id: string, updates: Partial<InsertPreset>): Promise<Preset> {
    const response = await apiRequest("PATCH", `/api/presets/${id}`, updates);
    const preset = await response.json();
    
    this.presets.set(preset.id, preset);
    return preset;
  }

  async deletePreset(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/presets/${id}`);
    this.presets.delete(id);
  }

  async applyPreset(id: string): Promise<PresetParameters> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error("Preset not found");
    }

    // Record usage if not built-in
    if (!preset.isBuiltIn) {
      try {
        await apiRequest("POST", `/api/presets/${id}/use`);
      } catch (error) {
        console.warn("Failed to record preset usage:", error);
      }
    }

    return preset.parameters as PresetParameters;
  }

  getPreset(id: string): Preset | undefined {
    return this.presets.get(id);
  }

  getBuiltInPresets(): Preset[] {
    return this.builtInPresets;
  }

  createPresetFromParameters(
    name: string,
    parameters: PresetParameters,
    description?: string
  ): Omit<InsertPreset, "userId"> {
    return {
      name,
      description: description || `Custom preset: ${name}`,
      category: "custom",
      parameters,
      isBuiltIn: false,
      isPublic: false,
    };
  }

  validateParameters(parameters: any): PresetParameters {
    // Basic validation - in a real app, would use Zod schema
    const defaults: PresetParameters = {
      harmonicBoost: 0,
      subweight: 0,
      transientPunch: 0,
      airlift: 0,
      spatialFlux: 0,
      compression: {
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
      },
      eq: {
        lowShelf: { frequency: 100, gain: 0 },
        highShelf: { frequency: 8000, gain: 0 },
      },
      stereo: {
        width: 1,
        bassMonoFreq: 120,
      },
    };

    return {
      harmonicBoost: this.clamp(parameters.harmonicBoost ?? defaults.harmonicBoost, -10, 10),
      subweight: this.clamp(parameters.subweight ?? defaults.subweight, -10, 10),
      transientPunch: this.clamp(parameters.transientPunch ?? defaults.transientPunch, -10, 10),
      airlift: this.clamp(parameters.airlift ?? defaults.airlift, -10, 10),
      spatialFlux: this.clamp(parameters.spatialFlux ?? defaults.spatialFlux, -10, 10),
      compression: {
        threshold: this.clamp(
          parameters.compression?.threshold ?? defaults.compression.threshold,
          -60,
          0
        ),
        ratio: this.clamp(
          parameters.compression?.ratio ?? defaults.compression.ratio,
          1,
          20
        ),
        attack: this.clamp(
          parameters.compression?.attack ?? defaults.compression.attack,
          0.1,
          100
        ),
        release: this.clamp(
          parameters.compression?.release ?? defaults.compression.release,
          10,
          1000
        ),
      },
      eq: {
        lowShelf: {
          frequency: this.clamp(
            parameters.eq?.lowShelf?.frequency ?? defaults.eq.lowShelf.frequency,
            20,
            500
          ),
          gain: this.clamp(
            parameters.eq?.lowShelf?.gain ?? defaults.eq.lowShelf.gain,
            -15,
            15
          ),
        },
        highShelf: {
          frequency: this.clamp(
            parameters.eq?.highShelf?.frequency ?? defaults.eq.highShelf.frequency,
            2000,
            20000
          ),
          gain: this.clamp(
            parameters.eq?.highShelf?.gain ?? defaults.eq.highShelf.gain,
            -15,
            15
          ),
        },
      },
      stereo: {
        width: this.clamp(
          parameters.stereo?.width ?? defaults.stereo.width,
          0,
          2
        ),
        bassMonoFreq: this.clamp(
          parameters.stereo?.bassMonoFreq ?? defaults.stereo.bassMonoFreq,
          50,
          500
        ),
      },
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  exportPreset(preset: Preset): string {
    const exportData = {
      name: preset.name,
      description: preset.description,
      category: preset.category,
      parameters: preset.parameters,
      version: "1.0",
      exported: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  importPreset(jsonData: string): Omit<InsertPreset, "userId"> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.name || !data.parameters) {
        throw new Error("Invalid preset data");
      }

      return {
        name: data.name,
        description: data.description || "Imported preset",
        category: data.category || "imported",
        parameters: this.validateParameters(data.parameters),
        isBuiltIn: false,
        isPublic: false,
      };
    } catch (error) {
      throw new Error("Failed to parse preset file");
    }
  }
}
