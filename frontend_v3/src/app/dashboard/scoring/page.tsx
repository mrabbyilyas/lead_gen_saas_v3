"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingUp, Filter, Search, Building2, Eye, Award, Star } from "lucide-react";
import { useCompanies, useDebounce } from "@/hooks/use-company-data";
import { SystemStatusIndicator } from "@/components/system-status";
import { calculateAIScore, formatAIScore, getScoreBadgeVariant } from "@/lib/ai-score";

export default function ScoringPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState([0]);
  const [maxScore, setMaxScore] = useState([10]);
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  
  // Use debounced search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Fetch companies data
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies(
    debouncedSearchQuery.trim() ? debouncedSearchQuery : undefined, 
    100
  );

  // Parse analysis result for display - using correct paths from individual company page
  const getAnalysisData = (analysisResult: any) => {
    if (!analysisResult || typeof analysisResult !== 'object') {
      return null;
    }
    
    return {
      industry: analysisResult?.company_basic_info?.industry_primary || null,
      revenueRange: analysisResult?.company_basic_info?.revenue_estimate || null,
      diversityScore: analysisResult.diversity_score || 0
    };
  };

  // Filter and sort companies based on scoring criteria
  const getFilteredCompanies = () => {
    let filtered = companies.filter(company => {
      const scoreBreakdown = calculateAIScore(company.analysis_result);
      const score = scoreBreakdown?.total || 0;
      const analysisData = getAnalysisData(company.analysis_result);
      
      const matchesScore = score >= minScore[0] && score <= maxScore[0];
      const matchesIndustry = !industryFilter || industryFilter === "all" || analysisData?.industry === industryFilter;
      return matchesScore && matchesIndustry;
    });

    // Sort companies
    filtered.sort((a, b) => {
      if (sortBy === "score") {
        const scoreA = calculateAIScore(a.analysis_result)?.total || 0;
        const scoreB = calculateAIScore(b.analysis_result)?.total || 0;
        return scoreB - scoreA;
      } else if (sortBy === "name") {
        return a.company_name.localeCompare(b.company_name);
      } else if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return filtered;
  };

  const filteredCompanies = getFilteredCompanies();

  // Get unique industries for filter
  const getIndustries = () => {
    const industries = companies
      .map(c => c.industry)
      .filter(Boolean)
      .filter(industry => industry !== 'Technology') // Exclude default fallback
    return [...new Set(industries)];
  };

  // Get score distribution
  const getScoreDistribution = () => {
    const scoredCompanies = companies.filter(c => c.score && c.score > 0);
    return {
      excellent: scoredCompanies.filter(c => c.score >= 9).length,
      good: scoredCompanies.filter(c => c.score >= 7 && c.score < 9).length,
      average: scoredCompanies.filter(c => c.score >= 5 && c.score < 7).length,
      poor: scoredCompanies.filter(c => c.score < 5).length,
      total: scoredCompanies.length
    };
  };

  const scoreDistribution = getScoreDistribution();

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // View company details
  const handleViewCompany = (companyId: number) => {
    router.push(`/dashboard/companies/${companyId}`);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Lead Scoring</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 space-y-6 p-6">
          {/* System Status */}
          <SystemStatusIndicator />

          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Target className="h-8 w-8" />
                Lead Scoring
              </h1>
              <p className="text-muted-foreground">
                Advanced lead scoring and qualification using AI-powered analysis
              </p>
            </div>
          </div>

          {/* Score Distribution Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Excellent Leads</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{scoreDistribution.excellent}</div>
                <p className="text-xs text-muted-foreground">
                  Score 9.0-10.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Good Leads</CardTitle>
                <Star className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{scoreDistribution.good}</div>
                <p className="text-xs text-muted-foreground">
                  Score 7.0-8.9
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{scoreDistribution.average}</div>
                <p className="text-xs text-muted-foreground">
                  Score 5.0-6.9
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scored</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scoreDistribution.total}</div>
                <p className="text-xs text-muted-foreground">
                  Analyzed companies
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Lead Filters & Search
              </CardTitle>
              <CardDescription>
                Filter and search companies by score range, industry, and other criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Companies</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Company name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Score Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Score Range: {minScore[0]} - {maxScore[0]}
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Min: {minScore[0]}</span>
                      <Slider
                        value={minScore}
                        onValueChange={setMinScore}
                        max={10}
                        min={0}
                        step={0.1}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Max: {maxScore[0]}</span>
                      <Slider
                        value={maxScore}
                        onValueChange={setMaxScore}
                        max={10}
                        min={0}
                        step={0.1}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Industry Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All industries</SelectItem>
                      {getIndustries().map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Highest Score</SelectItem>
                      <SelectItem value="name">Company Name</SelectItem>
                      <SelectItem value="date">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Badge variant="outline">
                  {filteredCompanies.length} companies match your criteria
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery("");
                    setMinScore([0]);
                    setMaxScore([10]);
                    setIndustryFilter("all");
                    setSortBy("score");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scored Companies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Results</CardTitle>
              <CardDescription>
                Companies ranked by AI-powered lead scoring algorithm
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companiesError ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-red-600">Failed to load companies: {companiesError}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Lead Score</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Revenue Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Analysis Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companiesLoading ? (
                      // Loading skeleton rows
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded"></div></TableCell>
                        </TableRow>
                      ))
                    ) : filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No companies match your scoring criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies.map((company, index) => {
                        const analysisData = getAnalysisData(company.analysis_result);
                        const scoreBreakdown = calculateAIScore(company.analysis_result);
                        const aiScore = scoreBreakdown?.total;
                        
                        return (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{company.company_name}</div>
                                  {company.canonical_name && company.canonical_name !== company.company_name && (
                                    <div className="text-xs text-muted-foreground">{company.canonical_name}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {aiScore ? (
                                  <>
                                    <Badge 
                                      variant={getScoreBadgeVariant(aiScore)}
                                      className="font-mono"
                                    >
                                      {formatAIScore(aiScore)}
                                    </Badge>
                                    {index < 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        #{index + 1}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Not scored</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {analysisData?.industry ? (
                                <Badge variant="secondary" className="text-xs">
                                  {analysisData.industry}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {analysisData?.revenueRange || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={company.status === 'completed' ? "outline" : "secondary"}
                                className={company.status === 'completed' ? "text-green-600 border-green-600" : ""}
                              >
                                {company.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(company.created_at.toString())}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="View Full Analysis"
                                onClick={() => handleViewCompany(company.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}