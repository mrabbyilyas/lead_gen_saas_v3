import { useState, useEffect, useRef } from "react";
import { Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AsyncProgress } from "@/components/ui/async-progress";
import { useAsyncCompanySearch, getElapsedTime, getEstimatedTimeRemaining } from "@/hooks/use-async-company-search";

interface AsyncSearchFormProps {
  onSearchComplete?: (result: any) => void;
  onSearchStart?: () => void;
  className?: string;
}

export function AsyncSearchForm({ 
  onSearchComplete, 
  onSearchStart,
  className 
}: AsyncSearchFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, searchActions] = useAsyncCompanySearch();
  const hasCalledComplete = useRef(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const query = searchQuery.trim();
    if (!query) return;

    try {
      hasCalledComplete.current = false; // Reset completion flag
      onSearchStart?.();
      await searchActions.startSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Call onSearchComplete when result is available (in useEffect to avoid render issues)
  useEffect(() => {
    if (searchState.result && onSearchComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onSearchComplete(searchState.result);
    }
  }, [searchState.result, onSearchComplete]);

  const isSearchDisabled = searchState.isSearching || !searchQuery.trim();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI-Powered Company Analysis
        </CardTitle>
        <CardDescription>
          Search for any company to get instant AI-powered analysis with detailed insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter company name (e.g., Apple, Microsoft, Tesla...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            disabled={searchState.isSearching}
          />
          <Button 
            type="submit" 
            disabled={isSearchDisabled}
            className="min-w-[100px]"
          >
            {searchState.isSearching ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </form>

        {/* Progress Indicator */}
        <AsyncProgress
          isActive={searchState.isSearching}
          status={searchState.status}
          progress={searchState.progress}
          error={searchState.error}
          elapsedTime={getElapsedTime(searchState.startTime)}
          estimatedRemaining={getEstimatedTimeRemaining(
            searchState.startTime,
            searchState.estimatedCompletion
          )}
          onCancel={searchActions.cancelSearch}
        />

        {/* Results Summary */}
        {searchState.result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Found detailed analysis for <strong>{searchState.result.canonical_name || searchState.result.company_name}</strong>
            </p>
            <div className="mt-2 flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = `/dashboard/companies/${searchState.result!.id}`}
              >
                View Full Analysis
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={searchActions.clearResults}
              >
                Search Another Company
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!searchState.isSearching && !searchState.result && !searchState.error && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Search starts instantly with no timeouts</li>
              <li>• AI analysis typically takes 2-5 minutes</li>
              <li>• Get real-time progress updates</li>
              <li>• View comprehensive company insights</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}