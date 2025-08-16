import React, { useRef, useEffect, useCallback } from 'react';
import { Ticker } from '@/graphics/Ticker';
import { palette } from '@/graphics/palette';
import { usePhase2Source, usePhase2Time } from '@/state/useSessionStore';

export const WaveformGL: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const timeData = usePhase2Time();
  const phase2Source = usePhase2Source();

  // Initialize WebGL2
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.warn('WebGL2 not supported, falling back to canvas');
      return;
    }

    glRef.current = gl;

    // Vertex shader
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      uniform vec2 u_resolution;
      uniform float u_amplitude;
      
      void main() {
        vec2 position = a_position;
        position.y *= u_amplitude;
        
        // Convert from pixel coordinates to clip space
        vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      uniform vec3 u_color;
      uniform float u_alpha;
      out vec4 fragColor;
      
      void main() {
        fragColor = vec4(u_color, u_alpha);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    programRef.current = program;

  }, []);

  const render = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!canvas || !gl || !program || !timeData) return;

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Clear
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    gl.useProgram(program);
    
    // Get uniform locations
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const amplitudeLoc = gl.getUniformLocation(program, 'u_amplitude');
    const colorLoc = gl.getUniformLocation(program, 'u_color');
    const alphaLoc = gl.getUniformLocation(program, 'u_alpha');
    
    // Set uniforms
    gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
    gl.uniform1f(amplitudeLoc, 100); // Waveform amplitude
    
    // Color based on source (emphasize post when active)
    const sourceColor = phase2Source === 'post' ? palette.audio.postSource : palette.audio.preSource;
    const [r, g, b] = hexToRgb(sourceColor);
    gl.uniform3f(colorLoc, r / 255, g / 255, b / 255);
    gl.uniform1f(alphaLoc, phase2Source === 'post' ? 1.0 : 0.8);
    
    // Create waveform vertices
    const vertices: number[] = [];
    const samplesPerPixel = Math.max(1, Math.floor(timeData.length / canvas.width));
    
    for (let x = 0; x < canvas.width; x++) {
      const sampleIndex = x * samplesPerPixel;
      if (sampleIndex < timeData.length) {
        const amplitude = timeData[sampleIndex] * (canvas.height * 0.4);
        const centerY = canvas.height * 0.5;
        
        vertices.push(x, centerY + amplitude);
        vertices.push(x, centerY - amplitude);
      }
    }
    
    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    // Set up attribute
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 2);
    
    // Cleanup
    gl.deleteBuffer(positionBuffer);
    
  }, [timeData, phase2Source]);

  // Subscribe to global ticker
  useEffect(() => {
    return Ticker.subscribe(render);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={200}
      className="w-full h-32 bg-black border border-green-800 rounded"
    />
  );
};

// WebGL utility functions
function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}