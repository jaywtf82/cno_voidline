import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemMessage {
  id: string;
  type: 'status' | 'alert' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

interface LiveSystemFeedProps {
  className?: string;
  isActive?: boolean;
}

export function LiveSystemFeed({ className = '', isActive = false }: LiveSystemFeedProps) {
  const [messages, setMessages] = useState<SystemMessage[]>([
    {
      id: '1',
      type: 'status',
      message: 'AI core initialized and stable.',
      timestamp: new Date(Date.now() - 5000)
    },
    {
      id: '2',
      type: 'status',
      message: 'Neural network connection is nominal.',
      timestamp: new Date(Date.now() - 3000)
    },
    {
      id: '3',
      type: 'alert',
      message: 'Solar flare activity detected. Uplink integrity at 96%.',
      timestamp: new Date(Date.now() - 1000)
    },
    {
      id: '4',
      type: 'info',
      message: 'System is ready for your command.',
      timestamp: new Date()
    }
  ]);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const systemMessages = [
        { type: 'status', message: 'Frequency analysis module online.' },
        { type: 'status', message: 'Dynamic range processor calibrated.' },
        { type: 'info', message: 'Stereo imaging matrix active.' },
        { type: 'alert', message: 'Peak limiter threshold optimized.' },
        { type: 'warning', message: 'High frequency content detected.' },
        { type: 'status', message: 'AI mastering algorithms engaged.' },
        { type: 'info', message: 'Harmonic enhancement ready.' },
        { type: 'status', message: 'Audio buffer synchronized.' },
        { type: 'alert', message: 'Signal processing at optimal levels.' },
        { type: 'status', message: 'Transmission parameters locked.' }
      ];

      const randomMessage = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      const newMessage: SystemMessage = {
        id: Date.now().toString(),
        type: randomMessage.type as SystemMessage['type'],
        message: randomMessage.message,
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [newMessage, ...prev.slice(0, 7)];
        return updated;
      });
    }, 3000 + Math.random() * 4000); // Random interval between 3-7 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const getMessageColor = (type: SystemMessage['type']) => {
    switch (type) {
      case 'status': return 'text-emerald-400';
      case 'alert': return 'text-orange-400';
      case 'warning': return 'text-red-400';
      case 'info': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getMessagePrefix = (type: SystemMessage['type']) => {
    switch (type) {
      case 'status': return '[STATUS]';
      case 'alert': return '[ALERT]';
      case 'warning': return '[WARNING]';
      case 'info': return '[INFO]';
      default: return '[SYS]';
    }
  };

  return (
    <div className={`bg-black/80 border border-emerald-500/30 rounded-lg p-4 font-mono text-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <h3 className="text-emerald-400 font-bold text-xs tracking-wider">LIVE SYSTEM FEED</h3>
        </div>
        <div className="text-emerald-400/60 text-xs">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="bg-black/60 border border-emerald-500/20 rounded p-3 h-48 overflow-hidden">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ 
                  opacity: 1 - (index * 0.1), 
                  x: 0, 
                  height: 'auto',
                  transition: { duration: 0.3 }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20, 
                  height: 0,
                  transition: { duration: 0.2 }
                }}
                className={`flex items-start space-x-2 text-xs ${getMessageColor(message.type)}`}
                style={{ opacity: Math.max(0.2, 1 - (index * 0.15)) }}
              >
                <span className="text-emerald-400/70 min-w-fit">
                  {message.timestamp.toLocaleTimeString().split(':').slice(0, 2).join(':')}
                </span>
                <span className="font-semibold min-w-fit">
                  {getMessagePrefix(message.type)}
                </span>
                <span className="flex-1 leading-relaxed">
                  {message.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Scrolling effect overlay */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-500/20">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
            <span className="text-cyan-400">DSP-ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            <span className="text-orange-400">AI-READY</span>
          </div>
        </div>
        <div className="text-emerald-400/60 text-xs">
          {isActive ? 'MONITORING' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
}