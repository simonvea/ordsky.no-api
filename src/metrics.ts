import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Create a Registry
export const register = new Registry();

// Collect default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register,
  prefix: 'ordsky_api_',
});

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'ordsky_api_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'ordsky_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const websocketConnections = new Counter({
  name: 'ordsky_api_websocket_connections_total',
  help: 'Total number of WebSocket connections',
  labelNames: ['event'],
  registers: [register],
});

export const databaseOperations = new Counter({
  name: 'ordsky_api_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table'],
  registers: [register],
});

export const wordCloudsCreated = new Counter({
  name: 'ordsky_api_word_clouds_created_total',
  help: 'Total number of word clouds created',
  labelNames: ['feature'],  // 'collaborative' or 'collect'
  registers: [register],
});

// Middleware to track HTTP request metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
}
