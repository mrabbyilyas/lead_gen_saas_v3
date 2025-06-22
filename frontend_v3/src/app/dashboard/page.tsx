"use client";

import { useState } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Search, TrendingUp, Users, DollarSign, BarChart3, Loader2, ArrowUpRight, Filter, Download, Eye, RefreshCw, FileText, FileJson, BarChart } from "lucide-react";
import { useCompanies, useDashboardStats, useDebounce } from "@/hooks/use-company-data";
import { api } from "@/lib/api";
import { SystemStatusIndicator } from "@/components/system-status";
import { exportToCSV, exportToJSON, exportSummaryStats } from "@/lib/export";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // Use debounced search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Fetch real data from database
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies(
    debouncedSearchQuery.trim() ? debouncedSearchQuery : undefined, 
    20
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    
    try {
      // Try to use real backend API for company search
      const result = await api.searchCompany({ company_name: searchQuery.trim() });
      
      // Check if it's a successful response or not found
      if ('error' in result) {
        // Company not found response
        setSearchResult({
          company_name: searchQuery,
          error: result.error,
          message: result.message,
          suggestions: result.suggestions || [],
          status: "not_found"
        });
      } else {
        // Successful analysis response
        setSearchResult({
          company_name: result.company_name,
          canonical_name: result.canonical_name,
          analysis_result: result.analysis_result,
          status: result.status,
          created_at: result.created_at,
          id: result.id
        });
      }
      
    } catch (error) {
      console.error("Company search error:", error);
      
      // Fallback to demo mode for development
      setSearchResult({
        company_name: searchQuery,
        analysis: "Demo analysis - Backend API not available. This is a placeholder result for development.",
        status: "demo_mode",
        message: "Using demo mode - backend API not connected"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Format stats for display
  const formattedStats = stats ? [
    { 
      label: "Total Companies", 
      value: stats.total_companies.toLocaleString(), 
      change: `+${stats.recent_analyses_count}`, 
      changeType: "positive" as const 
    },
    { 
      label: "High Score Leads", 
      value: stats.high_score_leads.toLocaleString(), 
      change: "+23%", 
      changeType: "positive" as const 
    },
    { 
      label: "Average Score", 
      value: stats.average_score.toString(), 
      change: "+0.5", 
      changeType: "positive" as const 
    },
    { 
      label: "Success Rate", 
      value: `${stats.success_rate}%`, 
      change: "+2%", 
      changeType: "positive" as const 
    },
  ] : [];

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    if (companies.length > 0) {
      const filename = debouncedSearchQuery 
        ? `companies_search_${debouncedSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` 
        : 'companies_export';
      exportToCSV(companies, filename);
    }
  };

  const handleExportJSON = () => {
    if (companies.length > 0) {
      const filename = debouncedSearchQuery 
        ? `companies_search_${debouncedSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` 
        : 'companies_export';
      exportToJSON(companies, filename);
    }
  };

  const handleExportSummary = () => {
    if (stats && companies.length > 0) {
      exportSummaryStats(stats, companies, 'summary_report');
    }
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
                <BreadcrumbPage>Company Intelligence</BreadcrumbPage>
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
              <h1 className="text-3xl font-bold tracking-tight">Company Intelligence</h1>
              <p className="text-muted-foreground">
                Analyze companies with AI-powered insights and lead scoring
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  refetchStats();
                  window.location.reload(); // Refresh companies data
                }}
                disabled={statsLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={companies.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportSummary} disabled={!stats}>
                    <BarChart className="mr-2 h-4 w-4" />
                    Export Summary Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Companies
              </CardTitle>
              <CardDescription>
                Enter a company name to generate AI-powered analysis and intelligence reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter company name (e.g., Apple, Microsoft, Tesla...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isSearching && (
                <div className="mt-4 text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing company data with AI...
                  </p>
                </div>
              )}
              
              {searchResult && !isSearching && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">{searchResult.company_name}</h4>
                  
                  {searchResult.status === "not_found" ? (
                    <>
                      <Badge variant="destructive" className="mb-2">Company Not Found</Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        {searchResult.message}
                      </p>
                      {searchResult.suggestions && searchResult.suggestions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-2">Did you mean:</p>
                          <div className="flex flex-wrap gap-2">
                            {searchResult.suggestions.map((suggestion, index) => (
                              <Button 
                                key={index} 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchQuery(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : searchResult.status === "demo_mode" ? (
                    <>
                      <Badge variant="secondary" className="mb-2">Demo Mode</Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        {searchResult.message || "Demo analysis result - backend API not connected"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge variant="default" className="mb-2">
                        {searchResult.status === "completed" ? "Analysis Complete" : searchResult.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        AI analysis completed successfully. View comprehensive report with financial metrics, 
                        market position, and lead scoring.
                      </p>
                      {searchResult.canonical_name && searchResult.canonical_name !== searchResult.company_name && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Also known as: {searchResult.canonical_name}
                        </p>
                      )}
                    </>
                  )}
                  
                  {searchResult.status !== "not_found" && (
                    <Button size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Analysis
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              // Loading skeleton
              [...Array(4)].map((_, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : statsError ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-red-600">Failed to load statistics: {statsError}</p>
                </CardContent>
              </Card>
            ) : (
              formattedStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} recent
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Company Data Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {debouncedSearchQuery ? `Search Results for "${debouncedSearchQuery}"` : 'Recent Company Analyses'}
                  </CardTitle>
                  <CardDescription>
                    {companiesLoading 
                      ? 'Loading company data...' 
                      : `${companies.length} companies found - Comprehensive intelligence reports with AI-powered scoring`
                    }
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
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
                      <TableHead>Industry</TableHead>
                      <TableHead>Revenue Range</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
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
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                          <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded"></div></TableCell>
                        </TableRow>
                      ))
                    ) : companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {debouncedSearchQuery ? 'No companies found matching your search.' : 'No company data available.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
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
                            {company.industry ? (
                              <Badge variant="secondary" className="text-xs">
                                {company.industry}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {company.revenue_range || '-'}
                          </TableCell>
                          <TableCell>
                            {company.score ? (
                              <Badge 
                                variant={company.score >= 8 ? "default" : company.score >= 6 ? "secondary" : "destructive"}
                                className="font-mono"
                              >
                                {company.score.toFixed(1)}/10
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
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
                            <Button variant="ghost" size="sm" title="View Analysis">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
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
