// API route for individual company data

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

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

    const company = await db.getCompanyById(companyId);

    if (!company) {
      return NextResponse.json({
        success: false,
        error: 'Company not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error(`API Error - /api/companies/${params.id}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch company data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}