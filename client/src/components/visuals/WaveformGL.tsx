import React, { useEffect, useRef, useCallback } from 'react';
import { Ticker } from '@/graphics/Ticker';
import { palette } from '@/graphics/palette';
import { usePhase2Source, usePhase2Time } from '@/state/useSessionStore';
import { Badge } from '@/components/ui/badge';

export const WaveformGL: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const buffersRef = useRef<{ position: WebGLBuffer | null; color: WebGLBuffer | null }>({
    position: null,
    color: null
  });
  
  const phase2Source = usePhase2Source();
  const timeData = usePhase2Time();
  
  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    
    glRef.current = gl;
    
    // Vertex shader
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec4 a_color;
      out vec4 v_color;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `;
    
    // Fragment shader
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      in vec4 v_color;
      out vec4 fragColor;
      
      void main() {
        fragColor = v_color;
      }
    `;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    programRef.current = program;
    
    // Create buffers
    buffersRef.current.position = gl.createBuffer();
    buffersRef.current.color = gl.createBuffer();
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (buffersRef.current.position) gl.deleteBuffer(buffersRef.current.position);
      if (buffersRef.current.color) gl.deleteBuffer(buffersRef.current.color);
    };
  }, []);
  
  const render = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!canvas || !gl || !program) return;
    
    // Update canvas size
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth * dpr;
    const displayHeight = canvas.clientHeight * dpr;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }
    
    // Clear
    gl.clearColor(...palette.background.primary);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (!timeData || timeData.length === 0) {
      return;
    }
    
    gl.useProgram(program);
    
    // Generate waveform vertices
    const numSamples = Math.min(timeData.length, 512);
    const positions = new Float32Array(numSamples * 2);
    const colors = new Float32Array(numSamples * 4);
    
    const sourceColor = phase2Source === 'post' ? palette.audio.postSource : palette.audio.preSource;
    
    for (let i = 0; i < numSamples; i++) {
      const x = (i / (numSamples - 1)) * 2 - 1; // -1 to 1
      const y = timeData[i] || 0; // Amplitude
      
      positions[i * 2] = x;
      positions[i * 2 + 1] = y;
      
      colors[i * 4] = sourceColor[0];
      colors[i * 4 + 1] = sourceColor[1];
      colors[i * 4 + 2] = sourceColor[2];
      colors[i * 4 + 3] = sourceColor[3];
    }
    
    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.position);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.color);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    
    // Draw waveform
    gl.drawArrays(gl.LINE_STRIP, 0, numSamples);
  }, [timeData, phase2Source]);
  
  useEffect(() => {
    const unsubscribe = Ticker.subscribe(render);
    return unsubscribe;
  }, [render]);
  
  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '200px' }}
      />
      {phase2Source === 'post' && (
        <Badge className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          PROCESSED
        </Badge>
      )}
      {(!timeData || timeData.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Building preview...
        </div>
      )}
    </div>
  );
};