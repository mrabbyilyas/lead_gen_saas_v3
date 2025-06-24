// Direct database API route for individual company
// This provides server-side database access for company details

import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById } from '@/lib/db-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid company ID',
        source: 'direct_database'
      }, { status: 400 });
    }

    console.log(`🔍 Direct DB API: getCompanyById(${companyId})`);

    const company = await getCompanyById(companyId);

    if (!company) {
      return NextResponse.json({
        success: false,
        error: 'Company not found',
        source: 'direct_database'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: company,
      source: 'direct_database'
    });

  } catch (error) {
    console.error('❌ Direct DB API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database query failed',
      source: 'direct_database',
      fallback_suggestion: 'Try using API backend mode'
    }, { status: 500 });
  }
}