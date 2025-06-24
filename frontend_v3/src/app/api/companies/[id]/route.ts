// API route for individual company data - proxy to backend API

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid company ID'
      }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!backendUrl) {
      return NextResponse.json({
        success: false,
        error: 'Backend URL not configured'
      }, { status: 500 });
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

    // Call backend companies/{id} endpoint
    const response = await fetch(`${backendUrl}/companies/${companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Company not found'
        }, { status: 404 });
      }
      
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.company || data.data || data
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`API Error - /api/companies/${resolvedParams.id}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch company data',
      message: error instanceof Error ? error.message : 'Backend API unavailable'
    }, { status: 500 });
  }
}