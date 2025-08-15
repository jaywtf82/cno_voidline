import * as React from "react";
import { cn } from "@/lib/utils";

export interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "terminal";
  children: React.ReactNode;
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground",
          {
            "terminal-window": variant === "terminal",
            "border-primary/30 bg-background/80 backdrop-blur-sm": variant === "default",
            "border-primary shadow-glow-sm hover:shadow-glow-md transition-shadow": variant === "glow",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeonCard.displayName = "NeonCard";

const NeonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
NeonCardHeader.displayName = "NeonCardHeader";

const NeonCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-mono text-lg font-semibold leading-none tracking-tight text-primary",
      className
    )}
    {...props}
  />
));
NeonCardTitle.displayName = "NeonCardTitle";

const NeonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
NeonCardDescription.displayName = "NeonCardDescription";

const NeonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
NeonCardContent.displayName = "NeonCardContent";

const NeonCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
NeonCardFooter.displayName = "NeonCardFooter";

export {
  NeonCard,
  NeonCardHeader,
  NeonCardTitle,
  NeonCardDescription,
  NeonCardContent,
  NeonCardFooter,
};
