import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, onValueChange, onValueCommit, ...props }, ref) => {
  // Memoize value array to prevent infinite loops
  const memoizedValue = React.useMemo(() => value || [0], [value]);
  
  // Use ref for equality checking to prevent heavy updates
  const lastValueRef = React.useRef(memoizedValue);
  
  const handleValueChange = React.useCallback((newValue: number[]) => {
    // Only call onChange if value actually changed
    if (JSON.stringify(newValue) !== JSON.stringify(lastValueRef.current)) {
      lastValueRef.current = newValue;
      onValueChange?.(newValue);
    }
  }, [onValueChange]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={memoizedValue}
      onValueChange={handleValueChange}
      onValueCommit={onValueCommit}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
