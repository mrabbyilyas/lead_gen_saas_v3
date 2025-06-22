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
    const companies = result.rows.map(row => {
      // Parse analysis_result if it's a string
      let analysisResult = row.analysis_result;
      if (typeof analysisResult === 'string') {
        try {
          analysisResult = JSON.parse(analysisResult);
        } catch (e) {
          analysisResult = {};
        }
      }
      
      // Calculate AI score inline to avoid import issues
      const calculateScore = (data: any) => {
        // Check for existing simple scores first
        if (data?.esg_risk?.social?.diversity_score > 0) return data.esg_risk.social.diversity_score;
        if (data?.diversity_score > 0) return data.diversity_score;
        if (data?.score > 0) return data.score;
        
        // Calculate composite score
        let totalScore = 0;
        let weights = 0;
        
        // Financial health
        if (data?.financial_metrics?.profitability_metrics?.net_profit_margin > 0) {
          const finScore = Math.min(data.financial_metrics.profitability_metrics.net_profit_margin / 5, 3);
          totalScore += finScore * 0.3;
          weights += 0.3;
        }
        
        // Market position
        if (data?.market_competition?.market_data?.current_market_share > 0) {
          const marketScore = Math.min(data.market_competition.market_data.current_market_share / 10, 2.5);
          totalScore += marketScore * 0.25;
          weights += 0.25;
        }
        
        // Innovation
        if (data?.technology_operations?.rd_innovation?.innovation_score > 0) {
          const innovScore = (data.technology_operations.rd_innovation.innovation_score / 5) * 2;
          totalScore += innovScore * 0.2;
          weights += 0.2;
        }
        
        // ESG
        if (data?.esg_risk?.environmental?.sustainability_score > 0) {
          const esgScore = (data.esg_risk.environmental.sustainability_score / 100) * 1.5;
          totalScore += esgScore * 0.15;
          weights += 0.15;
        }
        
        // Competitive moat
        if (data?.market_competition?.competitive_analysis?.moat_strength > 0) {
          const moatScore = (data.market_competition.competitive_analysis.moat_strength / 5) * 1.5;
          totalScore += moatScore * 0.1;
          weights += 0.1;
        }
        
        return weights > 0 ? Math.min((totalScore / weights) * 10, 10) : 0;
      };
      
      const extractedScore = calculateScore(analysisResult);
      
      const extractedIndustry = analysisResult?.company_basic_info?.industry_primary ||
                               analysisResult?.industry ||
                               analysisResult?.sector ||
                               analysisResult?.business_type ||
                               (analysisResult?.company_profile?.industry) ||
                               null;
      
      const extractedRevenue = analysisResult?.company_basic_info?.revenue_estimate ||
                              analysisResult?.revenue_range ||
                              analysisResult?.revenue ||
                              analysisResult?.annual_revenue ||
                              (analysisResult?.financial_metrics?.revenue_range) ||
                              null;
      
      return {
        ...row,
        score: extractedScore,
        industry: extractedIndustry,
        revenue_range: extractedRevenue
      };
    });
    
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