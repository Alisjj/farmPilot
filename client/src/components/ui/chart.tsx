import * as React from "react";
import { cn } from "@/lib/utils";

// Chart container component
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, any>;
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex aspect-video justify-center text-xs", className)}
      {...props}
    >
      <div className="w-full">{children}</div>
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

// Chart tooltip component
const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    />
  );
});
ChartTooltip.displayName = "ChartTooltip";

// Chart tooltip content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      className,
      children,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      nameKey = "name",
      labelKey = "label",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-2 rounded-lg border bg-background p-2 shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// Chart legend component
const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  );
});
ChartLegend.displayName = "ChartLegend";

// Chart legend content
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hideIcon?: boolean;
    payload?: Array<any>;
    verticalAlign?: "top" | "bottom";
    nameKey?: string;
  }
>(
  (
    {
      className,
      hideIcon = false,
      payload,
      verticalAlign = "bottom",
      nameKey = "name",
      ...props
    },
    ref
  ) => {
    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-4",
          verticalAlign === "top" && "pb-3",
          className
        )}
        {...props}
      >
        {payload.map((item, index) => {
          const indicatorColor = item.color;

          return (
            <div key={index} className="flex items-center gap-1.5 text-sm">
              {!hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: indicatorColor }}
                />
              )}
              <span className="text-muted-foreground">
                {item[nameKey]}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

// Simple placeholder chart component for demonstrations
const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "line" | "bar" | "area" | "pie";
    data?: Array<any>;
    config?: Record<string, any>;
  }
>(({ className, type = "line", data, config, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center",
        className
      )}
      {...props}
    >
      {children || (
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
          </p>
          <p className="text-slate-400 text-xs">Data visualization component</p>
        </div>
      )}
    </div>
  );
});
Chart.displayName = "Chart";

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
