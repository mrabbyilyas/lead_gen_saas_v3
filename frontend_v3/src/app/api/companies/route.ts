// API route for company data - proxy to backend API

import { NextRequest, NextResponse } from 'next/server';

// Demo data fallback
const getDemoData = () => [{
  id: 1,
  company_name: 'Commvs',
  canonical_name: 'Commvs Ltd.',
  search_query: 'Commvs',
  analysis_result: {
    "diversity_score": 4,
    "community_investment": 0
  },
  status: 'success',
  created_at: new Date('2025-06-22T05:00:13.098Z'),
  score: 4,
  industry: 'Technology',
  revenue_range: '$1M-$10M'
}];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!backendUrl) {
      console.error('Backend URL not configured, using demo data');
      return NextResponse.json({
        success: true,
        data: getDemoData().slice(0, limit),
        total: getDemoData().length,
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

    // Build query parameters
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    // Call backend companies endpoint
    const response = await fetch(`${backendUrl}/companies?${params.toString()}`, {
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
      data: data.companies || [],
      total: data.total || 0,
      source: 'backend'
    });

  } catch (error) {
    console.error('Backend connection failed, using demo data:', error instanceof Error ? error.message : error);
    
    // Filter demo data if search provided
    let companies = getDemoData();
    if (search) {
      companies = companies.filter(c => 
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.canonical_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return NextResponse.json({
      success: true,
      data: companies.slice(0, limit),
      total: companies.length,
      source: 'demo',
      note: 'Backend API unavailable - showing demo data'
    });
  }
}