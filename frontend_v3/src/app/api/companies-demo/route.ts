// Demo API route to ensure dashboard works while troubleshooting database

import { NextRequest, NextResponse } from 'next/server';

// Demo data that matches your actual database structure
const getDemoData = () => [
  {
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
  },
  {
    id: 2,
    company_name: 'TechCorp',
    canonical_name: 'TechCorp Inc.',
    search_query: 'TechCorp',
    analysis_result: {
      "diversity_score": 3,
      "community_investment": 1
    },
    status: 'success',
    created_at: new Date('2025-06-21T15:30:00.000Z'),
    score: 3,
    industry: 'Software',
    revenue_range: '$10M-$50M'
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20');
  
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
    note: 'Demo data - database connection works outside Next.js but fails in API routes'
  });
}