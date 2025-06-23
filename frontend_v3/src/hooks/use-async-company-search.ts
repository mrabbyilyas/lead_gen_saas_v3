import { useState, useCallback, useRef } from 'react';
import { api, CompanySearchResponse, AsyncJobStatus } from '@/lib/api';

export interface AsyncSearchState {
  isSearching: boolean;
  jobId: string | null;
  status: string | null;
  progress: string | null;
  estimatedCompletion: string | null;
  result: CompanySearchResponse | null;
  error: string | null;
  startTime: Date | null;
}

export interface AsyncSearchActions {
  startSearch: (companyName: string) => Promise<void>;
  cancelSearch: () => void;
  clearResults: () => void;
}

const initialState: AsyncSearchState = {
  isSearching: false,
  jobId: null,
  status: null,
  progress: null,
  estimatedCompletion: null,
  result: null,
  error: null,
  startTime: null,
};

export function useAsyncCompanySearch(): [AsyncSearchState, AsyncSearchActions] {
  const [state, setState] = useState<AsyncSearchState>(initialState);
  const pollingRef = useRef<boolean>(false);

  const startSearch = useCallback(async (companyName: string) => {
    try {
      // Reset state
      setState({
        ...initialState,
        isSearching: true,
        startTime: new Date(),
      });

      // Start async search
      const jobResponse = await api.searchCompanyAsync({ company_name: companyName });
      
      setState(prev => ({
        ...prev,
        jobId: jobResponse.job_id,
        status: jobResponse.status,
        progress: jobResponse.progress_message || 'Starting analysis...',
        estimatedCompletion: jobResponse.estimated_completion || null,
      }));

      // Start polling
      pollingRef.current = true;
      pollForCompletion(jobResponse.job_id);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to start search',
      }));
    }
  }, []);

  const pollForCompletion = useCallback(async (jobId: string) => {
    const poll = async () => {
      if (!pollingRef.current) return;

      try {
        const status = await api.getJobStatus(jobId);
        
        setState(prev => ({
          ...prev,
          status: status.status,
          progress: status.progress_message || prev.progress,
        }));

        if (status.status === 'completed' && status.result) {
          // Success - analysis completed
          setState(prev => ({
            ...prev,
            isSearching: false,
            result: status.result!,
            progress: 'Analysis completed successfully',
          }));
          pollingRef.current = false;
          
        } else if (status.status === 'failed') {
          // Failed - show error
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: status.error_message || 'Analysis failed',
            progress: 'Analysis failed',
          }));
          pollingRef.current = false;
          
        } else {
          // Still processing - continue polling
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Failed to check status',
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
      progress: 'Search cancelled',
    }));
  }, []);

  const clearResults = useCallback(() => {
    pollingRef.current = false;
    setState(initialState);
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