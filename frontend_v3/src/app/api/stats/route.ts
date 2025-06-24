// API route for dashboard statistics - proxy to backend API

import { NextRequest, NextResponse } from 'next/server';

// Demo stats fallback
const getDemoStats = () => ({
  total_companies: 1,
  high_score_leads: 1,
  average_score: 4.0,
  success_rate: 100,
  recent_analyses_count: 1
});

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!backendUrl) {
      console.error('Backend URL not configured, using demo stats');
      return NextResponse.json({
        success: true,
        data: getDemoStats(),
        source: 'demo',
        note: 'Backend URL not configured'
      });
    }

    // Get auth token
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || 'rabby_lead_gen_mvp_test';
    const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET || 'egqCnbS%!IsPY)Qk8nWJkSEE';
    
    let authToken = '';
    try {
      const authResponse = await fetch(`${backendUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        authToken = authData.access_token;
      }
    } catch (authError) {
      console.warn('Failed to get auth token:', authError);
    }

    if (!authToken) {
      throw new Error('Failed to authenticate with backend');
    }

    // Call backend stats endpoint
    const response = await fetch(`${backendUrl}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'backend'
    });

  } catch (error) {
    console.error('Backend connection failed, using demo stats:', error instanceof Error ? error.message : error);
    
    return NextResponse.json({
      success: true,
      data: getDemoStats(),
      source: 'demo',
      note: 'Backend API unavailable - showing demo data'
    });
  }
}