"use client";

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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Building2, Users, BarChart3, Globe, RefreshCw, Download } from "lucide-react";
import { useCompanies, useDashboardStats } from "@/hooks/use-company-data";
import { SystemStatusIndicator } from "@/components/system-status";

export default function MarketPage() {
  // Fetch companies data for market analysis
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies(undefined, 200);
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats();

  // Calculate market insights
  const getMarketInsights = () => {
    if (!companies.length) return null;

    // Industry analysis
    const industryStats = companies.reduce((acc, company) => {
      const industry = company.industry || 'Other';
      if (!acc[industry]) {
        acc[industry] = { count: 0, totalScore: 0, scoredCount: 0 };
      }
      acc[industry].count++;
      if (company.score && company.score > 0) {
        acc[industry].totalScore += company.score;
        acc[industry].scoredCount++;
      }
      return acc;
    }, {} as Record<string, { count: number; totalScore: number; scoredCount: number }>);

    // Calculate average scores by industry
    const industryAnalysis = Object.entries(industryStats)
      .map(([industry, stats]) => ({
        industry,
        companyCount: stats.count,
        averageScore: stats.scoredCount > 0 ? stats.totalScore / stats.scoredCount : 0,
        marketShare: (stats.count / companies.length) * 100
      }))
      .sort((a, b) => b.companyCount - a.companyCount);

    // Revenue range analysis
    const revenueStats = companies.reduce((acc, company) => {
      const revenue = company.revenue_range || 'Not specified';
      acc[revenue] = (acc[revenue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const revenueAnalysis = Object.entries(revenueStats)
      .map(([range, count]) => ({
        range,
        count,
        percentage: (count / companies.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Score trends (simulated trend data)
    const scoredCompanies = companies.filter(c => c.score && c.score > 0);
    const highQualityLeads = scoredCompanies.filter(c => c.score >= 8).length;
    const mediumQualityLeads = scoredCompanies.filter(c => c.score >= 6 && c.score < 8).length;

    return {
      industryAnalysis: industryAnalysis.slice(0, 10), // Top 10 industries
      revenueAnalysis,
      totalCompanies: companies.length,
      scoredCompanies: scoredCompanies.length,
      averageMarketScore: scoredCompanies.length > 0 
        ? scoredCompanies.reduce((sum, c) => sum + c.score, 0) / scoredCompanies.length
        : 0,
      highQualityLeads,
      mediumQualityLeads,
      marketTrends: {
        growthRate: 15.3, // Simulated
        competitionIndex: 7.2, // Simulated
        opportunityScore: 8.1 // Simulated
      }
    };
  };

  const marketData = getMarketInsights();

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
                <BreadcrumbPage>Market Insights</BreadcrumbPage>
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
                <TrendingUp className="h-8 w-8" />
                Market Insights
              </h1>
              <p className="text-muted-foreground">
                Comprehensive market analysis and industry trends from AI-powered company intelligence
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  refetchStats();
                  window.location.reload();
                }}
                disabled={statsLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Market Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Size</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData?.totalCompanies?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total companies analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData?.averageMarketScore?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Average across all sectors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{marketData?.marketTrends?.growthRate || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Month-over-month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunity Score</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {marketData?.marketTrends?.opportunityScore || '0.0'}/10
                </div>
                <p className="text-xs text-muted-foreground">
                  Market opportunity index
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Industry Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Industry Breakdown</CardTitle>
                <CardDescription>
                  Market share and performance by industry sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companiesError ? (
                  <p className="text-red-600">Failed to load market data: {companiesError}</p>
                ) : companiesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : marketData?.industryAnalysis ? (
                  <div className="space-y-4">
                    {marketData.industryAnalysis.map((industry, index) => (
                      <div key={industry.industry} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{
                            backgroundColor: `hsl(${(index * 45) % 360}, 70%, 50%)`
                          }}></div>
                          <div>
                            <div className="font-medium">{industry.industry}</div>
                            <div className="text-xs text-muted-foreground">
                              Avg Score: {industry.averageScore.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{industry.companyCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {industry.marketShare.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No industry data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>
                  Company distribution by revenue ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketData?.revenueAnalysis ? (
                  <div className="space-y-4">
                    {marketData.revenueAnalysis.slice(0, 6).map((revenue, index) => (
                      <div key={revenue.range} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium">{revenue.range}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{revenue.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {revenue.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading revenue data...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Market Trends & Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Market Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators and market trends analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium">High-Quality Leads</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {marketData?.highQualityLeads || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Companies with score ≥ 8.0
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {marketData && marketData.scoredCompanies > 0 
                        ? ((marketData.highQualityLeads / marketData.scoredCompanies) * 100).toFixed(1)
                        : '0'}% of market
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Market Coverage</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {marketData?.scoredCompanies || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Companies with AI analysis
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {marketData && marketData.totalCompanies > 0 
                        ? ((marketData.scoredCompanies / marketData.totalCompanies) * 100).toFixed(1)
                        : '0'}% analyzed
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Competition Index</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {marketData?.marketTrends?.competitionIndex || '0.0'}/10
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Market competition level
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Moderate
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Industries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Performance Ranking</CardTitle>
              <CardDescription>
                Industries ranked by average AI score and market potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Companies</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketData?.industryAnalysis ? (
                    marketData.industryAnalysis.slice(0, 8).map((industry, index) => (
                      <TableRow key={industry.industry}>
                        <TableCell>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{industry.industry}</TableCell>
                        <TableCell>{industry.companyCount}</TableCell>
                        <TableCell>{industry.marketShare.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge 
                            variant={industry.averageScore >= 7 ? "default" : industry.averageScore >= 5 ? "secondary" : "destructive"}
                            className="font-mono"
                          >
                            {industry.averageScore.toFixed(1)}/10
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {industry.averageScore >= 7 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-sm">Strong</span>
                            </div>
                          ) : industry.averageScore >= 5 ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <BarChart3 className="h-4 w-4" />
                              <span className="text-sm">Moderate</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                              <span className="text-sm">Weak</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading industry performance data...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}