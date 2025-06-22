"use client";

import { useParams, useRouter } from "next/navigation";
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
import { Building2, ArrowLeft, Download, FileText, Calendar, Target, TrendingUp, Loader2, Award, Star, Users } from "lucide-react";
import { useCompany } from "@/hooks/use-company-data";
import { SystemStatusIndicator } from "@/components/system-status";
import { calculateAIScore, formatAIScore, getScoreColor, getScoreBadgeVariant } from "@/lib/ai-score";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);
  
  // Fetch individual company data
  const { company, loading, error } = useCompany(companyId);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse analysis result for display
  const getAnalysisData = (analysisResult: any) => {
    if (!analysisResult || typeof analysisResult !== 'object') {
      return null;
    }
    
    return {
      diversityScore: analysisResult.diversity_score || 0,
      communityInvestment: analysisResult.community_investment || 0,
      industry: analysisResult.industry || 'Not specified',
      revenueRange: analysisResult.revenue_range || 'Not specified',
      marketPosition: analysisResult.market_position || 'Not analyzed',
      riskAssessment: analysisResult.risk_assessment || 'Not analyzed',
      growthPotential: analysisResult.growth_potential || 'Not analyzed',
      competitiveAdvantage: analysisResult.competitive_advantage || 'Not analyzed'
    };
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Loading Company Analysis</h2>
              <p className="text-muted-foreground">Please wait while we fetch the company details...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !company) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Company Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'The requested company could not be found.'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const analysisData = getAnalysisData(company.analysis_result);

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/companies">Companies</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{company.canonical_name || company.company_name}</BreadcrumbPage>
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
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                {company.canonical_name || company.company_name}
              </h1>
              {company.canonical_name && company.canonical_name !== company.company_name && (
                <p className="text-lg text-muted-foreground">
                  Searched as: {company.company_name}
                </p>
              )}
              <p className="text-muted-foreground">
                Comprehensive AI-powered company analysis and intelligence report
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const scoreBreakdown = calculateAIScore(company.analysis_result);
                    return formatAIScore(scoreBreakdown.total);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Composite AI analysis score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.status === 'completed' ? 'Success' : company.status}
                </div>
                <p className="text-xs text-green-600">
                  {company.status === 'completed' ? 'Analysis completed' : 'Analysis status'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Industry</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.analysis_result?.company_basic_info?.industry_primary || 
                   analysisData?.industry || 
                   company.industry || 
                   'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Primary sector
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.analysis_result?.company_basic_info?.revenue_estimate || 
                   analysisData?.revenueRange || 
                   company.revenue_range || 
                   'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current estimate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Score Breakdown */}
          {company.analysis_result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI Score Breakdown
                </CardTitle>
                <CardDescription>Detailed breakdown of the AI-powered analysis score</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const scoreBreakdown = calculateAIScore(company.analysis_result);
                  
                  // For simple scores (like diversity), show a different breakdown
                  if (scoreBreakdown.isSimpleScore) {
                    return (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <div className="text-4xl font-bold text-blue-600">
                            {formatAIScore(scoreBreakdown.total)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {scoreBreakdown.simpleScoreType === 'diversity' ? 'Diversity-based AI Score' : 'Simple AI Score'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          This score is based on a single metric and doesn't have component breakdown.
                        </div>
                      </div>
                    );
                  }
                  
                  // For composite scores, show the full breakdown
                  const availableComponents = [
                    scoreBreakdown.financial > 0 ? 'financial' : null,
                    scoreBreakdown.market > 0 ? 'market' : null,
                    scoreBreakdown.innovation > 0 ? 'innovation' : null,
                    scoreBreakdown.esg > 0 ? 'esg' : null,
                    scoreBreakdown.moat > 0 ? 'moat' : null
                  ].filter(Boolean);
                  
                  const gridCols = availableComponents.length === 1 ? 'grid-cols-1' :
                                   availableComponents.length === 2 ? 'md:grid-cols-2' :
                                   availableComponents.length === 3 ? 'md:grid-cols-3' :
                                   availableComponents.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                                   'md:grid-cols-2 lg:grid-cols-5';
                  
                  return (
                    <>
                      <div className={`grid gap-4 ${gridCols} place-items-center`}>
                        {/* Financial Health */}
                        {scoreBreakdown.financial > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Financial</span>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {(scoreBreakdown.financial * (10.0 / 3.0)).toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {company.analysis_result?.financial_metrics?.profitability_metrics?.net_profit_margin}% margin
                            </p>
                          </div>
                        )}
                        
                        {/* Market Position */}
                        {scoreBreakdown.market > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Market</span>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {(scoreBreakdown.market * (10.0 / 2.5)).toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {company.analysis_result?.market_competition?.market_data?.current_market_share}% share
                            </p>
                          </div>
                        )}
                        
                        {/* Innovation */}
                        {scoreBreakdown.innovation > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Innovation</span>
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {(scoreBreakdown.innovation * (10.0 / 2.0)).toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {company.analysis_result?.technology_operations?.rd_innovation?.innovation_score}/5 R&D score
                            </p>
                          </div>
                        )}
                        
                        {/* ESG/Sustainability */}
                        {scoreBreakdown.esg > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-green-700" />
                              <span className="text-sm font-medium">ESG</span>
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {(scoreBreakdown.esg * (10.0 / 1.5)).toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {company.analysis_result?.esg_risk?.environmental?.sustainability_score}/100 sustainability
                            </p>
                          </div>
                        )}
                        
                        {/* Competitive Moat */}
                        {scoreBreakdown.moat > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium">Moat</span>
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {(scoreBreakdown.moat * (10.0 / 1.5)).toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {company.analysis_result?.market_competition?.competitive_analysis?.moat_strength}/5 strength
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Composite AI Score:</span>
                          <div className={`text-xl font-bold ${getScoreColor(scoreBreakdown.total)}`}>
                            {formatAIScore(scoreBreakdown.total)}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Analysis Details */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company details and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Company Name:</span>
                  <span>{company.company_name}</span>
                </div>
                {company.canonical_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">Canonical Name:</span>
                    <span>{company.canonical_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Search Query:</span>
                  <span>{company.search_query}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Analysis Date:</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(company.created_at.toString())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Metrics</CardTitle>
                <CardDescription>AI-generated insights and scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisData ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Diversity Score:</span>
                      <Badge variant="outline">{analysisData.diversityScore}/10</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Community Investment:</span>
                      <Badge variant="outline">{analysisData.communityInvestment}/10</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Market Position:</span>
                      <span>{analysisData.marketPosition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Growth Potential:</span>
                      <span>{analysisData.growthPotential}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Risk Assessment:</span>
                      <span>{analysisData.riskAssessment}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No detailed analysis data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Sections */}
          {company.analysis_result && typeof company.analysis_result === 'object' && (
            <>
              {/* Financial Performance */}
              {company.analysis_result.financial_metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Financial Performance
                    </CardTitle>
                    <CardDescription>Key financial metrics and performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3 place-items-center">
                      {company.analysis_result.financial_metrics.revenue_data && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Revenue</h4>
                          <div className="text-2xl font-bold text-green-600">
                            ${(company.analysis_result.financial_metrics.revenue_data.current_year_revenue / 1000000000).toFixed(1)}B
                          </div>
                          <p className="text-xs text-muted-foreground">Current Year</p>
                          {company.analysis_result.financial_metrics.revenue_data.revenue_cagr_5_year && (
                            <p className="text-xs text-green-600">
                              {company.analysis_result.financial_metrics.revenue_data.revenue_cagr_5_year}% CAGR (5Y)
                            </p>
                          )}
                        </div>
                      )}
                      
                      {company.analysis_result.financial_metrics.profitability_metrics && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Profitability</h4>
                          <div className="text-2xl font-bold text-blue-600">
                            {company.analysis_result.financial_metrics.profitability_metrics.net_profit_margin}%
                          </div>
                          <p className="text-xs text-muted-foreground">Net Margin</p>
                          <p className="text-xs text-blue-600">
                            ${(company.analysis_result.financial_metrics.profitability_metrics.net_income / 1000000000).toFixed(1)}B Net Income
                          </p>
                        </div>
                      )}
                      
                      {company.analysis_result.financial_metrics.balance_sheet && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Balance Sheet</h4>
                          <div className="text-2xl font-bold text-purple-600">
                            {company.analysis_result.financial_metrics.balance_sheet.current_ratio}
                          </div>
                          <p className="text-xs text-muted-foreground">Current Ratio</p>
                          <p className="text-xs text-purple-600">
                            ${(company.analysis_result.financial_metrics.balance_sheet.cash_and_equivalents / 1000000000).toFixed(1)}B Cash
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Position & Competition */}
              {company.analysis_result.market_competition && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Market Position & Competition
                    </CardTitle>
                    <CardDescription>Market analysis and competitive landscape</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Market Position Card */}
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium mb-3 text-center">Market Position</h4>
                        <div className="text-center mb-3">
                          <Badge variant="outline" className="mb-2">
                            {company.analysis_result.market_competition.market_data?.market_position || 'Not Available'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Market Share:</span>
                            <span className="font-bold">{company.analysis_result.market_competition.market_data?.current_market_share}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Market Rank:</span>
                            <span className="font-bold">#{company.analysis_result.market_competition.market_data?.market_share_rank}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Growth Rate:</span>
                            <span className="font-bold text-green-600">{company.analysis_result.market_competition.market_data?.market_growth_rate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Competitive Strength Card */}
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium mb-3 text-center">Competitive Strength</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Moat Strength:</span>
                            <Badge variant="outline">{company.analysis_result.market_competition.competitive_analysis?.moat_strength}/5</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Barriers to Entry:</span>
                            <Badge variant="outline">{company.analysis_result.market_competition.competitive_analysis?.barriers_to_entry}/5</Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Competitors Card */}
                      {company.analysis_result.market_competition.competitive_analysis?.direct_competitors && (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <h4 className="font-medium mb-3 text-center">Top Competitors</h4>
                          <div className="space-y-2">
                            {company.analysis_result.market_competition.competitive_analysis.direct_competitors.slice(0, 3).map((competitor: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{competitor.name}</span>
                                <span className="text-muted-foreground">{competitor.market_share}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ESG & Risk Assessment */}
              {company.analysis_result.esg_risk && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      ESG & Risk Assessment
                    </CardTitle>
                    <CardDescription>Environmental, Social, Governance metrics and risk analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3 mb-6">
                      {/* Environmental Card */}
                      {company.analysis_result.esg_risk.environmental && (
                        <div className="p-4 border rounded-lg bg-green-50/50">
                          <h4 className="font-medium text-green-700 mb-3 text-center">Environmental</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span>Sustainability Score:</span>
                              <Badge variant="outline" className="text-green-600">
                                {company.analysis_result.esg_risk.environmental.sustainability_score}/100
                              </Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground">ESG Alignment:</span>
                              <p className="text-xs font-medium">{company.analysis_result.esg_risk.environmental.esg_alignment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Social Card */}
                      {company.analysis_result.esg_risk.social && (
                        <div className="p-4 border rounded-lg bg-blue-50/50">
                          <h4 className="font-medium text-blue-700 mb-3 text-center">Social</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span>Diversity Score:</span>
                              <Badge variant="outline">{company.analysis_result.esg_risk.social.diversity_score}/10</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Community Investment:</span>
                              <Badge variant="outline">{company.analysis_result.esg_risk.social.community_investment}/10</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Governance Card */}
                      {company.analysis_result.esg_risk.governance && (
                        <div className="p-4 border rounded-lg bg-purple-50/50">
                          <h4 className="font-medium text-purple-700 mb-3 text-center">Governance</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span>Governance Score:</span>
                              <Badge variant="outline">{company.analysis_result.esg_risk.governance.governance_score}/100</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Board Independence:</span>
                              <Badge variant="outline">{company.analysis_result.esg_risk.governance.board_independence}/10</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Risk Assessment Section */}
                    {company.analysis_result.esg_risk.risk_assessment && (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium mb-4 text-center">Risk Assessment</h4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Market Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.market_risk === 'Low' ? 'outline' : 'secondary'}>
                              {company.analysis_result.esg_risk.risk_assessment.market_risk}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Financial Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.financial_risk === 'Low' ? 'outline' : 'secondary'}>
                              {company.analysis_result.esg_risk.risk_assessment.financial_risk}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Operational Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.operational_risk === 'Low' ? 'outline' : 'secondary'}>
                              {company.analysis_result.esg_risk.risk_assessment.operational_risk}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Overall Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.overall_risk_level === 'Low' ? 'outline' : 'secondary'}>
                              {company.analysis_result.esg_risk.risk_assessment.overall_risk_level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Business Intelligence */}
              {company.analysis_result.business_intelligence && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Business Intelligence
                    </CardTitle>
                    <CardDescription>Market intelligence and business insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Market Intelligence Sub-box */}
                      {company.analysis_result.business_intelligence.market_intelligence && (
                        <div className="p-4 border rounded-lg bg-blue-50/50">
                          <h4 className="font-medium text-green-700 mb-3 text-center">Market Intelligence</h4>
                          <div className="space-y-4">
                            {company.analysis_result.business_intelligence.market_intelligence.growth_signals && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-green-700">Growth Signals</h5>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {company.analysis_result.business_intelligence.market_intelligence.growth_signals.slice(0, 3).map((signal: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      {signal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="grid gap-2 text-sm">
                              <div className="flex justify-between">
                                <span>Digital Disruption Risk:</span>
                                <Badge variant="outline">{company.analysis_result.business_intelligence.market_intelligence.digital_disruption_risk}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Industry Consolidation:</span>
                                <Badge variant="outline">{company.analysis_result.business_intelligence.market_intelligence.industry_consolidation_trend}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Lead Generation Intelligence Sub-box */}
                      {company.analysis_result.business_intelligence.lead_gen_intelligence && (
                        <div className="p-4 border rounded-lg bg-green-50/50">
                          <h4 className="font-medium text-blue-700 mb-3 text-center">Lead Generation Intelligence</h4>
                          <div className="space-y-4">
                            <div className="grid gap-2 text-sm">
                              <div className="flex justify-between">
                                <span>Website Quality:</span>
                                <Badge variant="outline">{company.analysis_result.business_intelligence.lead_gen_intelligence.website_quality_score}/10</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Social Media Activity:</span>
                                <Badge variant="outline">{company.analysis_result.business_intelligence.lead_gen_intelligence.social_media_activity}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Marketing Sophistication:</span>
                                <Badge variant="outline">{company.analysis_result.business_intelligence.lead_gen_intelligence.marketing_sophistication}</Badge>
                              </div>
                            </div>
                            
                            {company.analysis_result.business_intelligence.lead_gen_intelligence.recommended_approach && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-blue-700">Recommended Approach</h5>
                                <p className="text-sm text-muted-foreground">
                                  {company.analysis_result.business_intelligence.lead_gen_intelligence.recommended_approach}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leadership & Technology */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Leadership */}
                {company.analysis_result.leadership_management && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Leadership & Team
                      </CardTitle>
                      <CardDescription>Executive team and organizational metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {company.analysis_result.leadership_management.executives && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Executive Team</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>CEO:</span>
                                <span className="font-medium">{company.analysis_result.leadership_management.executives.ceo_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>CEO Tenure:</span>
                                <span>{company.analysis_result.leadership_management.executives.ceo_tenure_years} years</span>
                              </div>
                              <div className="flex justify-between">
                                <span>CEO Age:</span>
                                <span>{company.analysis_result.leadership_management.executives.ceo_age}</span>
                              </div>
                            </div>
                          </div>
                          
                          {company.analysis_result.leadership_management.team_metrics && (
                            <div>
                              <h4 className="font-medium mb-2">Team Metrics</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Glassdoor Rating:</span>
                                  <Badge variant="outline">{company.analysis_result.leadership_management.team_metrics.glassdoor_rating}/5.0</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Tenure:</span>
                                  <span>{company.analysis_result.leadership_management.team_metrics.average_tenure_years} years</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Management Stability:</span>
                                  <span className="text-xs">{company.analysis_result.leadership_management.team_metrics.management_stability}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Technology & Innovation */}
                {company.analysis_result.technology_operations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Technology & Innovation
                      </CardTitle>
                      <CardDescription>R&D investment and technology infrastructure</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {company.analysis_result.technology_operations.rd_innovation && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">R&D Investment</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>R&D Spending:</span>
                                <span className="font-medium">${(company.analysis_result.technology_operations.rd_innovation.rd_spending / 1000000000).toFixed(1)}B</span>
                              </div>
                              <div className="flex justify-between">
                                <span>% of Revenue:</span>
                                <span>{company.analysis_result.technology_operations.rd_innovation.rd_percent_revenue}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Patents Held:</span>
                                <span>{company.analysis_result.technology_operations.rd_innovation.patents_held?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Innovation Score:</span>
                                <Badge variant="outline">{company.analysis_result.technology_operations.rd_innovation.innovation_score}/5</Badge>
                              </div>
                            </div>
                          </div>
                          
                          {company.analysis_result.technology_operations.infrastructure && (
                            <div>
                              <h4 className="font-medium mb-2">Infrastructure</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Scalability Score:</span>
                                  <Badge variant="outline">{company.analysis_result.technology_operations.infrastructure.scalability_score}/5</Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Type:</span>
                                  <p className="text-xs mt-1">{company.analysis_result.technology_operations.infrastructure.infrastructure_type}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}