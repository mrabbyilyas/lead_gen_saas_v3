// Direct database API route for dashboard statistics
// This provides server-side database access for stats

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Direct DB API: getDashboardStats()');

    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
      source: 'direct_database',
      statistics_info: {
        total_companies: stats.total_companies,
        high_score_leads: stats.high_score_leads,
        average_score: stats.average_score,
        success_rate: stats.success_rate,
        recent_analyses: stats.recent_analyses_count,
        industries_tracked: stats.industry_breakdown.length,
        score_ranges: stats.score_distribution.length,
        recent_companies_loaded: stats.recent_companies.length
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