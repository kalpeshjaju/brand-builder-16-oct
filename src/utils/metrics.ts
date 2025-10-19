/**
 * FILE PURPOSE: Metrics registry for tracking application performance and usage
 *
 * CONTEXT: Provides centralized metrics collection for monitoring LLM calls,
 * agent execution times, API usage, and system health across the application
 *
 * DEPENDENCIES:
 * - None (zero external dependencies for core metrics)
 *
 * AUTHOR: Claude Code (for Codex review)
 * LAST UPDATED: 2025-10-20
 */

/**
 * Metric data structure
 *
 * WHY: Track key performance indicators for monitoring and debugging
 * HOW: Simple counter/gauge/histogram structure with timestamps
 */
export interface Metric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram';
  timestamp: Date;
  labels?: Record<string, string>;
}

/**
 * Metrics Registry - Singleton pattern for application-wide metrics
 *
 * WHY: Central place to collect and query metrics without external dependencies
 * HOW: In-memory storage with simple aggregation functions
 *
 * EXAMPLE:
 * ```typescript
 * metricsRegistry.increment('llm.calls.total', { provider: 'anthropic' });
 * metricsRegistry.gauge('agent.execution.duration', 1500, { agent: 'research' });
 * const stats = metricsRegistry.getStats();
 * ```
 *
 * EDGE CASES:
 * - Memory: Metrics stored in-memory (cleared on restart)
 * - Concurrency: Not thread-safe (single-threaded Node.js OK)
 * - Overflow: No automatic pruning (keep last 1000 per metric)
 *
 * PERFORMANCE: O(1) increment/gauge, O(n) for stats aggregation
 */
class MetricsRegistry {
  private metrics: Map<string, Metric[]> = new Map();
  private readonly MAX_METRICS_PER_NAME = 1000;

  /**
   * Increment a counter metric
   *
   * WHY: Track counts (API calls, errors, requests)
   * HOW: Adds 1 to counter, creates if doesn't exist
   *
   * @param name - Metric name (e.g., 'llm.calls.total')
   * @param labels - Optional labels for filtering (e.g., { provider: 'anthropic' })
   */
  increment(name: string, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      value: 1,
      type: 'counter',
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * Set a gauge metric (point-in-time value)
   *
   * WHY: Track current values (memory usage, queue size)
   * HOW: Records absolute value at current time
   *
   * @param name - Metric name (e.g., 'memory.usage.mb')
   * @param value - Current value
   * @param labels - Optional labels
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'gauge',
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * Record a histogram value (durations, sizes)
   *
   * WHY: Track distributions (response times, payload sizes)
   * HOW: Records individual values for later aggregation
   *
   * @param name - Metric name (e.g., 'llm.response.duration.ms')
   * @param value - Measured value
   * @param labels - Optional labels
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'histogram',
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * Get aggregated statistics for a metric
   *
   * WHY: Query metrics for monitoring dashboards or logs
   * HOW: Calculates count, sum, avg, min, max from stored values
   *
   * @param name - Metric name to query
   * @returns Aggregated stats or null if metric doesn't exist
   */
  getStats(name: string): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Get all metrics (for debugging or export)
   *
   * WHY: Export metrics to external monitoring systems
   * HOW: Returns all recorded metrics grouped by name
   *
   * @returns Map of metric names to their recorded values
   */
  getAllMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   *
   * WHY: Reset metrics between test runs or on schedule
   * HOW: Clears in-memory storage
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Record a metric (internal helper)
   *
   * WHY: Centralize metric recording logic
   * HOW: Stores metric with automatic pruning if over limit
   */
  private recordMetric(metric: Metric): void {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);

    // PERFORMANCE: Prune old metrics to prevent memory leak
    if (existing.length > this.MAX_METRICS_PER_NAME) {
      existing.shift(); // Remove oldest
    }

    this.metrics.set(metric.name, existing);
  }
}

// Singleton instance
export const metricsRegistry = new MetricsRegistry();
