/**
 * WaveDNAVisualizer.tsx - Orbital sphere + DNA helices + wireframe overlay
 * Phase 1 Deep Signal Deconstruction visualizer
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface WaveDNAProps {
  audioData?: {
    waveform: Float32Array;
    fftData: Float32Array;
    peak: number;
    rms: number;
  };
  theme?: 'classic' | 'terminal' | 'glass';
  isProcessing?: boolean;
}

export const WaveDNAVisualizer: React.FC<WaveDNAProps> = ({ 
  audioData, 
  theme = 'classic',
  isProcessing = false 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const frameRef = useRef<number>();
  
  // Visualization objects
  const orbitalSphereRef = useRef<THREE.Group>();
  const dnaHelixRef = useRef<THREE.Group>();
  const wireframeRef = useRef<THREE.Group>();
  
  // Animation state
  const timeRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(800, 400);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    
    // Position camera
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Create visualization elements
    createOrbitalSphere(scene);
    createDNAHelix(scene);
    createWireframe(scene);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Start animation loop
    animate();
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const createOrbitalSphere = (scene: THREE.Scene) => {
    const orbitalGroup = new THREE.Group();
    
    // Central sphere
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: getThemeColor('primary'),
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const centralSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    orbitalGroup.add(centralSphere);
    
    // Orbital rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.RingGeometry(1 + i * 0.5, 1.1 + i * 0.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: getThemeColor('accent'),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (i * Math.PI) / 6;
      orbitalGroup.add(ring);
    }
    
    // Orbiting particles
    for (let i = 0; i < 12; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: getThemeColor('secondary')
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1;
      particle.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 0.5,
        Math.sin(angle) * radius
      );
      
      orbitalGroup.add(particle);
    }
    
    orbitalSphereRef.current = orbitalGroup;
    scene.add(orbitalGroup);
  };

  const createDNAHelix = (scene: THREE.Scene) => {
    const helixGroup = new THREE.Group();
    
    // DNA strands
    const points1: THREE.Vector3[] = [];
    const points2: THREE.Vector3[] = [];
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = (t - 0.5) * 4;
      const angle1 = t * Math.PI * 4;
      const angle2 = angle1 + Math.PI;
      const radius = 0.8;
      
      points1.push(new THREE.Vector3(
        Math.cos(angle1) * radius,
        y,
        Math.sin(angle1) * radius
      ));
      
      points2.push(new THREE.Vector3(
        Math.cos(angle2) * radius,
        y,
        Math.sin(angle2) * radius
      ));
    }
    
    // Create tube geometries for DNA strands
    const curve1 = new THREE.CatmullRomCurve3(points1);
    const curve2 = new THREE.CatmullRomCurve3(points2);
    
    const tubeGeometry1 = new THREE.TubeGeometry(curve1, 100, 0.05, 8, false);
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 100, 0.05, 8, false);
    
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: getThemeColor('primary'),
      transparent: true,
      opacity: 0.9
    });
    
    const tube1 = new THREE.Mesh(tubeGeometry1, tubeMaterial);
    const tube2 = new THREE.Mesh(tubeGeometry2, tubeMaterial.clone());
    tube2.material.color.setHex(getThemeColor('accent'));
    
    helixGroup.add(tube1);
    helixGroup.add(tube2);
    
    // Cross-links between strands
    for (let i = 0; i < points1.length; i += 10) {
      const linkGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8);
      const linkMaterial = new THREE.MeshBasicMaterial({
        color: getThemeColor('secondary'),
        transparent: true,
        opacity: 0.6
      });
      const link = new THREE.Mesh(linkGeometry, linkMaterial);
      
      const midPoint = new THREE.Vector3().addVectors(points1[i], points2[i]).multiplyScalar(0.5);
      link.position.copy(midPoint);
      link.lookAt(points2[i]);
      link.rotateX(Math.PI / 2);
      
      helixGroup.add(link);
    }
    
    helixGroup.position.x = 3;
    dnaHelixRef.current = helixGroup;
    scene.add(helixGroup);
  };

  const createWireframe = (scene: THREE.Scene) => {
    const wireframeGroup = new THREE.Group();
    
    // Grid pattern
    const gridGeometry = new THREE.PlaneGeometry(6, 6, 20, 20);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: getThemeColor('grid'),
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -2;
    wireframeGroup.add(grid);
    
    // Frequency spectrum wireframe
    if (audioData?.fftData) {
      const spectrumGeometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];
      
      for (let i = 0; i < audioData.fftData.length / 4; i++) {
        const x = (i / (audioData.fftData.length / 4)) * 4 - 2;
        const y = (audioData.fftData[i] + 60) / 60 * 2; // Normalize dB to height
        const z = -3;
        
        positions.push(x, Math.max(0, y), z);
        
        // Color based on frequency content
        const hue = (i / (audioData.fftData.length / 4)) * 0.8;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
        colors.push(color.r, color.g, color.b);
      }
      
      spectrumGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      spectrumGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const spectrumMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
      
      const spectrum = new THREE.Points(spectrumGeometry, spectrumMaterial);
      wireframeGroup.add(spectrum);
    }
    
    wireframeRef.current = wireframeGroup;
    scene.add(wireframeGroup);
  };

  const getThemeColor = (type: 'primary' | 'secondary' | 'accent' | 'grid'): number => {
    const themes = {
      classic: {
        primary: 0x22c55e,
        secondary: 0x16a34a,
        accent: 0x15803d,
        grid: 0x374151
      },
      terminal: {
        primary: 0x00ff00,
        secondary: 0x00cc00,
        accent: 0x00aa00,
        grid: 0x003300
      },
      glass: {
        primary: 0x60a5fa,
        secondary: 0x3b82f6,
        accent: 0x2563eb,
        grid: 0x1e40af
      }
    };
    
    return themes[theme][type];
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    
    timeRef.current += 0.016; // ~60fps
    
    // Animate orbital sphere
    if (orbitalSphereRef.current) {
      orbitalSphereRef.current.rotation.y += 0.01;
      
      // Animate orbiting particles based on audio data
      orbitalSphereRef.current.children.forEach((child, index) => {
        if (index > 3) { // Skip central sphere and rings
          const particle = child as THREE.Mesh;
          const baseRadius = 1.5 + (index - 4) * 0.1;
          const audioInfluence = audioData?.rms ? audioData.rms * 0.5 : 0;
          const radius = baseRadius + audioInfluence;
          
          const angle = timeRef.current * 0.5 + (index * Math.PI * 2) / 12;
          particle.position.x = Math.cos(angle) * radius;
          particle.position.z = Math.sin(angle) * radius;
          particle.position.y = Math.sin(timeRef.current * 2 + index) * 0.3;
        }
      });
    }
    
    // Animate DNA helix
    if (dnaHelixRef.current) {
      dnaHelixRef.current.rotation.y += 0.005;
      
      // Pulse based on audio peak
      const scale = 1 + (audioData?.peak ? audioData.peak * 0.2 : 0);
      dnaHelixRef.current.scale.setScalar(scale);
    }
    
    // Animate wireframe
    if (wireframeRef.current && audioData?.fftData) {
      updateSpectrumWireframe();
    }
    
    // Processing indication
    if (isProcessing) {
      cameraRef.current.position.x = Math.sin(timeRef.current * 2) * 0.1;
      cameraRef.current.position.y = Math.cos(timeRef.current * 1.5) * 0.1;
    } else {
      cameraRef.current.position.x = 0;
      cameraRef.current.position.y = 0;
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameRef.current = requestAnimationFrame(animate);
  };

  const updateSpectrumWireframe = () => {
    if (!wireframeRef.current || !audioData?.fftData) return;
    
    // Find spectrum points mesh
    const spectrum = wireframeRef.current.children.find(child => child instanceof THREE.Points) as THREE.Points;
    if (!spectrum) return;
    
    const positions = spectrum.geometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < audioData.fftData.length / 4; i++) {
      const y = (audioData.fftData[i] + 60) / 60 * 2; // Normalize dB to height
      positions.setY(i, Math.max(0, y));
    }
    
    positions.needsUpdate = true;
  };

  return (
    <div className="relative w-full h-96 bg-black/20 rounded-lg overflow-hidden border border-gray-700">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />
      
      {/* Overlay indicators */}
      <div className="absolute top-4 left-4 text-xs font-mono text-green-400">
        <div>WaveDNA Analysis</div>
        <div className="text-gray-400">
          {isProcessing ? 'Processing...' : 'Real-time'}
        </div>
      </div>
      
      {/* Blueprint labels */}
      <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-500 space-y-1">
        <div>Orbital: Signal Structure</div>
        <div>Helix: Harmonic Content</div>
        <div>Grid: Frequency Response</div>
      </div>
      
      {/* Scanlines overlay for terminal theme */}
      {theme === 'terminal' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)'
          }}
        />
      )}
    </div>
  );
};