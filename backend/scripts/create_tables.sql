-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create company_analysis table
CREATE TABLE IF NOT EXISTS company_analysis (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255),
    search_query VARCHAR(255) NOT NULL,
    analysis_result JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_company_name ON company_analysis(LOWER(company_name));
CREATE INDEX IF NOT EXISTS idx_canonical_name ON company_analysis(LOWER(canonical_name));
CREATE INDEX IF NOT EXISTS idx_created_at ON company_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status ON company_analysis(status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_company_name_created_at ON company_analysis(LOWER(company_name), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canonical_name_created_at ON company_analysis(LOWER(canonical_name), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_created_at ON company_analysis(status, created_at DESC);

-- Trigram indexes for fuzzy text search performance
CREATE INDEX IF NOT EXISTS idx_company_name_trgm ON company_analysis USING GIN(LOWER(company_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_canonical_name_trgm ON company_analysis USING GIN(LOWER(canonical_name) gin_trgm_ops);

-- GIN index for JSONB analysis_result with specific paths
CREATE INDEX IF NOT EXISTS idx_analysis_result_gin ON company_analysis USING GIN(analysis_result);
CREATE INDEX IF NOT EXISTS idx_analysis_result_industry ON company_analysis USING GIN((analysis_result->'company_basic_info'->>'industry_primary'));
CREATE INDEX IF NOT EXISTS idx_analysis_diversity_score ON company_analysis((analysis_result->>'diversity_score'));

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_companies ON company_analysis(created_at DESC) WHERE status = 'completed';