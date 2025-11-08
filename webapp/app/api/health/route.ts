import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-helpers';

/**
 * Health Check Endpoint
 *
 * Used by:
 * - Load balancers to determine instance health
 * - Docker health checks
 * - Monitoring systems (Datadog, New Relic, etc.)
 * - CI/CD pipelines for deployment verification
 *
 * Returns:
 * - 200 OK: Service is healthy and ready to serve traffic
 * - 503 Service Unavailable: Service is unhealthy (dependencies down)
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    server: boolean;
    memory: boolean;
    // Add more checks as needed
    // database?: boolean;
    // redis?: boolean;
    // externalAPIs?: boolean;
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Basic health checks
    const checks = {
      server: true,
      memory: checkMemoryUsage(),
      // Add more health checks here:
      // database: await checkDatabase(),
      // redis: await checkRedis(),
      // anthropic: await checkAnthropicAPI(),
    };

    // Determine overall health
    const allHealthy = Object.values(checks).every(check => check === true);

    const healthStatus: HealthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...healthStatus,
        responseTime: `${responseTime}ms`,
      },
      {
        status: allHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        }
      }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/health',
      method: 'GET'
    });
  }
}

/**
 * Check if memory usage is within acceptable limits
 * Returns false if memory usage > 90%
 */
function checkMemoryUsage(): boolean {
  try {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    return heapUsedPercent < 90;
  } catch (error) {
    console.error('Memory check failed:', error);
    return false;
  }
}

/**
 * Example: Check database connectivity
 * Uncomment and implement when database is added
 */
// async function checkDatabase(): Promise<boolean> {
//   try {
//     // Example: await db.query('SELECT 1');
//     return true;
//   } catch (error) {
//     console.error('Database health check failed:', error);
//     return false;
//   }
// }

/**
 * Example: Check Redis connectivity
 * Uncomment and implement when Redis is added
 */
// async function checkRedis(): Promise<boolean> {
//   try {
//     // Example: await redis.ping();
//     return true;
//   } catch (error) {
//     console.error('Redis health check failed:', error);
//     return false;
//   }
// }
