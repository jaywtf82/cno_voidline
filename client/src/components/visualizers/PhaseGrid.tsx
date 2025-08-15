import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface PhaseGridProps {
  correlation?: number;
  isActive?: boolean;
  className?: string;
}

export function PhaseGrid({
  correlation = 0.94,
  isActive = false,
  className = "",
}: PhaseGridProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  const themeColors = {
    classic: "#3FB950",
    matrix: "#00FF41",
    cyberpunk: "#00D4FF", 
    retro: "#FF8C42",
  };

  const primaryColor = themeColors[theme];

  // Generate network nodes based on correlation
  const generateNodes = () => {
    const nodes = [
      { x: 20, y: 20, id: "node1" },
      { x: 50, y: 30, id: "node2" },
      { x: 80, y: 25, id: "node3" },
      { x: 75, y: 60, id: "node4" },
      { x: 40, y: 70, id: "node5" },
      { x: 20, y: 50, id: "node6" },
    ];
    return nodes;
  };

  const nodes = generateNodes();

  // Generate connections between nodes
  const connections = [
    { from: nodes[0], to: nodes[1] },
    { from: nodes[1], to: nodes[2] },
    { from: nodes[2], to: nodes[3] },
    { from: nodes[3], to: nodes[4] },
    { from: nodes[4], to: nodes[5] },
    { from: nodes[5], to: nodes[0] },
    { from: nodes[1], to: nodes[4] }, // Cross connections
    { from: nodes[0], to: nodes[3] },
  ];

  const gridOpacity = Math.max(0.1, correlation);
  const connectionOpacity = correlation;

  return (
    <div className={`text-center ${className}`}>
      <h3 className="font-mono text-accent-primary mb-4 text-sm">PHASE LOCK GRID</h3>

      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-full h-full"
          data-testid="svg-phase-grid"
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke={`${primaryColor}${Math.floor(gridOpacity * 255).toString(16).padStart(2, '0')}`}
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Network Connections */}
          {connections.map((connection, index) => (
            <line
              key={index}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={primaryColor}
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity={connectionOpacity}
              className={isActive ? "animate-phase-connect" : ""}
              data-testid={`connection-${index}`}
            />
          ))}

          {/* Network Nodes */}
          {nodes.map((node, index) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r="2"
              fill={primaryColor}
              opacity={0.8 + correlation * 0.2}
              data-testid={`node-${index}`}
            >
              {isActive && (
                <animate
                  attributeName="r"
                  values="2;3;2"
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${index * 0.3}s`}
                />
              )}
            </circle>
          ))}
        </svg>
      </div>

      <div className="text-center">
        <div 
          className="text-2xl font-mono text-accent-primary mb-1"
          data-testid="text-correlation-value"
        >
          {correlation.toFixed(2)}
        </div>
        <div className="text-xs font-mono text-text-muted">
          Correlation Coefficient
        </div>
      </div>
    </div>
  );
}
