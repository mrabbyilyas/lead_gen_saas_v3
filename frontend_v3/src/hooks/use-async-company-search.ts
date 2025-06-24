import { useState, useCallback, useRef, useEffect } from 'react';
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
        progress: 'Checking existing database...',
      });

      // First, check if company exists in database (SAFE - only queries database, no Gemini API)
      try {
        const response = await fetch(`/api/companies?search=${encodeURIComponent(companyName)}&limit=1`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Company found in database - return immediately, NO async job needed
          const existingCompany = data.data[0];
          console.log(`Found existing company ${companyName} in database:`, existingCompany);
          setState(prev => ({
            ...prev,
            isSearching: false,
            result: existingCompany,
            progress: 'Found existing analysis in database',
            status: 'completed'
          }));
          // NO async call, NO polling - completely done here
          return;
        }
      } catch (dbError) {
        console.warn('Database check failed, proceeding with async search:', dbError);
      }

      // Company NOT found in database - ONLY THEN start async search
      console.log(`Company ${companyName} not found in database - starting async analysis`);
      setState(prev => ({
        ...prev,
        progress: 'Starting AI analysis...',
      }));

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
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to start search',
      }));
    }
  }, []);

  const pollForCompletion = useCallback(async (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 60; // Maximum 5 minutes (60 polls * 5 seconds)
    
    const poll = async () => {
      // Safety checks
      if (!pollingRef.current) {
        console.log('Polling stopped - ref is false');
        return;
      }
      
      if (pollCount >= maxPolls) {
        console.log('Polling stopped - max attempts reached');
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
      console.log(`Polling attempt ${pollCount}/${maxPolls} for job ${jobId}`);

      try {
        const status = await api.getJobStatus(jobId);
        console.log(`Job ${jobId} status:`, status.status);
        
        setState(prev => ({
          ...prev,
          status: status.status,
          progress: status.progress_message || prev.progress,
        }));

        // Check for terminal states
        if (status.status === 'completed') {
          console.log(`Job ${jobId} completed successfully`);
          setState(prev => ({
            ...prev,
            isSearching: false,
            result: status.result || null,
            progress: 'Analysis completed successfully',
          }));
          pollingRef.current = false;
          return; // Stop polling
          
        } else if (status.status === 'failed') {
          console.log(`Job ${jobId} failed:`, status.error_message);
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
          console.log(`Job ${jobId} still processing, scheduling next poll...`);
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Unknown status - treat as error
          console.log(`Job ${jobId} unknown status:`, status.status);
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: `Unknown job status: ${status.status}`,
            progress: 'Analysis failed',
          }));
          pollingRef.current = false;
          return; // Stop polling
        }
        
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
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

  // Cleanup effect - stop polling on unmount
  useEffect(() => {
    return () => {
      console.log('useAsyncCompanySearch unmounting - stopping polling');
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