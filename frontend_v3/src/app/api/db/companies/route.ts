// Direct database API route for companies
// This provides server-side database access for the frontend

import { NextRequest, NextResponse } from 'next/server';
import { getCompanies } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`🔍 Direct DB API: getCompanies(search="${search}", limit=${limit}, offset=${offset})`);

    const result = await getCompanies(search, limit, offset);

    return NextResponse.json({
      success: true,
      data: result.companies,
      total: result.total,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      source: 'direct_database',
      query_info: {
        search_term: search,
        limit,
        offset,
        results_count: result.companies.length
      }
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