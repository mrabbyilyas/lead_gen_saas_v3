// Direct database health check API route
// This provides server-side database health monitoring

import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection, checkDatabaseHealth, validateEnvironmentConfig } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Direct DB API: health check');

    // Check environment configuration
    const envConfig = validateEnvironmentConfig();
    
    // Test basic connection
    const connectionTest = await testDatabaseConnection();
    
    // Check pool health
    const poolHealth = await checkDatabaseHealth();

    const isHealthy = envConfig.isValid && connectionTest.success && poolHealth.isHealthy;

    return NextResponse.json({
      success: true,
      data: {
        isHealthy,
        environment: envConfig,
        connection: connectionTest,
        pool: poolHealth,
        timestamp: new Date().toISOString()
      },
      source: 'direct_database'
    });

  } catch (error) {
    console.error('❌ Direct DB API health check error:', error);
    
    return NextResponse.json({
      success: false,
      data: {
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      },
      source: 'direct_database'
    }, { status: 500 });
  }
}