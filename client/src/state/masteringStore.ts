import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AudioMetrics {
  lufs: number;
  dbtp: number;
  lra: number;
  rms: number;
  correlation: number;
  dynamicRange: number;
  spectralCentroid: number;
}

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
  audioMetrics: AudioMetrics | null;
  currentPhase: 'upload' | 'analysis' | 'phase1' | 'phase2' | 'phase3' | 'complete';
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
  currentSession: MasteringSession | null;
  sessions: Map<string, MasteringSession>;
  audioMetrics: AudioMetrics | null;

  // Actions
  createSession: (fileMeta: any, buffer: AudioBuffer) => string;
  loadSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<MasteringSession>) => void;
  updateSettings: (settings: Partial<MasteringSession['settings']>) => void;
  setAnalysis: (analysis: any) => void;
  setAudioMetrics: (metrics: AudioMetrics) => void;
  setSessionPhase: (phase: MasteringSession['currentPhase']) => void;
  setAiInsights: (ai: MasteringSession['ai']) => void;
  clearSession: () => void;
}

export const useMasteringStore = create<MasteringStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: new Map(),
      audioMetrics: null,

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
          audioMetrics: null,
          currentPhase: 'upload',
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
            currentSession: newSession,
            sessions: newSessions,
            audioMetrics: null,
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
          set({ 
            currentSession: session, 
            audioMetrics: session.audioMetrics 
          });

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
                      currentSession: state.currentSession ? { ...state.currentSession, buffer } : null
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
              currentSession: state.currentSession?.id === id ? updatedSession : state.currentSession,
              audioMetrics: state.currentSession?.id === id ? updatedSession.audioMetrics || state.audioMetrics : state.audioMetrics,
            };
          }

          return state;
        });
      },

      updateSettings: (settings) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = {
            ...state.currentSession,
            settings: { ...state.currentSession.settings, ...settings },
          };

          const newSessions = new Map(state.sessions);
          newSessions.set(state.currentSession.id, updatedSession);

          return {
            currentSession: updatedSession,
            sessions: newSessions,
          };
        });
      },

      setAnalysis: (analysis) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = { ...state.currentSession, analysis };
          const newSessions = new Map(state.sessions);
          newSessions.set(state.currentSession.id, updatedSession);

          return {
            currentSession: updatedSession,
            sessions: newSessions,
          };
        });
      },

      setAudioMetrics: (metrics) => {
        set((state) => {
          if (state.currentSession) {
            const updatedSession = { ...state.currentSession, audioMetrics: metrics };
            const sessions = new Map(state.sessions);
            sessions.set(state.currentSession.id, updatedSession);
            return {
              currentSession: updatedSession,
              sessions,
              audioMetrics: metrics,
            };
          }
          return { ...state, audioMetrics: metrics };
        });
      },

      setSessionPhase: (phase) => {
        set((state) => {
          if (state.currentSession) {
            const updatedSession = { ...state.currentSession, currentPhase: phase };
            const sessions = new Map(state.sessions);
            sessions.set(state.currentSession.id, updatedSession);
            return {
              currentSession: updatedSession,
              sessions,
            };
          }
          return state;
        });
      },

      setAiInsights: (ai) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = { ...state.currentSession, ai };
          const newSessions = new Map(state.sessions);
          newSessions.set(state.currentSession.id, updatedSession);

          return {
            currentSession: updatedSession,
            sessions: newSessions,
          };
        });
      },

      clearSession: () => {
        set({ currentSession: null, audioMetrics: null });
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