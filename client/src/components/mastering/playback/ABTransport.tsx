import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useMasteringStore } from '@/state/masteringStore';

export interface ABTransportProps {
  sessionId: string;
  onStateChange: (state: 'A' | 'B' | 'bypass' | 'delta' | 'null') => void;
  onMatchGainToggle: (enabled: boolean) => void;
  isProcessing: boolean;
}

export function ABTransport({ 
  sessionId, 
  onStateChange, 
  onMatchGainToggle, 
  isProcessing 
}: ABTransportProps) {
  const { currentSession } = useMasteringStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [abState, setAbState] = useState<'A' | 'B' | 'bypass' | 'delta' | 'null'>('A');
  const [isLooping, setIsLooping] = useState(false);
  const [matchGain, setMatchGain] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    initializeAudio();
    return cleanup;
  }, []);

  const initializeAudio = async () => {
    try {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  const cleanup = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handlePlay = async () => {
    if (!currentSession?.buffer || !audioContextRef.current || !gainNodeRef.current) return;

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Stop current playback
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      // Create new source
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = currentSession.buffer;
      sourceNodeRef.current.loop = isLooping;
      
      // Apply gain compensation if match gain is enabled
      const gainValue = matchGain ? 0.8 : volume;
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : gainValue, 
        audioContextRef.current.currentTime
      );

      sourceNodeRef.current.connect(gainNodeRef.current);
      sourceNodeRef.current.start(0, position);
      
      sourceNodeRef.current.onended = () => {
        if (!isLooping) {
          setIsPlaying(false);
          setPosition(0);
        }
      };

      setIsPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
    }
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
    setPosition(0);
  };

  const handlePause = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
  };

  const handleABStateChange = (newState: typeof abState) => {
    setAbState(newState);
    onStateChange(newState);
    
    // If playing, restart with new processing state
    if (isPlaying) {
      handlePause();
      setTimeout(handlePlay, 100);
    }
  };

  const handleMatchGainChange = () => {
    const newMatchGain = !matchGain;
    setMatchGain(newMatchGain);
    onMatchGainToggle(newMatchGain);
    
    // Update gain immediately if playing
    if (gainNodeRef.current && audioContextRef.current) {
      const gainValue = newMatchGain ? 0.8 : volume;
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : gainValue,
        audioContextRef.current.currentTime
      );
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current && audioContextRef.current && !matchGain) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : newVolume,
        audioContextRef.current.currentTime
      );
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (gainNodeRef.current && audioContextRef.current) {
      const gainValue = matchGain ? 0.8 : volume;
      gainNodeRef.current.gain.setValueAtTime(
        newMuted ? 0 : gainValue,
        audioContextRef.current.currentTime
      );
    }
  };

  const duration = currentSession?.buffer?.duration || 0;
  const formattedPosition = `${Math.floor(position / 60)}:${Math.floor(position % 60).toString().padStart(2, '0')}`;
  const formattedDuration = `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`;

  return (
    <div className="terminal-window">
      <div className="terminal-header px-4 py-2 mb-4 flex items-center justify-between">
        <div className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>
          A/B Transport
        </div>
        <div className="text-xs font-mono text-gray-400">
          {formattedPosition} / {formattedDuration}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Transport Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isProcessing || !currentSession?.buffer}
            className="btn btn-primary"
            data-testid="transport-play-pause"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="btn btn-secondary"
            data-testid="transport-stop"
          >
            <Square className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`btn ${isLooping ? 'btn-primary' : 'btn-secondary'}`}
            data-testid="transport-loop"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* A/B State Controls */}
        <div className="flex items-center justify-center space-x-2">
          {(['A', 'B', 'bypass', 'delta', 'null'] as const).map((state) => (
            <button
              key={state}
              onClick={() => handleABStateChange(state)}
              className={`btn text-xs ${abState === state ? 'btn-primary' : 'btn-secondary'}`}
              data-testid={`ab-state-${state}`}
            >
              {state.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Volume and Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="btn btn-secondary p-2"
              data-testid="transport-mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24"
              disabled={matchGain}
              data-testid="transport-volume"
            />
          </div>

          <button
            onClick={handleMatchGainChange}
            className={`btn text-xs ${matchGain ? 'btn-primary' : 'btn-secondary'}`}
            data-testid="transport-match-gain"
          >
            Match Gain
          </button>
        </div>
      </div>
    </div>
  );
}