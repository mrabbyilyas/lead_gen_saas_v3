// API route for individual company data - proxy to backend API

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    
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

    // Call backend companies/{id} endpoint
    const response = await fetch(`${backendUrl}/companies/${companyId}`, {
      method: 'GET',
      headers: {
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
    console.error(`API Error - /api/companies/${params.id}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch company data',
      message: error instanceof Error ? error.message : 'Backend API unavailable'
    }, { status: 500 });
  }
}