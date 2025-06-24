// Optimized React hooks for company data management with React Query

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyAnalysis, DatabaseStats } from '@/lib/database';

// Query key factory for better cache management
const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (search?: string, limit?: number) => [...companyKeys.lists(), { search, limit }] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
  stats: () => ['companies', 'stats'] as const,
};

// Optimized hook for fetching company list with React Query
export function useCompanies(search?: string, limit: number = 50) {
  const queryResult = useQuery({
    queryKey: companyKeys.list(search, limit),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (search?.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/companies?${params}`, {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minute client cache
        },
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch companies');
      }

      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    companies: queryResult.data || [],
    loading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
    isStale: queryResult.isStale,
    isFetching: queryResult.isFetching,
  };
}

// Optimized hook for fetching individual company with React Query
export function useCompany(id: number | null) {
  const queryResult = useQuery({
    queryKey: companyKeys.detail(id!),
    queryFn: async () => {
      const response = await fetch(`/api/companies/${id}`, {
        headers: {
          'Cache-Control': 'max-age=600', // 10 minute client cache for individual companies
        },
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch company');
      }

      return result.data;
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 10 * 60 * 1000, // 10 minutes - individual companies change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache retention
    refetchOnWindowFocus: false,
  });

  return {
    company: queryResult.data || null,
    loading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
  };
}

// Optimized hook for fetching dashboard statistics with React Query
export function useDashboardStats() {
  const queryResult = useQuery({
    queryKey: companyKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/stats', {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minute client cache for stats
        },
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }

      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats can be cached shorter as they change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    stats: queryResult.data || null,
    loading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
    isStale: queryResult.isStale,
  };
}

// Hook for debounced search
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Cache invalidation helper for when new companies are added
export function useInvalidateCompanyCache() {
  const queryClient = useQueryClient();
  
  return {
    invalidateCompanyList: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
    // Prefetch a company for faster navigation
    prefetchCompany: async (id: number) => {
      await queryClient.prefetchQuery({
        queryKey: companyKeys.detail(id),
        queryFn: async () => {
          const response = await fetch(`/api/companies/${id}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          return result.data;
        },
        staleTime: 10 * 60 * 1000,
      });
    },
  };
}