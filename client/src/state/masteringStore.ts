
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MasteringSession {
  id: string;
  fileMeta: {
    name: string;
    duration: number;
    sr: number;
    channels: number;
  };
  buffer: AudioBuffer | null;
  analysis: any;
  settings: {
    fftSize: number;
    smoothing: number;
    corridor: 'streaming' | 'club' | 'vinyl';
    scopeMode: 'polar' | 'lissa';
    activePhase?: 'nuance' | 'dynamics' | 'frequencies' | 'stereo';
  };
  ai?: {
    balance?: number;
    dynamics?: number;
    risks?: string[];
  };
}

interface MasteringStore {
  session: MasteringSession | null;
  sessions: Map<string, MasteringSession>;
  
  // Actions
  createSession: (fileMeta: any, buffer: AudioBuffer) => string;
  loadSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<MasteringSession>) => void;
  updateSettings: (settings: Partial<MasteringSession['settings']>) => void;
  setAnalysis: (analysis: any) => void;
  setAiInsights: (ai: MasteringSession['ai']) => void;
  clearSession: () => void;
}

export const useMasteringStore = create<MasteringStore>()(
  persist(
    (set, get) => ({
      session: null,
      sessions: new Map(),

      createSession: (fileMeta, buffer) => {
        const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newSession: MasteringSession = {
          id,
          fileMeta: {
            name: fileMeta.name || 'Unknown',
            duration: buffer.duration,
            sr: buffer.sampleRate,
            channels: buffer.numberOfChannels,
          },
          buffer,
          analysis: null,
          settings: {
            fftSize: 2048,
            smoothing: 0.8,
            corridor: 'streaming',
            scopeMode: 'polar',
          },
        };

        set((state) => {
          const newSessions = new Map(state.sessions);
          newSessions.set(id, newSession);
          return {
            session: newSession,
            sessions: newSessions,
          };
        });

        // Store audio buffer in IndexedDB (simplified)
        try {
          const request = indexedDB.open('voidline_sessions', 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('audioBuffers')) {
              db.createObjectStore('audioBuffers', { keyPath: 'id' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['audioBuffers'], 'readwrite');
            const store = transaction.objectStore('audioBuffers');
            
            // Convert AudioBuffer to transferable format
            const channels = [];
            for (let i = 0; i < buffer.numberOfChannels; i++) {
              channels.push(Array.from(buffer.getChannelData(i)));
            }
            
            store.put({
              id,
              sampleRate: buffer.sampleRate,
              length: buffer.length,
              numberOfChannels: buffer.numberOfChannels,
              channels,
            });
          };
        } catch (error) {
          console.warn('Failed to store audio buffer in IndexedDB:', error);
        }

        return id;
      },

      loadSession: (id) => {
        const state = get();
        const session = state.sessions.get(id);
        
        if (session) {
          set({ session });
          
          // Load audio buffer from IndexedDB if not present
          if (!session.buffer) {
            try {
              const request = indexedDB.open('voidline_sessions', 1);
              request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['audioBuffers'], 'readonly');
                const store = transaction.objectStore('audioBuffers');
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                  const data = getRequest.result;
                  if (data) {
                    // Reconstruct AudioBuffer
                    const audioContext = new AudioContext();
                    const buffer = audioContext.createBuffer(
                      data.numberOfChannels,
                      data.length,
                      data.sampleRate
                    );
                    
                    for (let i = 0; i < data.numberOfChannels; i++) {
                      buffer.copyToChannel(new Float32Array(data.channels[i]), i);
                    }
                    
                    set((state) => ({
                      session: state.session ? { ...state.session, buffer } : null
                    }));
                  }
                };
              };
            } catch (error) {
              console.warn('Failed to load audio buffer from IndexedDB:', error);
            }
          }
        }
      },

      updateSession: (id, updates) => {
        set((state) => {
          const newSessions = new Map(state.sessions);
          const existingSession = newSessions.get(id);
          
          if (existingSession) {
            const updatedSession = { ...existingSession, ...updates };
            newSessions.set(id, updatedSession);
            
            return {
              sessions: newSessions,
              session: state.session?.id === id ? updatedSession : state.session,
            };
          }
          
          return state;
        });
      },

      updateSettings: (settings) => {
        set((state) => {
          if (!state.session) return state;
          
          const updatedSession = {
            ...state.session,
            settings: { ...state.session.settings, ...settings },
          };
          
          const newSessions = new Map(state.sessions);
          newSessions.set(state.session.id, updatedSession);
          
          return {
            session: updatedSession,
            sessions: newSessions,
          };
        });
      },

      setAnalysis: (analysis) => {
        set((state) => {
          if (!state.session) return state;
          
          const updatedSession = { ...state.session, analysis };
          const newSessions = new Map(state.sessions);
          newSessions.set(state.session.id, updatedSession);
          
          return {
            session: updatedSession,
            sessions: newSessions,
          };
        });
      },

      setAiInsights: (ai) => {
        set((state) => {
          if (!state.session) return state;
          
          const updatedSession = { ...state.session, ai };
          const newSessions = new Map(state.sessions);
          newSessions.set(state.session.id, updatedSession);
          
          return {
            session: updatedSession,
            sessions: newSessions,
          };
        });
      },

      clearSession: () => {
        set({ session: null });
      },
    }),
    {
      name: 'mastering-store',
      partialize: (state) => ({
        sessions: Array.from(state.sessions.entries()).map(([id, session]) => ([
          id,
          { ...session, buffer: null } // Don't persist AudioBuffer in localStorage
        ])),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Map
          state.sessions = new Map(state.sessions || []);
        }
      },
    }
  )
);
