/**
 * Preset Store - Save/load/export user presets
 * IndexedDB + JSON export functionality
 */

import { ChainParams } from './ai/presetEngine';

export interface UserPreset {
  id: string;
  name: string;
  description: string;
  target: 'streaming' | 'club' | 'vinyl' | 'custom';
  params: ChainParams;
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
  author: string;
  version: string;
  isBuiltIn: boolean;
}

export interface PresetLibrary {
  presets: UserPreset[];
  categories: string[];
  version: string;
  exportedAt: Date;
}

class PresetStore {
  private dbName = 'VoidlinePresets';
  private dbVersion = 1;
  private storeName = 'presets';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Preset store initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('target', 'target', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log('Created preset object store');
        }
      };
    });
  }

  async savePreset(preset: Omit<UserPreset, 'id' | 'createdAt' | 'modifiedAt'>): Promise<string> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const fullPreset: UserPreset = {
      ...preset,
      id,
      createdAt: now,
      modifiedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(fullPreset);
      
      request.onsuccess = () => {
        console.log(`Preset saved: ${fullPreset.name} (${id})`);
        resolve(id);
      };
      
      request.onerror = () => {
        console.error('Failed to save preset:', request.error);
        reject(request.error);
      };
    });
  }

  async updatePreset(id: string, updates: Partial<UserPreset>): Promise<void> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    const existingPreset = await this.getPreset(id);
    if (!existingPreset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const updatedPreset: UserPreset = {
      ...existingPreset,
      ...updates,
      id, // Ensure ID doesn't change
      modifiedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updatedPreset);
      
      request.onsuccess = () => {
        console.log(`Preset updated: ${updatedPreset.name} (${id})`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to update preset:', request.error);
        reject(request.error);
      };
    });
  }

  async getPreset(id: string): Promise<UserPreset | null> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('Failed to get preset:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllPresets(): Promise<UserPreset[]> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        console.error('Failed to get all presets:', request.error);
        reject(request.error);
      };
    });
  }

  async getPresetsByTarget(target: UserPreset['target']): Promise<UserPreset[]> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('target');
      const request = index.getAll(target);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        console.error('Failed to get presets by target:', request.error);
        reject(request.error);
      };
    });
  }

  async searchPresets(query: string, tags?: string[]): Promise<UserPreset[]> {
    const allPresets = await this.getAllPresets();
    const searchTerm = query.toLowerCase();
    
    return allPresets.filter(preset => {
      // Text search in name and description
      const textMatch = preset.name.toLowerCase().includes(searchTerm) ||
                       preset.description.toLowerCase().includes(searchTerm);
      
      // Tag filtering
      const tagMatch = !tags || tags.length === 0 || 
                      tags.some(tag => preset.tags.includes(tag));
      
      return textMatch && tagMatch;
    });
  }

  async deletePreset(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Preset store not initialized');
    }

    const preset = await this.getPreset(id);
    if (preset?.isBuiltIn) {
      throw new Error('Cannot delete built-in preset');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log(`Preset deleted: ${id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to delete preset:', request.error);
        reject(request.error);
      };
    });
  }

  async exportPreset(id: string): Promise<string> {
    const preset = await this.getPreset(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const exportData = {
      preset,
      exportedAt: new Date(),
      version: '1.0.0',
      application: 'C/No Voidline'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportLibrary(presetIds?: string[]): Promise<string> {
    let presets: UserPreset[];
    
    if (presetIds) {
      presets = [];
      for (const id of presetIds) {
        const preset = await this.getPreset(id);
        if (preset) presets.push(preset);
      }
    } else {
      presets = await this.getAllPresets();
    }

    // Extract unique categories from tags
    const categories = [...new Set(presets.flatMap(p => p.tags))];

    const library: PresetLibrary = {
      presets,
      categories,
      version: '1.0.0',
      exportedAt: new Date()
    };

    return JSON.stringify(library, null, 2);
  }

  async importPreset(jsonData: string): Promise<string> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.preset) {
        // Single preset import
        const preset = data.preset;
        const importedPreset = {
          ...preset,
          isBuiltIn: false,
          author: preset.author || 'Imported'
        };
        
        // Remove ID to generate new one
        delete importedPreset.id;
        delete importedPreset.createdAt;
        delete importedPreset.modifiedAt;
        
        return await this.savePreset(importedPreset);
      } else if (data.presets) {
        // Library import
        const results = [];
        for (const preset of data.presets) {
          try {
            const importedPreset = {
              ...preset,
              isBuiltIn: false,
              author: preset.author || 'Imported'
            };
            
            delete importedPreset.id;
            delete importedPreset.createdAt;
            delete importedPreset.modifiedAt;
            
            const id = await this.savePreset(importedPreset);
            results.push(id);
          } catch (error) {
            console.warn(`Failed to import preset ${preset.name}:`, error);
          }
        }
        
        return `Imported ${results.length} presets`;
      } else {
        throw new Error('Invalid preset format');
      }
    } catch (error) {
      throw new Error(`Failed to import preset: ${error}`);
    }
  }

  async loadBuiltInPresets(): Promise<void> {
    console.log('Loading built-in presets...');
    
    const builtInPresets: Omit<UserPreset, 'id' | 'createdAt' | 'modifiedAt'>[] = [
      {
        name: 'Streaming Standard',
        description: 'Balanced mastering for streaming platforms like Spotify and Apple Music',
        target: 'streaming',
        params: {
          target: 'streaming',
          transient: { attack: 0, sustain: 0 },
          msEncode: { enabled: false },
          xover: { frequencies: [250, 2500], type: 'linear' },
          multiband: {
            bands: [
              { threshold: -20, ratio: 2.5, attack: 10, release: 100, knee: 2, makeup: 0 },
              { threshold: -18, ratio: 2.0, attack: 5, release: 50, knee: 2, makeup: 0 },
              { threshold: -16, ratio: 1.8, attack: 3, release: 30, knee: 1, makeup: 0 }
            ]
          },
          eq: { pre: [], post: [] },
          stereoWidth: { width: 100, monoBelow: 120 },
          limiter: { ceiling: -1.0, lookahead: 5, release: 50, style: 'transparent' },
          dither: { enabled: false, noise: 'tpdf', shaping: false }
        },
        tags: ['streaming', 'balanced', 'transparent'],
        author: 'C/No Voidline',
        version: '1.0.0',
        isBuiltIn: true
      },
      {
        name: 'Club Banger',
        description: 'High-energy mastering for club and DJ systems with maximum impact',
        target: 'club',
        params: {
          target: 'club',
          transient: { attack: 2, sustain: -1 },
          msEncode: { enabled: false },
          xover: { frequencies: [200, 3000], type: 'minimum' },
          multiband: {
            bands: [
              { threshold: -16, ratio: 3.5, attack: 8, release: 80, knee: 2, makeup: 2 },
              { threshold: -14, ratio: 3.0, attack: 4, release: 40, knee: 2, makeup: 1 },
              { threshold: -12, ratio: 2.5, attack: 2, release: 25, knee: 1, makeup: 0 }
            ]
          },
          eq: { 
            pre: [{ type: 'highshelf', freq: 8000, q: 0.7, gain: 2 }], 
            post: [] 
          },
          stereoWidth: { width: 110, monoBelow: 100 },
          limiter: { ceiling: -0.9, lookahead: 3, release: 30, style: 'punchy' },
          dither: { enabled: false, noise: 'tpdf', shaping: false }
        },
        tags: ['club', 'aggressive', 'loud', 'punchy'],
        author: 'C/No Voidline',
        version: '1.0.0',
        isBuiltIn: true
      },
      {
        name: 'Vinyl Warmth',
        description: 'Wide dynamics and warmth optimized for vinyl pressing',
        target: 'vinyl',
        params: {
          target: 'vinyl',
          transient: { attack: -1, sustain: 1 },
          msEncode: { enabled: true },
          xover: { frequencies: [300, 2000], type: 'linear' },
          multiband: {
            bands: [
              { threshold: -24, ratio: 2.0, attack: 15, release: 150, knee: 3, makeup: 0 },
              { threshold: -22, ratio: 1.8, attack: 8, release: 80, knee: 3, makeup: 0 },
              { threshold: -20, ratio: 1.5, attack: 5, release: 50, knee: 2, makeup: 0 }
            ]
          },
          eq: { 
            pre: [
              { type: 'highpass', freq: 30, q: 0.7, gain: 0 },
              { type: 'lowshelf', freq: 100, q: 0.8, gain: -1 }
            ], 
            post: [] 
          },
          stereoWidth: { width: 95, monoBelow: 150 },
          limiter: { ceiling: -2.0, lookahead: 8, release: 80, style: 'warm' },
          dither: { enabled: true, noise: 'tpdf', shaping: true }
        },
        tags: ['vinyl', 'warm', 'dynamic', 'analog'],
        author: 'C/No Voidline',
        version: '1.0.0',
        isBuiltIn: true
      }
    ];

    for (const preset of builtInPresets) {
      try {
        // Check if built-in preset already exists
        const existing = await this.searchPresets(preset.name);
        if (existing.some(p => p.isBuiltIn)) {
          continue; // Skip if already exists
        }
        
        await this.savePreset(preset);
        console.log(`Loaded built-in preset: ${preset.name}`);
      } catch (error) {
        console.warn(`Failed to load built-in preset ${preset.name}:`, error);
      }
    }
  }

  async clearUserPresets(): Promise<void> {
    const allPresets = await this.getAllPresets();
    const userPresets = allPresets.filter(p => !p.isBuiltIn);
    
    for (const preset of userPresets) {
      await this.deletePreset(preset.id);
    }
    
    console.log(`Cleared ${userPresets.length} user presets`);
  }
}

// Global preset store instance
let presetStoreInstance: PresetStore | null = null;

export async function getPresetStore(): Promise<PresetStore> {
  if (!presetStoreInstance) {
    presetStoreInstance = new PresetStore();
    await presetStoreInstance.initialize();
    await presetStoreInstance.loadBuiltInPresets();
  }
  return presetStoreInstance;
}

export { PresetStore };