const lastLogTimes = new Map<string, number>();

export const logPerformanceMetrics = (
  component: string,
  metrics: {
    filteredCount?: number;
    visibleMarkerCount?: number;
    renderedListCount?: number;
    renderLimit?: number;
    [key: string]: any;
  },
  options: { throttleMs?: number } = { throttleMs: 1000 }
) => {
  if (!import.meta.env.DEV) return;

  const now = Date.now();
  const lastTime = lastLogTimes.get(component) || 0;
  
  if (now - lastTime >= (options.throttleMs || 0)) {
    console.debug(`[Perf: ${component}]`, metrics);
    lastLogTimes.set(component, now);
  }
};
