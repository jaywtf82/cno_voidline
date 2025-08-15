import { create } from 'zustand';

/**
 * LiveEvent - Unified event structure for all live feed sources
 */
export type LiveEvent =
  | { t: number; src: 'analysis'; type: 'progress' | 'summary'; msg: string; pct?: number }
  | { t: number; src: 'worklet'; type: 'lufs' | 'dbtp' | 'lra' | 'rms' | 'corr'; payload: any; msg: string }
  | { t: number; src: 'ai'; type: 'init' | 'epoch' | 'done'; msg: string; epoch?: number; loss?: number }
  | { t: number; src: 'ui'; type: 'action' | 'warning' | 'error' | 'success'; msg: string }
  | { t: number; src: 'system'; type: 'complete'; msg: string; taskId?: string };

/**
 * LiveFeedState - Central hub for all live events
 * Ring buffer with coalescing to prevent UI thrash
 */
interface LiveFeedState {
  events: LiveEvent[];
  maxEvents: number;
  isVisible: boolean;
  isPinned: boolean;
  isExpanded: boolean;
  subscribers: Set<(events: LiveEvent[]) => void>;
  
  // Actions
  push: (event: Omit<LiveEvent, 't'>) => void;
  complete: (taskId: string, summary?: string) => void;
  subscribe: (callback: (events: LiveEvent[]) => void) => () => void;
  setVisible: (visible: boolean) => void;
  setPinned: (pinned: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  clear: () => void;
}

/**
 * Coalescing logic for frequent numeric updates
 */
function shouldCoalesce(newEvent: LiveEvent, lastEvent: LiveEvent): boolean {
  if (newEvent.src !== lastEvent.src || newEvent.type !== lastEvent.type) {
    return false;
  }
  
  // Coalesce worklet frames if they're within 100ms
  if (newEvent.src === 'worklet' && (newEvent.t - lastEvent.t) < 100) {
    return true;
  }
  
  // Coalesce progress updates if they're within 500ms
  if (newEvent.src === 'analysis' && newEvent.type === 'progress' && (newEvent.t - lastEvent.t) < 500) {
    return true;
  }
  
  return false;
}

/**
 * Global live feed hub store
 */
export const useLiveFeedHub = create<LiveFeedState>((set, get) => {
  let rafId: number | null = null;
  
  // RAF-scheduled flush to avoid layout thrash
  const scheduleFlush = () => {
    if (rafId) return;
    
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const { events, subscribers } = get();
      subscribers.forEach(callback => callback([...events]));
    });
  };

  return {
    events: [],
    maxEvents: 150,
    isVisible: false,
    isPinned: false,
    isExpanded: false,
    subscribers: new Set(),

    push: (eventData) => {
      const event: LiveEvent = {
        ...eventData,
        t: Date.now()
      } as LiveEvent;

      set((state) => {
        let newEvents = [...state.events];
        
        // Coalescing logic
        if (newEvents.length > 0) {
          const lastEvent = newEvents[newEvents.length - 1];
          if (shouldCoalesce(event, lastEvent)) {
            newEvents[newEvents.length - 1] = event;
          } else {
            newEvents.push(event);
          }
        } else {
          newEvents.push(event);
        }
        
        // Ring buffer
        if (newEvents.length > state.maxEvents) {
          newEvents = newEvents.slice(-state.maxEvents);
        }
        
        // Show terminal on first event
        const shouldShow = !state.isVisible && newEvents.length > 0;
        
        return {
          events: newEvents,
          isVisible: shouldShow || state.isVisible || state.isPinned
        };
      });
      
      scheduleFlush();
    },

    complete: (taskId: string, summary?: string) => {
      const { push } = get();
      
      push({
        src: 'system',
        type: 'complete',
        msg: summary || `Task ${taskId} completed`,
        taskId
      });
      
      // Auto-dismiss after 3 seconds if not pinned
      setTimeout(() => {
        const { isPinned } = get();
        if (!isPinned) {
          set({ isVisible: false });
        }
      }, 3000);
    },

    subscribe: (callback) => {
      const { subscribers } = get();
      subscribers.add(callback);
      
      // Return unsubscribe function
      return () => {
        const { subscribers } = get();
        subscribers.delete(callback);
      };
    },

    setVisible: (visible) => set({ isVisible: visible }),
    setPinned: (pinned) => set({ isPinned: pinned }),
    setExpanded: (expanded) => set({ isExpanded: expanded }),
    
    clear: () => set({ 
      events: [],
      isVisible: false,
      isExpanded: false
    })
  };
});

/**
 * Convenience functions for pushing different event types
 */
export const liveFeed = {
  analysis: {
    progress: (msg: string, pct?: number) => 
      useLiveFeedHub.getState().push({ src: 'analysis', type: 'progress', msg, pct }),
    summary: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'analysis', type: 'summary', msg })
  },
  
  worklet: {
    lufs: (payload: any, value: number) => 
      useLiveFeedHub.getState().push({ src: 'worklet', type: 'lufs', payload, msg: `LUFS: ${value.toFixed(1)}` }),
    dbtp: (payload: any, value: number) => 
      useLiveFeedHub.getState().push({ src: 'worklet', type: 'dbtp', payload, msg: `dBTP: ${value.toFixed(1)}` }),
    lra: (payload: any, value: number) => 
      useLiveFeedHub.getState().push({ src: 'worklet', type: 'lra', payload, msg: `LRA: ${value.toFixed(1)}` }),
    rms: (payload: any, value: number) => 
      useLiveFeedHub.getState().push({ src: 'worklet', type: 'rms', payload, msg: `RMS: ${value.toFixed(1)}` }),
    corr: (payload: any, value: number) => 
      useLiveFeedHub.getState().push({ src: 'worklet', type: 'corr', payload, msg: `Corr: ${value.toFixed(2)}` })
  },
  
  ai: {
    init: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ai', type: 'init', msg }),
    epoch: (msg: string, epoch: number, loss?: number) => 
      useLiveFeedHub.getState().push({ src: 'ai', type: 'epoch', msg, epoch, loss }),
    done: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ai', type: 'done', msg })
  },
  
  ui: {
    action: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ui', type: 'action', msg }),
    warning: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ui', type: 'warning', msg }),
    error: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ui', type: 'error', msg }),
    success: (msg: string) => 
      useLiveFeedHub.getState().push({ src: 'ui', type: 'success', msg })
  },
  
  complete: (taskId: string, summary?: string) => 
    useLiveFeedHub.getState().complete(taskId, summary)
};