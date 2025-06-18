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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_name ON company_analysis(LOWER(company_name));
CREATE INDEX IF NOT EXISTS idx_canonical_name ON company_analysis(LOWER(canonical_name));
CREATE INDEX IF NOT EXISTS idx_created_at ON company_analysis(created_at);

-- Create GIN index for JSONB analysis_result
CREATE INDEX IF NOT EXISTS idx_analysis_result_gin ON company_analysis USING GIN(analysis_result);