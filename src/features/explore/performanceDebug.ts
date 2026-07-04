export const logPerformanceMetrics = (
  component: string,
  metrics: {
    filteredCount?: number;
    visibleMarkerCount?: number;
    renderedListCount?: number;
    renderLimit?: number;
    [key: string]: any;
  }
) => {
  if (import.meta.env.DEV) {
    console.debug(`[Perf: ${component}]`, metrics);
  }
};
