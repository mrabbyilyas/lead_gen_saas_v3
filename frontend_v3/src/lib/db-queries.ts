// Direct database queries to replace API calls
// This provides better performance and reduces API overhead

import { db, type CompanyAnalysis, type DatabaseStats } from './database';
import { calculateAIScore, type AIScoreBreakdown } from './ai-score';

// Enhanced company interface with AI scores
export interface EnhancedCompanyAnalysis extends CompanyAnalysis {
  ai_score_breakdown: AIScoreBreakdown;
  formatted_ai_score: string;
}

// Search results interface
export interface CompanySearchResults {
  companies: EnhancedCompanyAnalysis[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Dashboard statistics interface
export interface DashboardStats extends DatabaseStats {
  industry_breakdown: Array<{ industry: string; count: number; percentage: number }>;
  score_distribution: Array<{ range: string; count: number; percentage: number }>;
  recent_companies: EnhancedCompanyAnalysis[];
}

/**
 * Get companies with search functionality
 * Replaces: /api/companies endpoint
 */
export async function getCompanies(
  searchTerm?: string,
  limit: number = 50,
  offset: number = 0
): Promise<CompanySearchResults> {
  try {
    console.log(`🔍 Direct DB query: getCompanies(search="${searchTerm}", limit=${limit}, offset=${offset})`);
    
    let companies: CompanyAnalysis[];
    
    if (searchTerm && searchTerm.trim()) {
      // Use fuzzy search for better matching
      companies = await db.searchCompaniesByName(searchTerm.trim(), limit + 1);
    } else {
      // Get all companies with pagination
      companies = await db.getCompanyAnalyses(limit + 1, offset);
    }
    
    // Check if there are more results
    const hasMore = companies.length > limit;
    if (hasMore) {
      companies = companies.slice(0, limit); // Remove extra record
    }
    
    // Enhance companies with AI scores
    const enhancedCompanies: EnhancedCompanyAnalysis[] = companies.map(company => {
      const ai_score_breakdown = calculateAIScore(company.analysis_result);
      return {
        ...company,
        ai_score_breakdown,
        formatted_ai_score: ai_score_breakdown.total > 0 ? `${ai_score_breakdown.total.toFixed(1)}/10` : 'N/A'
      };
    });
    
    // For search queries, we don't need to count total (for performance)
    const total = searchTerm ? enhancedCompanies.length : await getTotalCompanyCount();
    
    console.log(`✅ Found ${enhancedCompanies.length} companies (hasMore: ${hasMore})`);
    
    return {
      companies: enhancedCompanies,
      total,
      hasMore,
      nextCursor: hasMore ? String(companies[companies.length - 1]?.id) : undefined
    };
    
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    throw new Error(`Failed to fetch companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get company by ID with AI score calculation
 * Replaces: /api/companies/[id] endpoint
 */
export async function getCompanyById(id: number): Promise<EnhancedCompanyAnalysis | null> {
  try {
    console.log(`🔍 Direct DB query: getCompanyById(${id})`);
    
    const company = await db.getCompanyById(id);
    
    if (!company) {
      console.log(`❌ Company with ID ${id} not found`);
      return null;
    }
    
    // Calculate AI score
    const ai_score_breakdown = calculateAIScore(company.analysis_result);
    
    const enhancedCompany: EnhancedCompanyAnalysis = {
      ...company,
      ai_score_breakdown,
      formatted_ai_score: ai_score_breakdown.total > 0 ? `${ai_score_breakdown.total.toFixed(1)}/10` : 'N/A'
    };
    
    console.log(`✅ Found company: ${company.company_name} (AI Score: ${enhancedCompany.formatted_ai_score})`);
    
    return enhancedCompany;
    
  } catch (error) {
    console.error(`❌ Error fetching company ${id}:`, error);
    throw new Error(`Failed to fetch company: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get dashboard statistics with enhanced analytics
 * Replaces: /api/stats endpoint
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log('🔍 Direct DB query: getDashboardStats()');
    
    // Get basic stats
    const basicStats = await db.getDatabaseStats();
    
    // Get recent companies (last 10)
    const recentCompaniesData = await db.getCompanyAnalyses(10, 0);
    const recent_companies: EnhancedCompanyAnalysis[] = recentCompaniesData.map(company => {
      const ai_score_breakdown = calculateAIScore(company.analysis_result);
      return {
        ...company,
        ai_score_breakdown,
        formatted_ai_score: ai_score_breakdown.total > 0 ? `${ai_score_breakdown.total.toFixed(1)}/10` : 'N/A'
      };
    });
    
    // Get industry breakdown
    const industry_breakdown = await getIndustryBreakdown();
    
    // Get score distribution
    const score_distribution = await getScoreDistribution();
    
    const dashboardStats: DashboardStats = {
      ...basicStats,
      industry_breakdown,
      score_distribution,
      recent_companies
    };
    
    console.log(`✅ Dashboard stats: ${basicStats.total_companies} companies, ${industry_breakdown.length} industries`);
    
    return dashboardStats;
    
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    throw new Error(`Failed to fetch dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a company exists in the database (for async search logic)
 * Replaces the database check in async search hook
 */
export async function checkCompanyExists(companyName: string): Promise<EnhancedCompanyAnalysis | null> {
  try {
    console.log(`🔍 Direct DB query: checkCompanyExists("${companyName}")`);
    
    const companies = await db.searchCompaniesByName(companyName, 1);
    
    if (companies.length === 0) {
      console.log(`❌ Company "${companyName}" not found in database`);
      return null;
    }
    
    const company = companies[0];
    const ai_score_breakdown = calculateAIScore(company.analysis_result);
    
    const enhancedCompany: EnhancedCompanyAnalysis = {
      ...company,
      ai_score_breakdown,
      formatted_ai_score: ai_score_breakdown.total > 0 ? `${ai_score_breakdown.total.toFixed(1)}/10` : 'N/A'
    };
    
    console.log(`✅ Found existing company: ${company.company_name} (AI Score: ${enhancedCompany.formatted_ai_score})`);
    
    return enhancedCompany;
    
  } catch (error) {
    console.error(`❌ Error checking company existence for "${companyName}":`, error);
    // Return null instead of throwing to allow fallback to async search
    return null;
  }
}

/**
 * Get companies by industry filter
 */
export async function getCompaniesByIndustry(
  industry: string,
  limit: number = 20
): Promise<EnhancedCompanyAnalysis[]> {
  try {
    console.log(`🔍 Direct DB query: getCompaniesByIndustry("${industry}", ${limit})`);
    
    // This would require a more complex query based on the JSON structure
    // For now, we'll get all companies and filter by industry
    const allCompanies = await db.getCompanyAnalyses(100, 0);
    
    const filteredCompanies = allCompanies
      .filter(company => {
        const extractedIndustry = extractIndustryFromAnalysis(company.analysis_result);
        return extractedIndustry?.toLowerCase().includes(industry.toLowerCase());
      })
      .slice(0, limit);
    
    const enhancedCompanies: EnhancedCompanyAnalysis[] = filteredCompanies.map(company => {
      const ai_score_breakdown = calculateAIScore(company.analysis_result);
      return {
        ...company,
        ai_score_breakdown,
        formatted_ai_score: ai_score_breakdown.total > 0 ? `${ai_score_breakdown.total.toFixed(1)}/10` : 'N/A'
      };
    });
    
    console.log(`✅ Found ${enhancedCompanies.length} companies in industry: ${industry}`);
    
    return enhancedCompanies;
    
  } catch (error) {
    console.error(`❌ Error fetching companies by industry "${industry}":`, error);
    throw new Error(`Failed to fetch companies by industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions

async function getTotalCompanyCount(): Promise<number> {
  try {
    const stats = await db.getDatabaseStats();
    return stats.total_companies;
  } catch (error) {
    console.warn('Failed to get total company count:', error);
    return 0;
  }
}

async function getIndustryBreakdown(): Promise<Array<{ industry: string; count: number; percentage: number }>> {
  try {
    // This is a simplified version - in a real implementation, we'd use a proper JSONB query
    const companies = await db.getCompanyAnalyses(1000, 0); // Get more companies for accurate breakdown
    const industryMap = new Map<string, number>();
    
    companies.forEach(company => {
      const industry = extractIndustryFromAnalysis(company.analysis_result) || 'Unknown';
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    });
    
    const total = companies.length;
    const breakdown = Array.from(industryMap.entries())
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 industries
    
    return breakdown;
  } catch (error) {
    console.warn('Failed to get industry breakdown:', error);
    return [];
  }
}

async function getScoreDistribution(): Promise<Array<{ range: string; count: number; percentage: number }>> {
  try {
    const companies = await db.getCompanyAnalyses(1000, 0);
    const ranges = {
      '9-10': 0,
      '8-9': 0,
      '7-8': 0,
      '6-7': 0,
      '5-6': 0,
      '4-5': 0,
      '3-4': 0,
      '2-3': 0,
      '1-2': 0,
      '0-1': 0,
      'No Score': 0
    };
    
    companies.forEach(company => {
      const scoreBreakdown = calculateAIScore(company.analysis_result);
      const score = scoreBreakdown.total;
      
      if (score === 0 || !scoreBreakdown.hasData) {
        ranges['No Score']++;
      } else if (score >= 9) ranges['9-10']++;
      else if (score >= 8) ranges['8-9']++;
      else if (score >= 7) ranges['7-8']++;
      else if (score >= 6) ranges['6-7']++;
      else if (score >= 5) ranges['5-6']++;
      else if (score >= 4) ranges['4-5']++;
      else if (score >= 3) ranges['3-4']++;
      else if (score >= 2) ranges['2-3']++;
      else if (score >= 1) ranges['1-2']++;
      else ranges['0-1']++;
    });
    
    const total = companies.length;
    return Object.entries(ranges)
      .map(([range, count]) => ({
        range,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .filter(item => item.count > 0);
      
  } catch (error) {
    console.warn('Failed to get score distribution:', error);
    return [];
  }
}

function extractIndustryFromAnalysis(analysisResult: any): string | null {
  if (!analysisResult) return null;
  
  try {
    // Check common industry field patterns in the JSONB data
    return analysisResult?.company_basic_info?.industry_primary ||
           analysisResult?.company_basic_info?.industry ||
           analysisResult?.industry ||
           analysisResult?.sector ||
           analysisResult?.business_sector ||
           analysisResult?.primary_industry ||
           null;
  } catch (error) {
    return null;
  }
}

// Database connection health check for components
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const result = await db.testConnection();
    return result;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}