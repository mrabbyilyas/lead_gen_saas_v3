// React hooks for direct database access via API routes
// Replaces API-based hooks with database-backed API routes

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Enhanced company interface from db-queries
export interface EnhancedCompanyAnalysis {
  id: number;
  company_name: string;
  canonical_name?: string | null;
  search_query?: string | null;
  analysis_result: any;
  status?: string | null;
  created_at: Date;
  ai_score_breakdown: any;
  formatted_ai_score: string;
  score?: number;
  industry?: string;
  revenue_range?: string;
}

export interface CompanySearchResults {
  companies: EnhancedCompanyAnalysis[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface DashboardStats {
  total_companies: number;
  high_score_leads: number;
  average_score: number;
  success_rate: number;
  recent_analyses_count: number;
  industry_breakdown: Array<{ industry: string; count: number; percentage: number }>;
  score_distribution: Array<{ range: string; count: number; percentage: number }>;
  recent_companies: EnhancedCompanyAnalysis[];
}

// Database-first mode enforcement (temporarily disabled for debugging)
function ensureDatabaseMode(): void {
  // Temporarily commented out to debug 500 errors
  // if (process.env.NEXT_PUBLIC_USE_DIRECT_DB !== 'true') {
  //   throw new Error('Database mode is required. Set NEXT_PUBLIC_USE_DIRECT_DB=true in environment variables.');
  // }
  
  // Debug logging
  console.log('🔍 Environment check:', {
    NEXT_PUBLIC_USE_DIRECT_DB: process.env.NEXT_PUBLIC_USE_DIRECT_DB,
    NODE_ENV: process.env.NODE_ENV
  });
}

// API functions that call the server-side database routes
async function fetchCompanies(
  searchTerm?: string,
  limit: number = 50,
  offset: number = 0
): Promise<CompanySearchResults> {
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`/api/db/companies?${params.toString()}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch companies');
  }

  return {
    companies: data.data,
    total: data.total,
    hasMore: data.hasMore,
    nextCursor: data.nextCursor
  };
}

async function fetchCompanyById(id: number): Promise<EnhancedCompanyAnalysis> {
  const response = await fetch(`/api/db/companies/${id}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch company');
  }

  return data.data;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/db/stats');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dashboard stats');
  }

  return data.data;
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/db/health');
    const data = await response.json();
    return data.success && data.data.isHealthy;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Query keys for React Query
export const queryKeys = {
  companies: (search?: string, limit?: number, offset?: number) => 
    ['companies', { search, limit, offset }] as const,
  company: (id: number) => ['company', id] as const,
  companyExists: (name: string) => ['companyExists', name] as const,
  dashboardStats: () => ['dashboardStats'] as const,
  companiesByIndustry: (industry: string, limit?: number) => 
    ['companiesByIndustry', { industry, limit }] as const,
  databaseHealth: () => ['databaseHealth'] as const,
};

/**
 * Hook for fetching companies with search functionality
 * Replaces: useCompanies hook that calls API
 */
export function useDirectCompanies(
  searchTerm?: string,
  limit: number = 50,
  offset: number = 0
) {
  // Enforce database-first mode
  ensureDatabaseMode();
  
  return useQuery({
    queryKey: queryKeys.companies(searchTerm, limit, offset),
    queryFn: () => fetchCompanies(searchTerm, limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3, // Increase retries for database reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    throwOnError: false, // Allow error handling in components
    meta: {
      errorMessage: 'Failed to fetch companies from database'
    }
  });
}

/**
 * Hook for fetching a single company by ID
 * Replaces: individual company API calls
 */
export function useDirectCompany(id: number) {
  // Enforce database-first mode
  ensureDatabaseMode();
  
  return useQuery({
    queryKey: queryKeys.company(id),
    queryFn: () => fetchCompanyById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes (company data changes rarely)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3, // Increase retries for database reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    enabled: !!id && id > 0,
    throwOnError: false, // Allow error handling in components
    meta: {
      errorMessage: `Failed to fetch company ${id} from database`
    }
  });
}

/**
 * Hook for checking if a company exists (for async search logic)
 * Replaces: API call in async search hook
 */
export function useDirectCompanyExists(companyName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.companyExists(companyName),
    queryFn: async () => {
      // Check by searching for the company name
      const result = await fetchCompanies(companyName, 1, 0);
      return result.companies.length > 0 ? result.companies[0] : null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for existence checks
    enabled: enabled && !!companyName.trim(),
    meta: {
      errorMessage: `Failed to check if company "${companyName}" exists`
    }
  });
}

/**
 * Hook for fetching dashboard statistics
 * Replaces: /api/stats endpoint
 */
export function useDirectDashboardStats() {
  // Enforce database-first mode
  ensureDatabaseMode();
  
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3, // Increase retries for database reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    throwOnError: false, // Allow error handling in components
    meta: {
      errorMessage: 'Failed to fetch dashboard statistics from database'
    }
  });
}

/**
 * Hook for fetching companies by industry
 */
export function useDirectCompaniesByIndustry(industry: string, limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.companiesByIndustry(industry, limit),
    queryFn: () => fetchCompanies(industry, limit, 0), // Use search to filter by industry
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 2,
    enabled: !!industry.trim(),
    meta: {
      errorMessage: `Failed to fetch companies in industry "${industry}"`
    }
  });
}

/**
 * Hook for checking database health
 */
export function useDirectDatabaseHealth() {
  return useQuery({
    queryKey: queryKeys.databaseHealth(),
    queryFn: checkDatabaseHealth,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    refetchInterval: 60 * 1000, // Check every minute
    meta: {
      errorMessage: 'Failed to check database health'
    }
  });
}

/**
 * Hook for cache invalidation and management
 */
export function useDirectCompanyCache() {
  const queryClient = useQueryClient();

  const invalidateCompanyList = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['companies'],
      exact: false 
    });
  };

  const invalidateCompany = (id: number) => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.company(id) 
    });
  };

  const invalidateDashboardStats = () => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboardStats() 
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const prefetchCompany = async (id: number) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.company(id),
      queryFn: () => fetchCompanyById(id),
      staleTime: 10 * 60 * 1000
    });
  };

  const prefetchCompanies = async (searchTerm?: string, limit: number = 50) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.companies(searchTerm, limit, 0),
      queryFn: () => fetchCompanies(searchTerm, limit, 0),
      staleTime: 5 * 60 * 1000
    });
  };

  return {
    invalidateCompanyList,
    invalidateCompany,
    invalidateDashboardStats,
    invalidateAll,
    prefetchCompany,
    prefetchCompanies
  };
}

/**
 * Hook for advanced company search with debouncing
 */
export function useAdvancedCompanySearch(
  initialSearchTerm: string = '',
  debounceMs: number = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const companiesQuery = useDirectCompanies(
    debouncedSearchTerm.trim() || undefined,
    50,
    0
  );

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    ...companiesQuery,
    isSearching: searchTerm !== debouncedSearchTerm || companiesQuery.isFetching
  };
}

/**
 * Helper hook for environment-based data source switching
 * Allows gradual migration from API to direct database
 */
export function useDataSource() {
  // This can be controlled via environment variable
  const useDirectDatabase = process.env.NEXT_PUBLIC_USE_DIRECT_DB === 'true';
  
  return {
    useDirectDatabase,
    dataSource: useDirectDatabase ? 'database' : 'api'
  };
}

// Re-export types for convenience
export type {
  EnhancedCompanyAnalysis,
  CompanySearchResults,
  DashboardStats
};