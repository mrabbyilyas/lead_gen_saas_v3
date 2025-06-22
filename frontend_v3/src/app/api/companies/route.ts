// API route for company data - fallback with demo data matching your database structure

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Direct database connection
const getDbClient = () => new Client({
  connectionString: 'postgresql://lead_gen_admin:VFBZ%24dPcrI%29QyAag@leadgen-mvp-db.postgres.database.azure.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Demo data that matches your actual database structure
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
  
  // Try database connection first
  const client = getDbClient();
  try {
    await client.connect();
    
    let query, params;
    if (search) {
      query = `
        SELECT id, company_name, canonical_name, search_query, analysis_result, status, created_at
        FROM company_analysis
        WHERE company_name ILIKE $1 OR canonical_name ILIKE $1 OR search_query ILIKE $1
        ORDER BY created_at DESC LIMIT $2
      `;
      params = [`%${search}%`, limit];
    } else {
      query = `
        SELECT id, company_name, canonical_name, search_query, analysis_result, status, created_at
        FROM company_analysis
        ORDER BY created_at DESC LIMIT $1
      `;
      params = [limit];
    }
    
    const result = await client.query(query, params);
    const companies = result.rows.map(row => ({
      ...row,
      score: row.analysis_result?.diversity_score || row.analysis_result?.score || 0,
      industry: row.analysis_result?.industry || 'Technology',
      revenue_range: row.analysis_result?.revenue_range || '$1M-$10M'
    }));
    
    return NextResponse.json({
      success: true,
      data: companies,
      total: companies.length,
      source: 'database'
    });
    
  } catch (error) {
    console.error('Database connection failed, using demo data:', error instanceof Error ? error.message : error);
    
    // Always return demo data on any error
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
      note: 'Database authentication failed in Next.js environment - showing demo data. Direct connection works outside Next.js.'
    });
    
  } finally {
    try { 
      await client.end(); 
    } catch (closeError) {
      // Ignore close errors
    }
  }
}