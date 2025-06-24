"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, Building2, ArrowRight, Loader2, Brain, CheckCircle, XCircle } from "lucide-react";
import { useAdvancedCompanySearch } from "@/hooks/use-direct-company-data";
import { calculateAIScore, formatAIScore, getScoreBadgeVariant } from "@/lib/ai-score";
import { api } from "@/lib/api";

interface UnifiedSearchProps {
  placeholder?: string;
  showResults?: boolean;
  onCompanySelect?: (company: any) => void;
}

export function UnifiedSearch({ 
  placeholder = "Search for any company...", 
  showResults = true,
  onCompanySelect 
}: UnifiedSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Async job progress states
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobCompanyName, setJobCompanyName] = useState<string>("");
  const [jobError, setJobError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the same working search logic from scoring page
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    data: searchResults,
    isLoading: companiesLoading,
    error: companiesError,
    isSearching
  } = useAdvancedCompanySearch(searchQuery, 300);
  
  // Extract companies from the enhanced data structure
  const companies = searchResults?.companies || [];
  
  // Sync search query with the hook
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery, setSearchTerm]);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  // Start job polling
  const startJobPolling = (jobId: string, companyName: string) => {
    setCurrentJobId(jobId);
    setJobCompanyName(companyName);
    setIsJobRunning(true);
    setJobProgress(10); // Start with 10% to show something is happening
    setJobStatus("Starting analysis...");
    setJobError(null);
    
    console.log(`🔄 Starting job polling for ${companyName} (Job ID: ${jobId})`);
    
    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await api.getJobStatus(jobId);
        console.log(`📊 Job status update:`, status);
        
        // Update progress based on status
        if (status.status === 'pending') {
          setJobProgress(20);
          setJobStatus("Initializing analysis...");
        } else if (status.status === 'running') {
          setJobProgress(prev => Math.min(prev + 10, 80)); // Gradually increase to 80%
          setJobStatus(status.progress_message || "Analyzing company data...");
        } else if (status.status === 'completed') {
          setJobProgress(100);
          setJobStatus("Analysis complete!");
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Navigate to company page after a brief delay
          setTimeout(() => {
            setIsJobRunning(false);
            if (status.result?.id) {
              router.push(`/dashboard/companies/${status.result.id}`);
            } else {
              // Fallback to companies list
              router.push('/dashboard/companies');
            }
          }, 1500);
          
        } else if (status.status === 'failed') {
          console.error(`💥 Job failed:`, status.error_message);
          setJobError(status.error_message || 'Analysis failed');
          setJobStatus("Analysis failed");
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
        
      } catch (error) {
        console.error(`💥 Error polling job status:`, error);
        setJobError('Failed to check analysis progress');
        
        // Stop polling on error
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }, 3000); // Poll every 3 seconds
  };
  
  // Stop job polling
  const stopJobPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsJobRunning(false);
    setCurrentJobId(null);
    setJobProgress(0);
    setJobStatus("");
    setJobCompanyName("");
    setJobError(null);
  };
  
  // Handle company selection (click on result)
  const handleCompanySelect = async (company: any) => {
    console.log(`🏢 Company selected: ${company.company_name} (ID: ${company.id})`);
    
    if (onCompanySelect) {
      onCompanySelect(company);
    } else {
      // Navigate to company analysis page
      router.push(`/dashboard/companies/${company.id}`);
    }
  };
  
  // Handle form submission (Enter key or submit button)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      console.log(`🚀 Unified search submit: "${searchQuery}"`);
      
      // Step 1: Final database check for exact company
      console.log(`📊 Step 1: Final database check for "${searchQuery}"`);
      const dbResponse = await fetch(`/api/db/companies?search=${encodeURIComponent(searchQuery.trim())}&limit=1`);
      const dbData = await dbResponse.json();
      
      if (dbData.success && dbData.data && dbData.data.length > 0) {
        // Found in database - navigate to company page
        const foundCompany = dbData.data[0];
        console.log(`✅ Found "${searchQuery}" in database:`, foundCompany.company_name);
        
        if (onCompanySelect) {
          onCompanySelect(foundCompany);
        } else {
          router.push(`/dashboard/companies/${foundCompany.id}`);
        }
        return;
      }
      
      // Step 2: Company not found - trigger async analysis
      console.log(`🆕 Step 2: "${searchQuery}" not found in database, starting async analysis`);
      
      try {
        const asyncResult = await api.searchCompanyAsync({ company_name: searchQuery.trim() });
        console.log(`🔄 Async analysis started for "${searchQuery}":`, asyncResult.job_id);
        
        // Start job polling instead of redirecting immediately
        startJobPolling(asyncResult.job_id, searchQuery.trim());
        
      } catch (asyncError: any) {
        console.error(`💥 Async analysis failed for "${searchQuery}":`, asyncError);
        
        if (asyncError?.status === 422 || asyncError?.response?.status === 422) {
          // 422 means company already exists in backend, try database search again
          console.log(`🔄 422 error - backend says "${searchQuery}" exists, trying ultra-broad search`);
          
          const ultraBroadResponse = await fetch(`/api/db/companies?search=${encodeURIComponent(searchQuery)}&limit=10`);
          const ultraBroadData = await ultraBroadResponse.json();
          
          if (ultraBroadData.success && ultraBroadData.data && ultraBroadData.data.length > 0) {
            const foundCompany = ultraBroadData.data[0];
            console.log(`✅ Found "${searchQuery}" with ultra-broad search:`, foundCompany.company_name);
            
            if (onCompanySelect) {
              onCompanySelect(foundCompany);
            } else {
              router.push(`/dashboard/companies/${foundCompany.id}`);
            }
            return;
          }
          
          setSubmitError(`Backend says "${searchQuery}" exists but we couldn't find it in our database. Please try a different search term.`);
        } else {
          setSubmitError(`Failed to analyze "${searchQuery}". Please try again or contact support.`);
        }
      }
      
    } catch (error) {
      console.error(`💥 Unified search error for "${searchQuery}":`, error);
      setSubmitError(`Search failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  const hasResults = companies.length > 0;
  const showResultsCard = showResults && (hasResults || companiesLoading || companiesError);
  
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20 h-12 text-lg"
            disabled={isSubmitting}
          />
          {isSearching && (
            <div className="absolute right-12 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <Button 
            type="submit"
            size="sm"
            className="absolute right-1 top-1 h-10"
            disabled={!searchQuery.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {submitError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
            {submitError}
          </div>
        )}
      </form>
      
      {/* Real-time Search Results */}
      {showResultsCard && (
        <Card>
          <CardContent className="p-4">
            {companiesError ? (
              <div className="text-center py-4">
                <p className="text-red-600 text-sm">
                  Failed to search: {companiesError instanceof Error ? companiesError.message : String(companiesError)}
                </p>
              </div>
            ) : companiesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : hasResults ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {companies.length} companies found
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Real-time results
                  </Badge>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {companies.slice(0, 10).map((company) => {
                    const scoreBreakdown = calculateAIScore(company.analysis_result);
                    const aiScore = scoreBreakdown?.total;
                    
                    return (
                      <div
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{company.company_name}</div>
                          {company.canonical_name && company.canonical_name !== company.company_name && (
                            <div className="text-xs text-muted-foreground truncate">{company.canonical_name}</div>
                          )}
                        </div>
                        {aiScore && (
                          <Badge 
                            variant={getScoreBadgeVariant(aiScore)}
                            className="text-xs font-mono flex-shrink-0"
                          >
                            {formatAIScore(aiScore)}
                          </Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
                {companies.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Showing first 10 results. Type more to refine search.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() ? `No companies found for "${searchQuery}"` : 'Start typing to search companies...'}
                </p>
                {searchQuery.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Enter to analyze this company if it's not in our database
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Async Job Progress Modal */}
      <Dialog open={isJobRunning} onOpenChange={(open) => {
        if (!open) {
          stopJobPolling();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Analysis in Progress
            </DialogTitle>
            <DialogDescription>
              Analyzing <strong>{jobCompanyName}</strong> using advanced AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{jobStatus}</span>
                <span className="font-mono text-xs">{jobProgress}%</span>
              </div>
              <Progress value={jobProgress} className="h-2" />
            </div>
            
            {/* Status Icon and Message */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {jobError ? (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : jobProgress === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                {jobError ? (
                  <div>
                    <p className="text-sm font-medium text-red-600">Analysis Failed</p>
                    <p className="text-xs text-red-500">{jobError}</p>
                  </div>
                ) : jobProgress === 100 ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">Analysis Complete!</p>
                    <p className="text-xs text-muted-foreground">Redirecting to results...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Analyzing {jobCompanyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentJobId && <span className="font-mono">Job ID: {currentJobId.substring(0, 8)}...</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {jobError && (
                <Button variant="outline" size="sm" onClick={stopJobPolling}>
                  Close
                </Button>
              )}
              {!jobError && jobProgress < 100 && (
                <Button variant="outline" size="sm" onClick={stopJobPolling}>
                  Cancel Analysis
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}