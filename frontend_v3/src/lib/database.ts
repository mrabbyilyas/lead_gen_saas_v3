// Database connection and utilities for Azure PostgreSQL

import { Client } from 'pg';

// Environment variable validation with Azure PostgreSQL configuration
const validateDatabaseConfig = () => {
  const required = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  // Check for password (either encoded or plain)
  const hasPassword = process.env.DATABASE_PASSWORD_ENCODED || process.env.DATABASE_PASSWORD;
  if (!hasPassword) {
    missing.push('DATABASE_PASSWORD or DATABASE_PASSWORD_ENCODED');
  }
  
  if (missing.length > 0) {
    console.warn(`Missing database environment variables: ${missing.join(', ')}. Using fallback values.`);
  }
  
  // Decode password if it's Base64 encoded
  let password = '';
  if (process.env.DATABASE_PASSWORD_ENCODED) {
    try {
      password = Buffer.from(process.env.DATABASE_PASSWORD_ENCODED, 'base64').toString();
    } catch (error) {
      console.error('Failed to decode Base64 password:', error);
      password = process.env.DATABASE_PASSWORD || '';
    }
  } else {
    password = process.env.DATABASE_PASSWORD || '';
  }
  
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'postgres',
    user: process.env.DATABASE_USER || 'postgres',
    password: password,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require', // Azure PostgreSQL requires SSL
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };
};

// Database configuration using environment variables
const dbConfig = validateDatabaseConfig();

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

class DatabaseService {
  private getClient(): Client {
    // Create a new client for each request with explicit config
    return new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      connectionTimeoutMillis: dbConfig.connectionTimeoutMillis
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

  // Get all company analyses with pagination
  async getCompanyAnalyses(limit: number = 50, offset: number = 0): Promise<CompanyAnalysis[]> {
    const client = this.getClient();
    try {
      await client.connect();
      
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
      
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(row => ({
        ...row,
        // Extract additional fields from analysis_result if available
        score: this.extractScore(row.analysis_result),
        industry: this.extractIndustry(row.analysis_result),
        revenue_range: this.extractRevenueRange(row.analysis_result)
      }));
      
    } catch (error) {
      console.error('Error fetching company analyses:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    const client = this.getClient();
    try {
      await client.connect();
      
      // Get total companies
      const totalResult = await client.query('SELECT COUNT(*) as count FROM company_analysis');
      const total_companies = parseInt(totalResult.rows[0].count);

      // Get high score leads (assuming score > 8)
      const highScoreQuery = `
        SELECT COUNT(*) as count 
        FROM company_analysis 
        WHERE (analysis_result->>'score')::float > 8.0
      `;
      const highScoreResult = await client.query(highScoreQuery);
      const high_score_leads = parseInt(highScoreResult.rows[0].count);

      // Get average score
      const avgScoreQuery = `
        SELECT AVG((analysis_result->>'score')::float) as avg_score 
        FROM company_analysis 
        WHERE analysis_result->>'score' IS NOT NULL
      `;
      const avgScoreResult = await client.query(avgScoreQuery);
      const average_score = parseFloat(avgScoreResult.rows[0].avg_score || '0');

      // Get success rate (completed analyses)
      const successQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM company_analysis
      `;
      const successResult = await client.query(successQuery);
      const success_rate = total_companies > 0 
        ? (parseInt(successResult.rows[0].completed) / total_companies) * 100 
        : 0;

      // Get recent analyses count (last 30 days)
      const recentQuery = `
        SELECT COUNT(*) as count 
        FROM company_analysis 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
      const recentResult = await client.query(recentQuery);
      const recent_analyses_count = parseInt(recentResult.rows[0].count);

      return {
        total_companies,
        high_score_leads,
        average_score: Math.round(average_score * 10) / 10, // Round to 1 decimal
        success_rate: Math.round(success_rate),
        recent_analyses_count
      };

    } catch (error) {
      console.error('Error fetching database stats:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  // Search companies by name
  async searchCompaniesByName(searchTerm: string, limit: number = 20): Promise<CompanyAnalysis[]> {
    const client = this.getClient();
    try {
      await client.connect();
      
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
        WHERE 
          company_name ILIKE $1 
          OR canonical_name ILIKE $1
          OR search_query ILIKE $1
        ORDER BY 
          CASE 
            WHEN company_name ILIKE $2 THEN 1
            WHEN canonical_name ILIKE $2 THEN 2
            WHEN search_query ILIKE $2 THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT $3
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const exactPattern = searchTerm;
      
      const result = await client.query(query, [searchPattern, exactPattern, limit]);
      
      return result.rows.map(row => ({
        ...row,
        score: this.extractScore(row.analysis_result),
        industry: this.extractIndustry(row.analysis_result),
        revenue_range: this.extractRevenueRange(row.analysis_result)
      }));
      
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  // Get company by ID
  async getCompanyById(id: number): Promise<CompanyAnalysis | null> {
    const client = this.getClient();
    try {
      await client.connect();
      
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
      
      const result = await client.query(query, [id]);
      
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
    } finally {
      await client.end();
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

  // Close the pool (no longer needed with new approach)
  async close(): Promise<void> {
    // No-op since we create pools per request
  }
}

// Export singleton instance
export const db = new DatabaseService();

export default db;