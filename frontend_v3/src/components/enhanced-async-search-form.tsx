// Enhanced async search form with direct database check
// This prevents unnecessary API calls by checking database first

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database,
  Zap,
  StopCircle,
  RefreshCw
} from "lucide-react";
import { 
  useEnhancedAsyncCompanySearch, 
  getElapsedTime, 
  getEstimatedTimeRemaining,
  type EnhancedAsyncSearchState 
} from "@/hooks/use-enhanced-async-search";
import type { EnhancedCompanyAnalysis } from "@/hooks/use-direct-company-data";

interface EnhancedAsyncSearchFormProps {
  onSearchComplete?: (result: EnhancedCompanyAnalysis) => void;
  onSearchStart?: () => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedAsyncSearchForm({
  onSearchComplete,
  onSearchStart,
  placeholder = "Enter company name (e.g., Apple, Microsoft, Tesla...)",
  className = ""
}: EnhancedAsyncSearchFormProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchState, searchActions] = useEnhancedAsyncCompanySearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const companyName = searchInput.trim();
    if (!companyName) return;

    if (onSearchStart) {
      onSearchStart();
    }

    try {
      await searchActions.startSearch(companyName);
    } catch (error) {
      console.error('Search submission error:', error);
    }
  };

  const handleComplete = (result: EnhancedCompanyAnalysis) => {
    if (onSearchComplete) {
      onSearchComplete(result);
    }
  };

  // Handle search completion
  if (searchState.result && !searchState.isSearching && searchState.status === 'completed') {
    // Auto-trigger completion callback
    setTimeout(() => handleComplete(searchState.result!), 100);
  }

  const getProgressPercentage = (): number => {
    if (searchState.foundExisting) return 100;
    if (searchState.result) return 100;
    if (searchState.error) return 0;
    if (searchState.status === 'completed') return 100;
    if (searchState.status === 'processing') return 60;
    if (searchState.status === 'pending') return 20;
    if (searchState.isSearching) return 10;
    return 0;
  };

  const getStatusIcon = () => {
    if (searchState.foundExisting) {
      return <Database className="h-4 w-4 text-blue-600" />;
    }
    if (searchState.result && searchState.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (searchState.error) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (searchState.isSearching) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
    }
    return <Sparkles className="h-4 w-4 text-purple-600" />;
  };

  const getStatusMessage = () => {
    if (searchState.foundExisting) {
      return "Found existing analysis in database";
    }
    return searchState.progress || "Enter a company name to start AI analysis";
  };

  const getDataSourceBadge = () => {
    if (searchState.foundExisting) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
          <Database className="h-3 w-3" />
          Database
        </Badge>
      );
    }
    if (searchState.isSearching && !searchState.foundExisting) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI Analysis
        </Badge>
      );
    }
    if (searchState.result && !searchState.foundExisting) {
      return (
        <Badge variant="default" className="gap-1 bg-purple-600 hover:bg-purple-700">
          <Sparkles className="h-3 w-3" />
          AI Generated
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>AI-Powered Company Search</CardTitle>
            </div>
            {getDataSourceBadge()}
          </div>
          <CardDescription>
            Search for companies with intelligent database lookup and AI analysis fallback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={searchState.isSearching}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={searchState.isSearching || !searchInput.trim()}
              className="gap-2"
            >
              {searchState.isSearching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            {searchState.isSearching && (
              <Button 
                type="button" 
                variant="outline"
                onClick={searchActions.cancelSearch}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </form>

          {/* Progress and Status */}
          {(searchState.isSearching || searchState.result || searchState.error) && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="font-medium">{getStatusMessage()}</span>
                  </div>
                  {searchState.startTime && searchState.isSearching && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getElapsedTime(searchState.startTime)}
                    </div>
                  )}
                </div>
                <Progress value={getProgressPercentage()} className="w-full" />
              </div>

              {/* Time Estimation */}
              {searchState.isSearching && searchState.estimatedCompletion && !searchState.foundExisting && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getEstimatedTimeRemaining(searchState.startTime, searchState.estimatedCompletion)}
                </div>
              )}

              {/* Success Result */}
              {searchState.result && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-medium mb-1">
                      Analysis completed for {searchState.result.company_name}
                    </div>
                    <div className="text-sm space-y-1">
                      {searchState.foundExisting ? (
                        <p>✅ Found existing analysis in database (instant result)</p>
                      ) : (
                        <p>✅ New AI analysis generated and saved to database</p>
                      )}
                      <p>🎯 AI Score: {searchState.result.formatted_ai_score}</p>
                      {searchState.result.industry && (
                        <p>🏢 Industry: {searchState.result.industry}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error State */}
              {searchState.error && (
                <Alert className="border-red-500 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium mb-1">Search Failed</div>
                    <p className="text-sm">{searchState.error}</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              {(searchState.result || searchState.error) && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={searchActions.clearResults}
                    className="gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Search Another
                  </Button>
                  {searchState.result && (
                    <Button 
                      size="sm"
                      onClick={() => handleComplete(searchState.result!)}
                      className="gap-2"
                    >
                      <Zap className="h-3 w-3" />
                      View Analysis
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!searchState.isSearching && !searchState.result && !searchState.error && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>💡 Search intelligently checks database first for instant results</p>
              <p>🤖 New companies trigger AI analysis using Google Gemini</p>
              <p>⚡ Existing analyses are retrieved instantly from PostgreSQL</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}