"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, ArrowRight, Loader2 } from "lucide-react";
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
        
        // Navigate to a results page or show progress
        // For now, let's redirect to the dashboard companies page
        router.push('/dashboard/companies');
        
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
    </div>
  );
}