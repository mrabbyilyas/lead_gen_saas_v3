// Test backend connection API route (proxy to backend health endpoint)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Testing backend connection...');
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!backendUrl) {
      return NextResponse.json({
        success: false,
        error: 'Backend URL not configured',
        details: 'NEXT_PUBLIC_API_BASE_URL environment variable is missing'
      }, { status: 500 });
    }

    // Call backend health endpoint
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Backend health check failed',
        details: `Backend returned status ${response.status}`,
        backend_url: backendUrl
      }, { status: 500 });
    }

    const healthData = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Backend connection successful',
      data: {
        backend_status: 'OK',
        backend_url: backendUrl,
        health_data: healthData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Backend connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Backend connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to connect to backend API'
    }, { status: 500 });
  }
}