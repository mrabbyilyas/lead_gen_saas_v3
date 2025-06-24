// Enhanced async search that uses direct database check first
// This prevents unnecessary async API calls for existing companies

import { useState, useCallback, useRef, useEffect } from 'react';
import { api, AsyncJobStatus } from '@/lib/api';
import { useDirectCompanyExists } from './use-direct-company-data';
import type { EnhancedCompanyAnalysis } from './use-direct-company-data';

export interface EnhancedAsyncSearchState {
  isSearching: boolean;
  jobId: string | null;
  status: string | null;
  progress: string | null;
  estimatedCompletion: string | null;
  result: EnhancedCompanyAnalysis | null;
  error: string | null;
  startTime: Date | null;
  foundExisting: boolean;
}

export interface EnhancedAsyncSearchActions {
  startSearch: (companyName: string) => Promise<void>;
  cancelSearch: () => void;
  clearResults: () => void;
}

const initialState: EnhancedAsyncSearchState = {
  isSearching: false,
  jobId: null,
  status: null,
  progress: null,
  estimatedCompletion: null,
  result: null,
  error: null,
  startTime: null,
  foundExisting: false,
};

export function useEnhancedAsyncCompanySearch(): [EnhancedAsyncSearchState, EnhancedAsyncSearchActions] {
  const [state, setState] = useState<EnhancedAsyncSearchState>(initialState);
  const pollingRef = useRef<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Use direct database check
  const { data: existingCompany, refetch: checkDatabase } = useDirectCompanyExists(
    searchTerm,
    false // Don't auto-fetch, we'll trigger manually
  );

  const startSearch = useCallback(async (companyName: string) => {
    try {
      // Reset state
      setState({
        ...initialState,
        isSearching: true,
        startTime: new Date(),
        progress: 'Checking database for existing analysis...',
      });

      console.log(`🔍 Enhanced search for: "${companyName}"`);

      // Set search term to trigger the database check
      setSearchTerm(companyName);

      // Check database directly first
      const { data: existingCompany } = await checkDatabase();

      if (existingCompany) {
        // Company found in database - return immediately, NO async job needed
        console.log(`✅ Found existing company "${companyName}" in database:`, existingCompany);
        setState(prev => ({
          ...prev,
          isSearching: false,
          result: existingCompany,
          progress: 'Found existing analysis in database',
          status: 'completed',
          foundExisting: true
        }));
        // Completely done here - no API calls needed
        return;
      }

      // Company NOT found in database - start async search
      console.log(`❌ Company "${companyName}" not found in database - starting AI analysis`);
      setState(prev => ({
        ...prev,
        progress: 'Starting AI analysis for new company...',
        foundExisting: false
      }));

      // Call async API endpoint
      const jobResponse = await api.searchCompanyAsync({ company_name: companyName });
      
      setState(prev => ({
        ...prev,
        jobId: jobResponse.job_id,
        status: jobResponse.status,
        progress: jobResponse.progress_message || 'AI analysis in progress...',
        estimatedCompletion: jobResponse.estimated_completion || null,
      }));

      // Start polling for NEW companies only
      pollingRef.current = true;
      pollForCompletion(jobResponse.job_id);

    } catch (error) {
      console.error('Enhanced search error:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to search company',
      }));
    }
  }, [checkDatabase]);

  const pollForCompletion = useCallback(async (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 60; // Maximum 5 minutes (60 polls * 5 seconds)
    
    const poll = async () => {
      // Safety checks
      if (!pollingRef.current) {
        console.log('✋ Polling stopped - ref is false');
        return;
      }
      
      if (pollCount >= maxPolls) {
        console.log('⏰ Polling stopped - max attempts reached');
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: 'Analysis timed out after 5 minutes',
          progress: 'Timeout - analysis took too long',
        }));
        pollingRef.current = false;
        return;
      }

      pollCount++;
      console.log(`🔄 Polling attempt ${pollCount}/${maxPolls} for job ${jobId}`);

      try {
        const status = await api.getJobStatus(jobId);
        console.log(`📊 Job ${jobId} status:`, status.status);
        
        setState(prev => ({
          ...prev,
          status: status.status,
          progress: status.progress_message || prev.progress,
        }));

        // Check for terminal states
        if (status.status === 'completed') {
          console.log(`✅ Job ${jobId} completed successfully`);
          setState(prev => ({
            ...prev,
            isSearching: false,
            result: status.result || null,
            progress: 'Analysis completed successfully',
          }));
          pollingRef.current = false;
          return; // Stop polling
          
        } else if (status.status === 'failed') {
          console.log(`❌ Job ${jobId} failed:`, status.error_message);
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: status.error_message || 'Analysis failed',
            progress: 'Analysis failed',
          }));
          pollingRef.current = false;
          return; // Stop polling
          
        } else if (status.status === 'processing' || status.status === 'pending') {
          // Still processing - continue polling
          console.log(`⏳ Job ${jobId} still processing, scheduling next poll...`);
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Unknown status - treat as error
          console.log(`❓ Job ${jobId} unknown status:`, status.status);
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: `Unknown job status: ${status.status}`,
            progress: 'Analysis failed with unknown status',
          }));
          pollingRef.current = false;
          return; // Stop polling
        }
        
      } catch (error) {
        console.error(`❌ Error polling job ${jobId}:`, error);
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Failed to check analysis status',
        }));
        pollingRef.current = false;
      }
    };

    // Start first poll immediately
    poll();
  }, []);

  const cancelSearch = useCallback(() => {
    pollingRef.current = false;
    setState(prev => ({
      ...prev,
      isSearching: false,
      progress: 'Search cancelled by user',
    }));
  }, []);

  const clearResults = useCallback(() => {
    pollingRef.current = false;
    setState(initialState);
    setSearchTerm('');
  }, []);

  // Cleanup effect - stop polling on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Enhanced async search unmounting - stopping polling');
      pollingRef.current = false;
    };
  }, []);

  return [
    state,
    {
      startSearch,
      cancelSearch,
      clearResults,
    },
  ];
}

// Helper function to calculate elapsed time
export function getElapsedTime(startTime: Date | null): string {
  if (!startTime) return '0s';
  
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Helper function to estimate remaining time
export function getEstimatedTimeRemaining(
  startTime: Date | null,
  estimatedCompletion: string | null
): string {
  if (!startTime || !estimatedCompletion) return 'Calculating...';
  
  try {
    const completionTime = new Date(estimatedCompletion);
    const remaining = Math.max(0, Math.floor((completionTime.getTime() - Date.now()) / 1000));
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    if (remaining === 0) return 'Almost done...';
    if (minutes > 0) {
      return `~${minutes}m ${seconds}s remaining`;
    }
    return `~${seconds}s remaining`;
  } catch {
    return 'Calculating...';
  }
}