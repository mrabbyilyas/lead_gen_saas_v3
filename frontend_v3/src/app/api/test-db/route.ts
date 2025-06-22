// Test database connection API route

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection first
    console.log('Step 1: Testing basic connection');
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      console.error('Database connection test failed');
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: 'Could not establish connection to Azure PostgreSQL'
      }, { status: 500 });
    }

    console.log('Step 2: Testing database queries');
    // Try to get a count of companies
    try {
      const stats = await db.getDatabaseStats();
      
      return NextResponse.json({
        success: true,
        message: 'Database connection and queries successful',
        data: {
          connection: 'OK',
          total_companies: stats.total_companies,
          high_score_leads: stats.high_score_leads,
          average_score: stats.average_score,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (queryError) {
      console.error('Database query error:', queryError);
      
      return NextResponse.json({
        success: false,
        error: 'Database queries failed',
        message: queryError instanceof Error ? queryError.message : 'Unknown query error',
        details: 'Connection successful but queries failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed at connection level'
    }, { status: 500 });
  }
}