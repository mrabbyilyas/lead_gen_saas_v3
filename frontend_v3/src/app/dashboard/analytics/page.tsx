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
import { BarChart3, TrendingUp, TrendingDown, Users, Building2, Target, ArrowUpRight, RefreshCw, Download } from "lucide-react";
import { useDashboardStats, useCompanies } from "@/hooks/use-company-data";
import { SystemStatusIndicator } from "@/components/system-status";
import { calculateAIScore } from "@/lib/ai-score";

export default function AnalyticsPage() {
  // Fetch dashboard statistics and company data
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { companies, loading: companiesLoading } = useCompanies(undefined, 100);

  // Calculate additional analytics using centralized AI scoring
  const getAnalytics = () => {
    if (!companies.length) return null;

    // Calculate AI scores for all companies using centralized system
    const companiesWithScores = companies.map((company: any) => {
      const aiScore = calculateAIScore(company.analysis_result);
      return {
        ...company,
        calculatedScore: aiScore.total,
        hasValidScore: aiScore.hasData && aiScore.total > 0
      };
    });

    const scoredCompanies = companiesWithScores.filter((c: any) => c.hasValidScore);
    const highScoreCount = scoredCompanies.filter((c: any) => c.calculatedScore >= 8).length;
    const mediumScoreCount = scoredCompanies.filter((c: any) => c.calculatedScore >= 6 && c.calculatedScore < 8).length;
    const lowScoreCount = scoredCompanies.filter((c: any) => c.calculatedScore < 6).length;
    
    const industries = companies.reduce((acc, company) => {
      if (company.industry && company.industry !== 'Technology') {
        acc[company.industry] = (acc[company.industry] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topIndustries = Object.entries(industries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      scoredCompanies: scoredCompanies.length,
      highScoreCount,
      mediumScoreCount,
      lowScoreCount,
      industries: topIndustries,
      averageScore: scoredCompanies.length > 0 
        ? scoredCompanies.reduce((sum, c) => sum + c.calculatedScore, 0) / scoredCompanies.length 
        : 0,
      completionRate: companies.length > 0 
        ? (companies.filter(c => c.status === 'completed').length / companies.length * 100)
        : 0
    };
  };

  const analytics = getAnalytics();

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
                <BreadcrumbPage>Analytics</BreadcrumbPage>
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
                <BarChart3 className="h-8 w-8" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive analytics and insights from company intelligence data
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

          {/* Main Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.total_companies?.toLocaleString() || companies.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.recent_analyses_count || 0} recent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High-Quality Leads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.high_score_leads?.toLocaleString() || analytics?.highScoreCount || 0}
                </div>
                <p className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Score ≥ 8.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.average_score || analytics?.averageScore?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of 10.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${stats?.success_rate || analytics?.completionRate?.toFixed(0) || 0}%`}
                </div>
                <p className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Successful analyses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  Distribution of AI scores across analyzed companies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-sm">High Score (8.0-10.0)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{analytics.highScoreCount}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {analytics.scoredCompanies > 0 ? ((analytics.highScoreCount / analytics.scoredCompanies) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Medium Score (6.0-7.9)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{analytics.mediumScoreCount}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {analytics.scoredCompanies > 0 ? ((analytics.mediumScoreCount / analytics.scoredCompanies) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-sm">Low Score (0.0-5.9)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{analytics.lowScoreCount}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {analytics.scoredCompanies > 0 ? ((analytics.lowScoreCount / analytics.scoredCompanies) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Total Scored Companies:</span>
                        <span className="font-medium">{analytics.scoredCompanies}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Loading score distribution...</p>
                )}
              </CardContent>
            </Card>

            {/* Industry Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Analysis</CardTitle>
                <CardDescription>
                  Top industries in the analyzed company database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics && analytics.industries.length > 0 ? (
                  <>
                    {analytics.industries.map(([industry, count], index) => (
                      <div key={industry} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded" style={{opacity: 1 - (index * 0.2)}}></div>
                          <span className="text-sm">{industry}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {((count / companies.length) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Other Industries:</span>
                        <span className="font-medium">
                          {companies.length - analytics.industries.reduce((sum, [,count]) => sum + count, 0)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No industry data available yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Key performance indicators and trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Analysis Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.completionRate?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Companies with completed analysis
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Lead Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics && analytics.scoredCompanies > 0 
                      ? ((analytics.highScoreCount / analytics.scoredCompanies) * 100).toFixed(1)
                      : '0.0'
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    High-quality leads (score ≥ 8.0)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Database Growth</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    +{stats?.recent_analyses_count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recent additions to database
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}