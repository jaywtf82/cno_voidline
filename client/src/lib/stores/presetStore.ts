import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { PresetManager } from "@/modules/presets/PresetManager";
import type { Preset, PresetParameters, InsertPreset } from "@shared/schema";

interface PresetState {
  // Preset manager
  presetManager: PresetManager;
  
  // Preset collections
  builtInPresets: Preset[];
  userPresets: Preset[];
  publicPresets: Preset[];
  
  // Current state
  currentPreset: Preset | null;
  isLoadingPresets: boolean;
  
  // Search and filtering
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: "name" | "usage" | "created" | "updated";
  sortOrder: "asc" | "desc";
  
  // Actions
  loadPresets: () => Promise<void>;
  createPreset: (presetData: Omit<InsertPreset, "userId">) => Promise<Preset>;
  updatePreset: (id: string, updates: Partial<InsertPreset>) => Promise<Preset>;
  deletePreset: (id: string) => Promise<void>;
  applyPreset: (preset: Preset) => Promise<PresetParameters>;
  duplicatePreset: (preset: Preset, newName: string) => Promise<Preset>;
  exportPreset: (preset: Preset) => string;
  importPreset: (jsonData: string) => Promise<Preset>;
  
  // Filtering and search
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSortBy: (sortBy: "name" | "usage" | "created" | "updated") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  getFilteredPresets: () => Preset[];
  
  // Utilities
  getPresetById: (id: string) => Preset | undefined;
  getPresetCategories: () => string[];
}

export const usePresetStore = create<PresetState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    presetManager: new PresetManager(),
    builtInPresets: [],
    userPresets: [],
    publicPresets: [],
    currentPreset: null,
    isLoadingPresets: false,
    searchQuery: "",
    selectedCategory: null,
    sortBy: "name",
    sortOrder: "asc",

    // Actions
    loadPresets: async () => {
      const { presetManager } = get();
      
      try {
        set({ isLoadingPresets: true });
        
        const presets = await presetManager.loadPresets();
        
        set({
          builtInPresets: presets.builtIn,
          userPresets: presets.user,
          publicPresets: presets.public,
          isLoadingPresets: false,
        });
      } catch (error) {
        console.error("Failed to load presets:", error);
        set({ isLoadingPresets: false });
        throw error;
      }
    },

    createPreset: async (presetData: Omit<InsertPreset, "userId">) => {
      const { presetManager } = get();
      
      try {
        const preset = await presetManager.createPreset(presetData);
        
        set(state => ({
          userPresets: [...state.userPresets, preset],
        }));
        
        return preset;
      } catch (error) {
        console.error("Failed to create preset:", error);
        throw error;
      }
    },

    updatePreset: async (id: string, updates: Partial<InsertPreset>) => {
      const { presetManager } = get();
      
      try {
        const preset = await presetManager.updatePreset(id, updates);
        
        set(state => ({
          userPresets: state.userPresets.map(p => p.id === id ? preset : p),
          currentPreset: state.currentPreset?.id === id ? preset : state.currentPreset,
        }));
        
        return preset;
      } catch (error) {
        console.error("Failed to update preset:", error);
        throw error;
      }
    },

    deletePreset: async (id: string) => {
      const { presetManager } = get();
      
      try {
        await presetManager.deletePreset(id);
        
        set(state => ({
          userPresets: state.userPresets.filter(p => p.id !== id),
          currentPreset: state.currentPreset?.id === id ? null : state.currentPreset,
        }));
      } catch (error) {
        console.error("Failed to delete preset:", error);
        throw error;
      }
    },

    applyPreset: async (preset: Preset) => {
      const { presetManager } = get();
      
      try {
        const parameters = await presetManager.applyPreset(preset.id);
        
        set({ currentPreset: preset });
        
        return parameters;
      } catch (error) {
        console.error("Failed to apply preset:", error);
        throw error;
      }
    },

    duplicatePreset: async (preset: Preset, newName: string) => {
      const presetData = {
        name: newName,
        description: `Copy of ${preset.name}`,
        category: preset.category,
        parameters: preset.parameters,
        isBuiltIn: false,
        isPublic: false,
      };
      
      return get().createPreset(presetData);
    },

    exportPreset: (preset: Preset) => {
      const { presetManager } = get();
      return presetManager.exportPreset(preset);
    },

    importPreset: async (jsonData: string) => {
      const { presetManager } = get();
      
      try {
        const presetData = presetManager.importPreset(jsonData);
        return get().createPreset(presetData);
      } catch (error) {
        console.error("Failed to import preset:", error);
        throw error;
      }
    },

    // Filtering and search
    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setSelectedCategory: (category: string | null) => {
      set({ selectedCategory: category });
    },

    setSortBy: (sortBy: "name" | "usage" | "created" | "updated") => {
      set({ sortBy });
    },

    setSortOrder: (order: "asc" | "desc") => {
      set({ sortOrder: order });
    },

    getFilteredPresets: () => {
      const {
        builtInPresets,
        userPresets,
        publicPresets,
        searchQuery,
        selectedCategory,
        sortBy,
        sortOrder,
      } = get();
      
      let allPresets = [...builtInPresets, ...userPresets, ...publicPresets];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allPresets = allPresets.filter(preset =>
          preset.name.toLowerCase().includes(query) ||
          preset.description?.toLowerCase().includes(query) ||
          preset.codeName?.toLowerCase().includes(query)
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        allPresets = allPresets.filter(preset => preset.category === selectedCategory);
      }
      
      // Apply sorting
      allPresets.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "usage":
            aValue = a.usageCount || 0;
            bValue = b.usageCount || 0;
            break;
          case "created":
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          case "updated":
            aValue = new Date(a.updatedAt || 0).getTime();
            bValue = new Date(b.updatedAt || 0).getTime();
            break;
          default:
            return 0;
        }
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });
      
      return allPresets;
    },

    // Utilities
    getPresetById: (id: string) => {
      const { builtInPresets, userPresets, publicPresets } = get();
      return [...builtInPresets, ...userPresets, ...publicPresets].find(p => p.id === id);
    },

    getPresetCategories: () => {
      const { builtInPresets, userPresets, publicPresets } = get();
      const categories = new Set<string>();
      
      [...builtInPresets, ...userPresets, ...publicPresets].forEach(preset => {
        if (preset.category) {
          categories.add(preset.category);
        }
      });
      
      return Array.from(categories).sort();
    },
  }))
);

// Load presets on store initialization
usePresetStore.getState().loadPresets().catch(console.error);
