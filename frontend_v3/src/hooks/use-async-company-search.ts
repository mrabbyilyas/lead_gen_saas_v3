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
      console.log(`🚀 Starting enhanced search for: "${companyName}"`);
      
      // Reset state
      setState({
        ...initialState,
        isSearching: true,
        startTime: new Date(),
        progress: 'Checking existing database...',
      });

      // STEP 1: Check if company exists in main company_analysis table (DATABASE-FIRST)
      console.log(`📊 Step 1: Checking company_analysis table for "${companyName}"`);
      
      try {
        // FIXED: Use database-first endpoint instead of old API
        const response = await fetch(`/api/db/companies?search=${encodeURIComponent(companyName)}&limit=1`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Company found in database - return immediately, NO async job needed
          const existingCompany = data.data[0];
          console.log(`✅ Found existing company "${companyName}" in company_analysis table:`, {
            id: existingCompany.id,
            name: existingCompany.company_name,
            canonical: existingCompany.canonical_name
          });
          
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
        
        console.log(`❌ Company "${companyName}" not found in company_analysis table`);
      } catch (dbError) {
        console.warn('❌ Database check failed, proceeding with async search:', dbError);
      }

      // STEP 2: Check if there's an existing async job for this company
      console.log(`⚙️ Step 2: Checking async_jobs table for "${companyName}"`);
      
      setState(prev => ({
        ...prev,
        progress: 'Checking for existing analysis jobs...',
      }));
      
      try {
        // Check for existing async jobs
        const jobResponse = await fetch(`/api/db/async-jobs/by-company/${encodeURIComponent(companyName)}`);
        const jobData = await jobResponse.json();
        
        if (jobData.success) {
          if (jobData.data.status === 'completed') {
            console.log(`✅ Found completed async job for "${companyName}"`);
            
            setState(prev => ({
              ...prev,
              isSearching: false,
              result: jobData.data.result,
              progress: 'Found existing analysis from previous job',
              status: 'completed'
            }));
            return; // STOP HERE - Use existing job result
          }
          
          if (jobData.data.status === 'processing' || jobData.data.status === 'pending') {
            console.log(`🔄 Found ongoing async job for "${companyName}": ${jobData.data.job_id}`);
            
            setState(prev => ({
              ...prev,
              jobId: jobData.data.job_id,
              status: jobData.data.status,
              progress: 'Resuming existing analysis...',
            }));
            
            // Resume polling existing job
            pollingRef.current = true;
            pollForCompletion(jobData.data.job_id);
            return; // Continue with existing job
          }
        }
      } catch (jobError) {
        console.warn('❌ Async job check failed, proceeding with new job:', jobError);
      }
      
      // STEP 3: Company not found anywhere - start new async analysis
      console.log(`🆕 Step 3: "${companyName}" not found - starting new async analysis`);
      setState(prev => ({
        ...prev,
        progress: 'Starting AI analysis...',
      }));

      try {
        const newJobResponse = await api.searchCompanyAsync({ company_name: companyName });
        
        setState(prev => ({
          ...prev,
          jobId: newJobResponse.job_id,
          status: newJobResponse.status,
          progress: newJobResponse.progress_message || 'AI analysis in progress...',
          estimatedCompletion: newJobResponse.estimated_completion || null,
        }));

        // Start polling for NEW job only
        pollingRef.current = true;
        pollForCompletion(newJobResponse.job_id);
        
      } catch (backendError: any) {
        // Enhanced backend error debugging
        console.error(`💥 Backend API error for "${companyName}":`, {
          error: backendError,
          status: backendError?.status,
          response: backendError?.response,
          responseStatus: backendError?.response?.status,
          responseData: backendError?.response?.data,
          message: backendError?.message,
          name: backendError?.name,
          stack: backendError?.stack?.substring(0, 500) // First 500 chars of stack trace
        });
        
        // Log raw error object to see all properties
        console.log('🔍 Raw backend error object:', backendError);
        
        // Try to extract response data if available
        if (backendError?.response?.data) {
          console.log('📊 Backend response data:', backendError.response.data);
        }
        
        // Check if this is a 422 "already exists" error
        const is422Error = backendError?.status === 422 || 
                          backendError?.response?.status === 422 || 
                          (backendError instanceof Error && backendError.message.includes('422'));
        
        console.log(`🔍 Is 422 error check:`, {
          is422Error,
          directStatus: backendError?.status,
          responseStatus: backendError?.response?.status,
          messageContains422: backendError instanceof Error && backendError.message.includes('422')
        });
        
        if (is422Error) {
          
          console.log(`🔄 422 Error detected - backend says "${companyName}" already exists, retrying database search...`);
          
          setState(prev => ({
            ...prev,
            progress: 'Backend says company exists, searching database again...',
          }));
          
          // STEP 3.1: Ultra-broad database search since backend says company exists
          try {
            // Try broader search with multiple name variations
            const ultraBroadSearch = await fetch(`/api/db/companies?search=${encodeURIComponent(companyName)}&limit=10`);
            const ultraBroadData = await ultraBroadSearch.json();
            
            console.log(`🔍 Ultra-broad search results for "${companyName}":`, ultraBroadData);
            
            if (ultraBroadData.success && ultraBroadData.data && ultraBroadData.data.length > 0) {
              // Found it with broader search!
              const foundCompany = ultraBroadData.data[0];
              console.log(`✅ Found "${companyName}" with ultra-broad search:`, foundCompany.company_name);
              
              setState(prev => ({
                ...prev,
                isSearching: false,
                result: foundCompany,
                progress: 'Found existing company with enhanced search',
                status: 'completed'
              }));
              return; // SUCCESS - found it after all
            }
            
            // Still not found even with ultra-broad search
            console.log(`❌ Ultra-broad search still didn't find "${companyName}" - this may be a backend sync issue`);
            
            setState(prev => ({
              ...prev,
              isSearching: false,
              error: `Backend says "${companyName}" exists but database search cannot find it. This may indicate a sync issue between systems.`,
              progress: 'Search completed with inconsistency detected',
            }));
            
          } catch (ultraSearchError) {
            console.error(`💥 Ultra-broad search failed for "${companyName}":`, ultraSearchError);
            
            setState(prev => ({
              ...prev,
              isSearching: false,
              error: `Backend says "${companyName}" exists (422 error) but database search failed. Please try again or contact support.`,
              progress: 'Search failed due to system inconsistency',
            }));
          }
          
        } else {
          // Non-422 error - treat as regular backend failure
          console.error(`💥 Non-422 backend error for "${companyName}":`, backendError);
          
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: backendError instanceof Error ? backendError.message : 'Backend analysis service unavailable',
            progress: 'Analysis service unavailable',
          }));
        }
      }

    } catch (error) {
      console.error(`💥 Unexpected error in startSearch for "${companyName}":`, error);
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
    
    console.log(`🔄 Starting enhanced polling for job: ${jobId}`);
    
    // Enhanced polling function with database-first checks
    const pollJobStatus = async (jobId: string) => {
      // STEP 1: Check database first (FAST - local database query)
      console.log(`📊 Checking job ${jobId} status in database first...`);
      
      try {
        const dbResponse = await fetch(`/api/db/async-jobs/by-id/${jobId}`);
        const dbData = await dbResponse.json();
        
        if (dbData.success && dbData.data) {
          if (dbData.data.status === 'completed') {
            console.log(`✅ Job ${jobId} completed in database - stopping polling immediately`);
            return {
              status: 'completed',
              result: dbData.data.result,
              progress_message: 'Analysis completed successfully',
              source: 'database'
            };
          }
          
          if (dbData.data.status === 'failed') {
            console.log(`❌ Job ${jobId} failed in database - stopping polling immediately`);
            return {
              status: 'failed',
              error_message: dbData.data.error_message || 'Analysis failed',
              source: 'database'
            };
          }
          
          // If database shows 'processing' or 'pending', we can still check backend API as fallback
          if (dbData.data.status === 'processing' || dbData.data.status === 'pending') {
            console.log(`⏳ Job ${jobId} still ${dbData.data.status} in database, checking backend API...`);
            
            // STEP 2: Fallback to backend API for processing jobs
            try {
              const backendStatus = await api.getJobStatus(jobId);
              return {
                ...backendStatus,
                source: 'backend_api'
              };
            } catch (backendError) {
              console.warn(`⚠️ Backend API check failed for job ${jobId}, using database status:`, backendError);
              return {
                status: dbData.data.status,
                progress_message: dbData.data.progress_message,
                source: 'database_fallback'
              };
            }
          }
        }
        
        // If database doesn't have the job, fallback to backend API
        console.log(`❓ Job ${jobId} not found in database, checking backend API...`);
        const backendStatus = await api.getJobStatus(jobId);
        return {
          ...backendStatus,
          source: 'backend_api_only'
        };
        
      } catch (dbError) {
        console.warn(`⚠️ Database check failed for job ${jobId}, fallback to backend API:`, dbError);
        // Fallback to backend API if database check fails
        const backendStatus = await api.getJobStatus(jobId);
        return {
          ...backendStatus,
          source: 'backend_fallback'
        };
      }
    };
    
    const poll = async () => {
      // Safety checks
      if (!pollingRef.current) {
        console.log('🛑 Polling stopped - ref is false');
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
      console.log(`🔄 Enhanced poll attempt ${pollCount}/${maxPolls} for job ${jobId}`);

      try {
        const status = await pollJobStatus(jobId);
        console.log(`📊 Job ${jobId} status from ${status.source}:`, status.status);
        
        setState(prev => ({
          ...prev,
          status: status.status,
          progress: status.progress_message || prev.progress,
        }));

        // Terminal states - STOP immediately
        if (status.status === 'completed') {
          console.log(`🎉 Job ${jobId} completed successfully from ${status.source}`);
          setState(prev => ({
            ...prev,
            isSearching: false,
            result: status.result || null,
            progress: 'Analysis completed successfully',
          }));
          pollingRef.current = false; // Critical: Stop polling
          return; // Exit immediately
          
        } else if (status.status === 'failed') {
          console.log(`💥 Job ${jobId} failed from ${status.source}:`, status.error_message);
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: status.error_message || 'Analysis failed',
            progress: 'Analysis failed',
          }));
          pollingRef.current = false; // Critical: Stop polling
          return; // Exit immediately
          
        } else if (status.status === 'processing' || status.status === 'pending') {
          // Continue polling only for these states
          console.log(`⏳ Job ${jobId} still ${status.status}, will poll again in 5 seconds`);
          setTimeout(poll, 5000);
        } else {
          // Unknown status - treat as error and stop
          console.log(`❓ Job ${jobId} unknown status: ${status.status}`);
          setState(prev => ({
            ...prev,
            isSearching: false,
            error: `Unknown job status: ${status.status}`,
            progress: 'Analysis failed',
          }));
          pollingRef.current = false; // Stop polling
          return;
        }
        
      } catch (error) {
        console.error(`💥 Error in enhanced polling for job ${jobId}:`, error);
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Failed to check status',
        }));
        pollingRef.current = false; // Stop polling on error
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