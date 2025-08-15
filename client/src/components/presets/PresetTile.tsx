import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NeonCard } from "@/components/ui/neon-card";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import type { Preset } from "@shared/schema";

interface PresetTileProps {
  preset: Preset;
  onApply: (preset: Preset) => void;
  onEdit?: (preset: Preset) => void;
  onDelete?: (preset: Preset) => void;
  isActive?: boolean;
  className?: string;
}

export function PresetTile({
  preset,
  onApply,
  onEdit,
  onDelete,
  isActive = false,
  className,
}: PresetTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  const themeColors = {
    classic: { bg: "from-accent-primary/30 to-accent-primary/10", border: "border-accent-primary/50" },
    matrix: { bg: "from-green-500/30 to-green-500/10", border: "border-green-500/50" },
    cyberpunk: { bg: "from-blue-500/30 to-blue-500/10", border: "border-blue-500/50" },
    retro: { bg: "from-orange-500/30 to-orange-500/10", border: "border-orange-500/50" },
  };

  const colors = themeColors[theme];

  const getPresetIcon = (codeName: string) => {
    const icons: Record<string, string> = {
      BERLIN_CONCRETE: "🏭",
      SUB_ABYSS: "🌊", 
      DOME_SHIFT: "🏛️",
      VOCAL_LIFT: "🎤",
      BASS_HEAVY: "🔊",
      CRYSTAL_HIGH: "💎",
    };
    return icons[codeName] || "⚡";
  };

  const getPresetDescription = () => {
    if (preset.description) return preset.description;
    
    const descriptions: Record<string, string> = {
      BERLIN_CONCRETE: "Industrial strength with precise dynamics",
      SUB_ABYSS: "Deep underwater resonance",
      DOME_SHIFT: "Atmospheric space modulation",
    };
    
    return descriptions[preset.codeName || ""] || "Custom audio enhancement preset";
  };

  const getPresetFeatures = () => {
    const params = preset.parameters as any;
    const features = [];
    
    if (params?.compression?.ratio > 2) features.push("Tight compression");
    if (params?.eq?.lowShelf?.gain > 0) features.push("Enhanced low-end");
    if (params?.eq?.highShelf?.gain > 0) features.push("Lifted highs");
    if (params?.stereo?.width > 1.2) features.push("Wide stereo field");
    if (params?.harmonicBoost > 0) features.push("Harmonic enhancement");
    
    return features.length > 0 ? features : ["Custom processing", "Balanced dynamics", "Enhanced clarity"];
  };

  return (
    <NeonCard
      variant={isActive ? "glow" : "default"}
      className={cn(
        "cursor-pointer transition-all duration-300 group",
        isHovered && "shadow-glow-md",
        isActive && "border-accent-primary",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onApply(preset)}
      data-testid={`preset-tile-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="p-6 text-center">
        {/* Preset Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center text-2xl transition-all duration-300",
            `bg-gradient-to-br ${colors.bg} border ${colors.border}`,
            isHovered && "shadow-glow-sm scale-105"
          )}
          data-testid={`preset-icon-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {getPresetIcon(preset.codeName || "")}
        </div>

        {/* Preset Name */}
        <h3 className="font-mono text-lg text-accent-primary mb-2">
          {preset.codeName || preset.name.toUpperCase()}
        </h3>

        {/* Preset Description */}
        <p className="text-text-secondary text-sm mb-4">
          {getPresetDescription()}
        </p>

        {/* Preset Features */}
        <div className="space-y-2 text-xs font-mono text-text-muted mb-4">
          {getPresetFeatures().slice(0, 3).map((feature, index) => (
            <div key={index} data-testid={`preset-feature-${index}`}>
              • {feature}
            </div>
          ))}
        </div>

        {/* Preset Badges */}
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {preset.isBuiltIn && (
            <Badge variant="secondary" className="text-xs">
              Built-in
            </Badge>
          )}
          {preset.isPublic && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
          {preset.category && (
            <Badge variant="outline" className="text-xs">
              {preset.category}
            </Badge>
          )}
          {preset.usageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              Used {preset.usageCount}x
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            className="font-mono text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onApply(preset);
            }}
            data-testid={`button-apply-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            APPLY
          </Button>
          
          {onEdit && !preset.isBuiltIn && (
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(preset);
              }}
              data-testid={`button-edit-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              EDIT
            </Button>
          )}
          
          {onDelete && !preset.isBuiltIn && (
            <Button
              variant="destructive"
              size="sm"
              className="font-mono text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset);
              }}
              data-testid={`button-delete-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              DELETE
            </Button>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
