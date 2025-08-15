import React, { useEffect, useRef, useState } from 'react';
import { Pin, Maximize2, Copy, X, Minimize2 } from 'lucide-react';
import { useLiveFeedHub, type LiveEvent } from '@/state/liveFeedHub';
import { Button } from '@/components/ui/button';
import '@/styles/overlays.css';

/**
 * LiveFeedTerminal - Unified floating terminal for all live events
 * Appears below toast stack, auto-dismisses on completion unless pinned
 */
export function LiveFeedTerminal() {
  const {
    events,
    isVisible,
    isPinned,
    isExpanded,
    setVisible,
    setPinned,
    setExpanded,
    clear,
    subscribe
  } = useLiveFeedHub();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const [localEvents, setLocalEvents] = useState<LiveEvent[]>(events);
  
  // Subscribe to events
  useEffect(() => {
    const unsubscribe = subscribe((newEvents) => {
      setLocalEvents(newEvents);
      
      // Auto-scroll to bottom
      if (contentRef.current) {
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        });
      }
    });
    
    return unsubscribe;
  }, [subscribe]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      // Global shortcuts
      if (e.key === 'Escape' && !isPinned) {
        setVisible(false);
      } else if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setExpanded(!isExpanded);
      } else if (e.key === 'x' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        clear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isPinned, isExpanded, setVisible, setExpanded, clear]);
  
  const handlePin = () => {
    setPinned(!isPinned);
  };
  
  const handleExpand = () => {
    setExpanded(!isExpanded);
  };
  
  const handleCopy = async () => {
    const text = localEvents.map(event => 
      `[${formatTimestamp(event.t)}] ${event.src.toUpperCase()}: ${event.msg}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      // Could show a brief success indicator here
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };
  
  const handleClose = () => {
    if (!isPinned) {
      setVisible(false);
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const getSourceColor = (src: LiveEvent['src'], type?: string) => {
    switch (src) {
      case 'analysis': return 'text-blue-400';
      case 'worklet': return 'text-green-400';
      case 'ai': return 'text-yellow-400';
      case 'ui': return type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-gray-400';
      case 'system': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };
  
  const getLineClass = (event: LiveEvent) => {
    let classes = 'live-feed-terminal__line';
    
    if ('type' in event) {
      if (event.type === 'error') classes += ' live-feed-terminal__line--error';
      else if (event.type === 'success') classes += ' live-feed-terminal__line--success';
      else if (event.type === 'warning') classes += ' live-feed-terminal__line--warning';
    }
    
    classes += ` live-feed-terminal__line--${event.src}`;
    
    return classes;
  };
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }
  
  return (
    <>
      {/* Modal backdrop for expanded view */}
      {isExpanded && (
        <div 
          className="live-feed-modal-backdrop live-feed-modal-backdrop--visible"
          onClick={() => setExpanded(false)}
        />
      )}
      
      {/* Terminal */}
      <div 
        className={`live-feed-terminal ${isVisible ? 'live-feed-terminal--visible' : ''} ${isExpanded ? 'live-feed-terminal--expanded' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Live feed terminal"
      >
        {/* Header */}
        <div className="live-feed-terminal__header">
          <div className="live-feed-terminal__title">
            <div className={`live-feed-terminal__status-dot ${localEvents.length === 0 ? 'live-feed-terminal__status-dot--idle' : ''}`} />
            Live Feed
            {localEvents.length > 0 && (
              <span className="text-terminal-text-dim ml-1">
                ({localEvents.length})
              </span>
            )}
          </div>
          
          <div className="live-feed-terminal__controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePin}
              className={`live-feed-terminal__control-btn ${isPinned ? 'live-feed-terminal__control-btn--pinned' : ''}`}
              title={isPinned ? 'Unpin (keeps open)' : 'Pin (keeps open)'}
            >
              <Pin className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              className="live-feed-terminal__control-btn"
              title={isExpanded ? 'Minimize (⌘+G)' : 'Expand (⌘+G)'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="live-feed-terminal__control-btn"
              title="Copy all (⌘+C)"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="live-feed-terminal__control-btn"
              title="Close"
              disabled={isPinned}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div 
          ref={contentRef}
          className="live-feed-terminal__content"
        >
          {localEvents.length === 0 ? (
            <div className="live-feed-terminal__line">
              <span className="live-feed-terminal__timestamp">--:--:--</span>
              <span className="live-feed-terminal__source">system</span>
              <span className="live-feed-terminal__message text-terminal-text-dim">
                Waiting for events...
              </span>
            </div>
          ) : (
            localEvents.map((event, index) => (
              <div key={index} className={getLineClass(event)}>
                <span className="live-feed-terminal__timestamp">
                  {formatTimestamp(event.t)}
                </span>
                <span className={`live-feed-terminal__source ${getSourceColor(event.src, 'type' in event ? event.type : undefined)}`}>
                  {event.src}
                </span>
                <span className="live-feed-terminal__message">
                  {event.msg}
                </span>
                {'pct' in event && event.pct !== undefined && (
                  <span className="live-feed-terminal__progress">
                    {Math.round(event.pct)}%
                  </span>
                )}
                {'epoch' in event && event.epoch !== undefined && (
                  <span className="live-feed-terminal__progress">
                    E{event.epoch}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}