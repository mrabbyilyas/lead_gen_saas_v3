// Direct PostgreSQL connection for Next.js frontend
// This replaces API calls with direct database queries for better performance

import { Pool, PoolClient, QueryResult, Client } from 'pg';

// Environment variable validation with special character password support
const validateDatabaseConfig = () => {
  const required = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'DATABASE_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing database environment variables: ${missing.join(', ')}. Using fallback values.`);
  }
  
  // Get password as-is (no encoding needed for connection object format)
  const password = process.env.DATABASE_PASSWORD || '';
  
  // Debug password handling for special characters
  console.log(`🔐 Password validation:`);
  console.log(`  Length: ${password.length} characters (expected: 16)`);
  console.log(`  Contains $: ${password.includes('$')}`);
  console.log(`  Contains ): ${password.includes(')')}`);
  console.log(`  First char: ${password[0] || 'none'}`);
  console.log(`  Last char: ${password[password.length - 1] || 'none'}`);
  
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'postgres',
    user: process.env.DATABASE_USER || 'postgres',
    password: password, // Raw password - connection object handles special chars
    ssl: {
      rejectUnauthorized: false, // Azure PostgreSQL requires this
    },
    // Connection pool settings optimized for Azure
    max: 20, // Maximum number of clients
    min: 2,  // Minimum number of clients
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    acquireTimeoutMillis: 10000, // 10 seconds
  };
};

// Database configuration will be validated fresh each time to handle environment changes

// Company Analysis Interface (matching actual database schema)
export interface CompanyAnalysis {
  id: number;
  company_name: string;
  canonical_name?: string | null;
  search_query?: string | null;
  analysis_result: any; // JSONB object
  status?: string | null;
  created_at: Date;
  // Computed fields from analysis_result
  score?: number;
  industry?: string;
  revenue_range?: string;
}

// Database stats interface
export interface DatabaseStats {
  total_companies: number;
  high_score_leads: number;
  average_score: number;
  success_rate: number;
  recent_analyses_count: number;
}

// Async Job interface (matching async_jobs table schema)
export interface AsyncJob {
  job_id: string;
  company_name: string;
  status: string; // 'pending', 'processing', 'completed', 'failed'
  result?: any; // JSONB object with analysis results
  progress_message?: string | null;
  error_message?: string | null;
  created_at: Date;
  completed_at: Date;
}

// Singleton pool instance
let pool: Pool | null = null;

// Get or create the connection pool with special character password support
export function getPool(): Pool {
  if (!pool) {
    console.log('🔌 Creating new PostgreSQL connection pool with special character password support...');
    
    // Use fresh config each time to ensure environment variables are read correctly
    const config = validateDatabaseConfig();
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected database pool error:', err);
      // Log password-related errors specifically
      if (err.message.includes('password authentication failed')) {
        console.error('🔐 Password authentication failed - check special character handling');
        console.error(`🔍 Attempted with user: ${config.user}`);
        console.error(`🔍 Password length: ${config.password.length}`);
      }
    });
    
    // Log successful connections
    pool.on('connect', (client) => {
      console.log('✅ New database client connected successfully');
    });
    
    // Log client removal
    pool.on('remove', (client) => {
      console.log('🔄 Database client removed from pool');
    });
  }
  return pool;
}

// Execute a query with automatic connection management and retry logic
async function executeQuery<T = any>(
  text: string, 
  params: any[] = []
): Promise<QueryResult<T>> {
  return withRetry(async () => {
    const client = await getPool().connect();
    
    try {
      const start = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;
      
      console.log(`🔍 Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      return result;
    } catch (error) {
      console.error('❌ Database query error:', {
        query: text,
        params: params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      client.release();
    }
  }, 3);
}

// Retry wrapper for database operations with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`🔄 All ${maxRetries} retry attempts failed`);
        throw error;
      }
      
      // Check if it's a connection-related error worth retrying
      const isRetryableError = error instanceof Error && (
        error.message.includes('password authentication failed') ||
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED')
      );
      
      if (!isRetryableError) {
        console.log(`🚫 Non-retryable error, failing immediately: ${error instanceof Error ? error.message : error}`);
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`🔄 Retry ${attempt}/${maxRetries} in ${delay}ms... (${error instanceof Error ? error.message : error})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Password validation function for special character handling
export async function validatePasswordHandling(): Promise<{
  isValid: boolean;
  length: number;
  expectedLength: number;
  hasSpecialChars: boolean;
  specialCharsFound: string[];
}> {
  const password = process.env.DATABASE_PASSWORD || '';
  const expectedLength = 16; // VFBZ$dPcrI)QyAag should be 16 chars
  
  const specialChars = ['$', ')', '('];
  const specialCharsFound = specialChars.filter(char => password.includes(char));
  
  const validation = {
    isValid: password.length === expectedLength && specialCharsFound.length > 0,
    length: password.length,
    expectedLength,
    hasSpecialChars: specialCharsFound.length > 0,
    specialCharsFound
  };
  
  console.log('🔍 Password validation results:', validation);
  return validation;
}

class DatabaseService {
  private getClient(): Client {
    // Get fresh config each time to ensure environment variables are read correctly
    const config = validateDatabaseConfig();
    return new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password, // Raw password with special characters
      ssl: config.ssl,
      connectionTimeoutMillis: config.connectionTimeoutMillis
    });
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    const client = this.getClient();
    try {
      console.log('Testing database connection to:', {
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user
      });
      
      // Add connection timeout
      const connectPromise = client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      console.log('Client connected successfully, running test query...');
      
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      console.log('Database connected successfully:', {
        time: result.rows[0].current_time,
        version: result.rows[0].db_version.substring(0, 50) + '...'
      });
      return true;
    } catch (error) {
      console.error('Database connection failed:', {
        error: error instanceof Error ? error.message : error,
        code: (error as any).code,
        host: dbConfig.host,
        user: dbConfig.user
      });
      return false;
    } finally {
      try {
        await client.end();
      } catch (closeError) {
        console.warn('Error closing client:', closeError);
      }
    }
  }

  // Get all company analyses with pagination (optimized for performance)
  async getCompanyAnalyses(limit: number = 50, offset: number = 0): Promise<CompanyAnalysis[]> {
    try {
      console.log('🔍 DEBUG: getCompanyAnalyses called with limit:', limit, 'offset:', offset);
      
      // Fixed query to match stats query - no status filtering to show all companies
      const query = `
        SELECT 
          id,
          company_name,
          canonical_name,
          search_query,
          analysis_result,
          status,
          created_at
        FROM company_analysis
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      console.log('🔍 DEBUG: Query SQL:', query);
      console.log('🔍 DEBUG: Query params:', [limit, offset]);
      
      const start = Date.now();
      const result = await executeQuery(query, [limit, offset]);
      const duration = Date.now() - start;
      
      console.log('🔍 DEBUG: Raw query results:', {
        rowCount: result.rows.length,
        duration: duration,
        firstRow: result.rows[0],
        allStatuses: result.rows.map(r => r.status),
        statusCounts: result.rows.reduce((acc, r) => {
          acc[r.status || 'null'] = (acc[r.status || 'null'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow query detected: getCompanyAnalyses took ${duration}ms`);
      }
      
      const mappedResults = result.rows.map(row => ({
        ...row,
        // Extract additional fields from analysis_result if available
        score: this.extractScore(row.analysis_result),
        industry: this.extractIndustry(row.analysis_result),
        revenue_range: this.extractRevenueRange(row.analysis_result)
      }));
      
      console.log('🔍 DEBUG: Mapped results count:', mappedResults.length);
      
      return mappedResults;
      
    } catch (error) {
      console.error('Error fetching company analyses:', error);
      throw error;
    }
  }

  // Get database statistics (optimized single query for performance)
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const start = Date.now();
      
      // Single optimized query to get all statistics at once
      const statsQuery = `
        WITH stats AS (
          SELECT 
            COUNT(*) as total_companies,
            COUNT(CASE WHEN (analysis_result->>'diversity_score')::float > 7.0 THEN 1 END) as high_score_leads,
            AVG((analysis_result->>'diversity_score')::float) as avg_score,
            COUNT(CASE WHEN status = 'completed' OR status = 'success' THEN 1 END) as completed_count,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
          FROM company_analysis
          WHERE analysis_result IS NOT NULL
        )
        SELECT 
          total_companies,
          high_score_leads,
          COALESCE(avg_score, 0) as average_score,
          CASE 
            WHEN total_companies > 0 THEN (completed_count::float / total_companies * 100)
            ELSE 0 
          END as success_rate,
          recent_count as recent_analyses_count
        FROM stats
      `;
      
      const result = await executeQuery(statsQuery);
      const stats = result.rows[0];
      
      const queryDuration = Date.now() - start;
      console.log(`📊 Database stats query completed in ${queryDuration}ms`);
      
      if (queryDuration > 2000) {
        console.warn(`⚠️ Slow stats query detected: ${queryDuration}ms`);
      }

      return {
        total_companies: parseInt(stats.total_companies),
        high_score_leads: parseInt(stats.high_score_leads),
        average_score: Math.round(parseFloat(stats.average_score) * 10) / 10, // Round to 1 decimal
        success_rate: Math.round(parseFloat(stats.success_rate)),
        recent_analyses_count: parseInt(stats.recent_analyses_count)
      };

    } catch (error) {
      console.error('Error fetching database stats:', error);
      throw error;
    }
  }

  // Enhanced fuzzy search for companies with comprehensive name matching
  async searchCompaniesByName(searchTerm: string, limit: number = 20): Promise<CompanyAnalysis[]> {
    try {
      console.log('🔍 ENHANCED: searchCompaniesByName called with term:', searchTerm, 'limit:', limit);
      
      const start = Date.now();
      
      // Generate search variations for comprehensive matching
      const baseTerm = searchTerm.trim();
      const searchVariations = this.generateSearchVariations(baseTerm);
      
      console.log('🔍 ENHANCED: Generated search variations:', searchVariations);
      
      // Enhanced multi-pattern fuzzy search query
      const query = `
        SELECT 
          id,
          company_name,
          canonical_name,
          search_query,
          analysis_result,
          status,
          created_at,
          -- Enhanced relevance scoring with multiple patterns
          CASE 
            -- Exact matches (highest priority)
            WHEN LOWER(company_name) = LOWER($2) THEN 1000
            WHEN LOWER(canonical_name) = LOWER($2) THEN 950
            -- Exact with common suffixes  
            WHEN LOWER(company_name) = LOWER($3) THEN 900
            WHEN LOWER(company_name) = LOWER($4) THEN 890
            WHEN LOWER(company_name) = LOWER($5) THEN 880
            WHEN LOWER(canonical_name) = LOWER($3) THEN 870
            WHEN LOWER(canonical_name) = LOWER($4) THEN 860
            WHEN LOWER(canonical_name) = LOWER($5) THEN 850
            -- Starts with matches
            WHEN LOWER(company_name) ILIKE LOWER($6) THEN 800
            WHEN LOWER(canonical_name) ILIKE LOWER($6) THEN 790
            -- Contains matches  
            WHEN LOWER(company_name) ILIKE LOWER($1) THEN 700
            WHEN LOWER(canonical_name) ILIKE LOWER($1) THEN 690
            WHEN LOWER(search_query) ILIKE LOWER($1) THEN 600
            -- Partial word matches
            WHEN LOWER(company_name) ILIKE LOWER($7) THEN 500
            WHEN LOWER(canonical_name) ILIKE LOWER($7) THEN 490
            ELSE 0
          END as relevance_score
        FROM company_analysis
        WHERE (
          -- Exact matches
          LOWER(company_name) = LOWER($2) OR
          LOWER(canonical_name) = LOWER($2) OR
          -- Exact with suffixes
          LOWER(company_name) = LOWER($3) OR
          LOWER(company_name) = LOWER($4) OR  
          LOWER(company_name) = LOWER($5) OR
          LOWER(canonical_name) = LOWER($3) OR
          LOWER(canonical_name) = LOWER($4) OR
          LOWER(canonical_name) = LOWER($5) OR
          -- Fuzzy matches
          LOWER(company_name) ILIKE LOWER($1) OR
          LOWER(canonical_name) ILIKE LOWER($1) OR
          LOWER(search_query) ILIKE LOWER($1) OR
          -- Starts with
          LOWER(company_name) ILIKE LOWER($6) OR
          LOWER(canonical_name) ILIKE LOWER($6) OR
          -- Word boundary matches
          LOWER(company_name) ILIKE LOWER($7) OR
          LOWER(canonical_name) ILIKE LOWER($7)
        )
        ORDER BY 
          relevance_score DESC,
          created_at DESC
        LIMIT $8
      `;
      
      // Enhanced search parameters with multiple variations
      const searchPattern = `%${baseTerm}%`;           // %tesla%
      const exactTerm = baseTerm;                      // tesla
      const withInc = `${baseTerm} Inc`;               // tesla inc
      const withIncDot = `${baseTerm} Inc.`;           // tesla inc.
      const withCommaInc = `${baseTerm}, Inc.`;        // tesla, inc.
      const startsWithPattern = `${baseTerm}%`;        // tesla%
      const wordBoundaryPattern = `% ${baseTerm} %`;   // % tesla %
      
      const params = [
        searchPattern,        // $1
        exactTerm,           // $2
        withInc,            // $3
        withIncDot,         // $4
        withCommaInc,       // $5
        startsWithPattern,  // $6
        wordBoundaryPattern, // $7
        limit               // $8
      ];
      
      console.log('🔍 ENHANCED: Search params:', {
        searchPattern,
        exactTerm,
        withInc,
        withIncDot,
        withCommaInc,
        startsWithPattern,
        wordBoundaryPattern,
        limit
      });
      
      const result = await executeQuery(query, params);
      
      const queryDuration = Date.now() - start;
      console.log(`🔍 ENHANCED: Search query for "${searchTerm}" completed in ${queryDuration}ms (${result.rows.length} results)`);
      
      // Enhanced debugging with actual company names found
      console.log('🔍 ENHANCED: Search results:', {
        rowCount: result.rows.length,
        companies: result.rows.map(r => ({
          id: r.id,
          company_name: r.company_name,
          canonical_name: r.canonical_name,
          relevance_score: r.relevance_score,
          status: r.status
        })),
        statusCounts: result.rows.reduce((acc, r) => {
          acc[r.status || 'null'] = (acc[r.status || 'null'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      if (queryDuration > 1500) {
        console.warn(`⚠️ Slow search query detected: ${queryDuration}ms for "${searchTerm}"`);
      }
      
      const mappedResults = result.rows.map(row => ({
        ...row,
        score: this.extractScore(row.analysis_result),
        industry: this.extractIndustry(row.analysis_result),
        revenue_range: this.extractRevenueRange(row.analysis_result)
      }));
      
      console.log('🔍 ENHANCED: Search mapped results count:', mappedResults.length);
      if (mappedResults.length > 0) {
        console.log('🔍 ENHANCED: Top result:', {
          company_name: mappedResults[0].company_name,
          canonical_name: mappedResults[0].canonical_name,
          relevance_score: (mappedResults[0] as any).relevance_score
        });
      }
      
      return mappedResults;
      
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }

  // Helper method to generate comprehensive search variations for fuzzy matching
  private generateSearchVariations(baseTerm: string): string[] {
    const variations = [
      baseTerm,                           // tesla
      `${baseTerm} Inc`,                  // tesla inc
      `${baseTerm} Inc.`,                 // tesla inc.
      `${baseTerm}, Inc.`,                // tesla, inc.
      `${baseTerm} Corporation`,          // tesla corporation
      `${baseTerm} Corp`,                 // tesla corp
      `${baseTerm} Corp.`,                // tesla corp.
      `${baseTerm} Company`,              // tesla company
      `${baseTerm} Co`,                   // tesla co
      `${baseTerm} Co.`,                  // tesla co.
      `${baseTerm} LLC`,                  // tesla llc
      `${baseTerm} Ltd`,                  // tesla ltd
      `${baseTerm} Limited`,              // tesla limited
      `${baseTerm} Motors`,               // tesla motors (specific for automotive)
      `${baseTerm} Technologies`,         // tesla technologies
      `${baseTerm} Tech`,                 // tesla tech
    ];
    
    return variations;
  }

  // Get company by ID (using connection pool)
  async getCompanyById(id: number): Promise<CompanyAnalysis | null> {
    try {
      const query = `
        SELECT 
          id,
          company_name,
          canonical_name,
          search_query,
          analysis_result,
          status,
          created_at
        FROM company_analysis
        WHERE id = $1
      `;
      
      const result = await executeQuery(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        ...row,
        score: this.extractScore(row.analysis_result),
        industry: this.extractIndustry(row.analysis_result),
        revenue_range: this.extractRevenueRange(row.analysis_result)
      };
      
    } catch (error) {
      console.error('Error fetching company by ID:', error);
      throw error;
    }
  }

  // Helper method to extract score from analysis_result
  private extractScore(analysisResult: any): number | undefined {
    if (!analysisResult) return undefined;
    
    try {
      // Based on actual data structure: {"diversity_score": 4, "community_investment": 0}
      // Try different possible score fields
      const score = analysisResult.diversity_score || 
                    analysisResult.overall_score || 
                    analysisResult.lead_score ||
                    analysisResult.pe_score ||
                    analysisResult.score;
      
      return score ? parseFloat(score) : undefined;
    } catch (error) {
      console.warn('Error extracting score from analysis_result:', error);
      return undefined;
    }
  }

  // Helper method to extract industry from analysis_result
  private extractIndustry(analysisResult: any): string | undefined {
    if (!analysisResult) return undefined;
    
    try {
      return analysisResult.industry || 
             analysisResult.sector || 
             analysisResult.business_sector ||
             analysisResult.primary_industry ||
             analysisResult.business_type;
    } catch (error) {
      console.warn('Error extracting industry from analysis_result:', error);
      return undefined;
    }
  }

  // Helper method to extract revenue range from analysis_result
  private extractRevenueRange(analysisResult: any): string | undefined {
    if (!analysisResult) return undefined;
    
    try {
      return analysisResult.revenue_range || 
             analysisResult.revenue || 
             analysisResult.annual_revenue ||
             analysisResult.estimated_revenue ||
             analysisResult.company_size;
    } catch (error) {
      console.warn('Error extracting revenue from analysis_result:', error);
      return undefined;
    }
  }

  // Get async job status by company name
  async getAsyncJobByCompanyName(companyName: string): Promise<AsyncJob | null> {
    try {
      console.log(`🔍 Checking async job for company: "${companyName}"`);
      
      const query = `
        SELECT 
          job_id, 
          company_name, 
          status, 
          result, 
          progress_message,
          error_message,
          created_at, 
          updated_at
        FROM async_jobs 
        WHERE LOWER(company_name) = LOWER($1)
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await executeQuery(query, [companyName]);
      
      if (result.rows.length === 0) {
        console.log(`❌ No async job found for company: "${companyName}"`);
        return null;
      }
      
      const job = result.rows[0];
      console.log(`✅ Found async job for "${companyName}":`, {
        job_id: job.job_id,
        status: job.status,
        created_at: job.created_at
      });
      
      return job;
      
    } catch (error) {
      console.error(`❌ Error fetching async job for company "${companyName}":`, error);
      throw error;
    }
  }

  // Get async job status by job ID
  async getAsyncJobById(jobId: string): Promise<AsyncJob | null> {
    try {
      console.log(`🔍 Checking async job by ID: ${jobId}`);
      
      const query = `
        SELECT 
          job_id, 
          company_name, 
          status, 
          result, 
          progress_message,
          error_message,
          created_at, 
          completed_at
        FROM async_jobs 
        WHERE job_id = $1
      `;
      
      const result = await executeQuery(query, [jobId]);
      
      if (result.rows.length === 0) {
        console.log(`❌ No async job found with ID: ${jobId}`);
        return null;
      }
      
      const job = result.rows[0];
      console.log(`✅ Found async job ${jobId}:`, {
        company_name: job.company_name,
        status: job.status,
        completed_at: job.completed_at
      });
      
      return job;
      
    } catch (error) {
      console.error(`❌ Error fetching async job ${jobId}:`, error);
      throw error;
    }
  }

  // Check if company has completed analysis (in main table or async jobs)
  async hasCompletedAnalysis(companyName: string): Promise<{ 
    hasCompleted: boolean; 
    source: string; 
    data?: any 
  }> {
    try {
      console.log(`🔍 Checking if "${companyName}" has completed analysis`);
      
      // First check company_analysis table (main table)
      const companyQuery = `
        SELECT id, company_name, analysis_result, created_at 
        FROM company_analysis 
        WHERE LOWER(company_name) = LOWER($1) 
        LIMIT 1
      `;
      const companyResult = await executeQuery(companyQuery, [companyName]);
      
      if (companyResult.rows.length > 0) {
        const company = companyResult.rows[0];
        console.log(`✅ Found completed analysis in company_analysis table for "${companyName}"`);
        return {
          hasCompleted: true,
          source: 'company_analysis_table',
          data: company
        };
      }
      
      // Then check async_jobs for completed jobs
      const jobQuery = `
        SELECT job_id, company_name, status, result, updated_at
        FROM async_jobs 
        WHERE LOWER(company_name) = LOWER($1) 
        AND status = 'completed'
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      const jobResult = await executeQuery(jobQuery, [companyName]);
      
      if (jobResult.rows.length > 0) {
        const job = jobResult.rows[0];
        console.log(`✅ Found completed async job for "${companyName}"`);
        return {
          hasCompleted: true,
          source: 'async_jobs_table',
          data: job
        };
      }
      
      console.log(`❌ No completed analysis found for "${companyName}"`);
      return {
        hasCompleted: false,
        source: 'not_found'
      };
      
    } catch (error) {
      console.error(`❌ Error checking completed analysis for "${companyName}":`, error);
      throw error;
    }
  }

  // Close the pool (no longer needed with new approach)
  async close(): Promise<void> {
    // No-op since we create pools per request
  }
}

// Additional utility functions with special character password validation
export async function testDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // First validate password handling
    const passwordValidation = await validatePasswordHandling();
    console.log('🔐 Password validation before connection:', passwordValidation);
    
    const start = Date.now();
    const result = await executeQuery('SELECT NOW() as current_time, version() as version');
    const duration = Date.now() - start;
    
    return {
      success: true,
      message: `Database connection successful with special character password (${duration}ms)`,
      details: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
        duration: duration,
        passwordValidation: passwordValidation
      }
    };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    // Check if it's password authentication failure
    if (error instanceof Error && error.message.includes('password authentication failed')) {
      console.error('🔐 Password authentication failed - checking special character handling...');
      const passwordValidation = await validatePasswordHandling();
      console.error('🔍 Password validation details:', passwordValidation);
      
      return {
        success: false,
        message: `Password authentication failed - check special characters. Password length: ${passwordValidation.length}, Expected: ${passwordValidation.expectedLength}`,
        details: {
          originalError: error.message,
          passwordValidation: passwordValidation
        }
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error
    };
  }
}

// Health check for the database
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  poolStats: any;
  connectionTest: any;
}> {
  try {
    const testResult = await testDatabaseConnection();
    const currentPool = getPool();
    
    return {
      isHealthy: testResult.success,
      poolStats: {
        totalCount: currentPool.totalCount,
        idleCount: currentPool.idleCount,
        waitingCount: currentPool.waitingCount
      },
      connectionTest: testResult
    };
  } catch (error) {
    return {
      isHealthy: false,
      poolStats: null,
      connectionTest: {
        success: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      }
    };
  }
}

// Close the connection pool (for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    console.log('🔌 Closing database connection pool...');
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// Environment validation for external use
export function validateEnvironmentConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Export singleton instance
export const db = new DatabaseService();

export default db;