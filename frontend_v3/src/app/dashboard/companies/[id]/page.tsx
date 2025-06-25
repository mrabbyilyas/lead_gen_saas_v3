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
import { useDirectCompany } from "@/hooks/use-direct-company-data";
import { SystemStatusIndicator } from "@/components/system-status";
import { calculateAIScore, formatAIScore, getScoreColor, getScoreBadgeVariant } from "@/lib/ai-score";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);
  
  // Fetch individual company data using direct database access
  const { data: company, isLoading: loading, error } = useDirectCompany(companyId);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.formatted_ai_score || 'N/A'}
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
                  // Use pre-calculated AI score breakdown from enhanced company data
                  const scoreBreakdown = company.ai_score_breakdown || calculateAIScore(company.analysis_result);
                  
                  // For simple scores (like diversity), show a different breakdown
                  if (scoreBreakdown.isSimpleScore) {
                    return (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <div className="text-4xl font-bold text-blue-600 break-words">
                            {company.formatted_ai_score || formatAIScore(scoreBreakdown.total)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 break-words">
                            {scoreBreakdown.simpleScoreType === 'diversity' ? 'Diversity-based AI Score' : 'Simple AI Score'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground break-words leading-relaxed">
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
                              {scoreBreakdown.financial.toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
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
                              {scoreBreakdown.market.toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
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
                              {scoreBreakdown.innovation.toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
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
                              {scoreBreakdown.esg.toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
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
                              {scoreBreakdown.moat.toFixed(1)}/10.0
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
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
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company details and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 overflow-hidden">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-nowrap">Company Name:</span>
                  <span className="break-words text-right ml-auto max-w-[60%]">{company.company_name}</span>
                </div>
                {company.canonical_name && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-medium text-nowrap">Canonical Name:</span>
                    <span className="break-words text-right ml-auto max-w-[60%]">{company.canonical_name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-nowrap">Search Query:</span>
                  <span className="break-words text-right ml-auto max-w-[60%]">{company.search_query}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-nowrap">Analysis Date:</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm break-words">{formatDate(company.created_at.toString())}</span>
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
              <CardContent className="space-y-4 p-6 overflow-hidden">
                {analysisData ? (
                  <>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-nowrap">Diversity Score:</span>
                      <Badge variant="outline" className="ml-auto">{analysisData.diversityScore}/10</Badge>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-nowrap">Community Investment:</span>
                      <Badge variant="outline" className="ml-auto">{analysisData.communityInvestment}/10</Badge>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-nowrap">Market Position:</span>
                      <span className="break-words text-right ml-auto max-w-[60%]">{analysisData.marketPosition}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-nowrap">Growth Potential:</span>
                      <span className="break-words text-right ml-auto max-w-[60%]">{analysisData.growthPotential}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-nowrap">Risk Assessment:</span>
                      <span className="break-words text-right ml-auto max-w-[60%]">{analysisData.riskAssessment}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground break-words">No detailed analysis data available</p>
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 place-items-center">
                      {company.analysis_result.financial_metrics.revenue_data && (
                        <div className="space-y-2 text-center max-w-full">
                          <h4 className="font-medium text-sm">Revenue</h4>
                          <div className="text-2xl font-bold text-green-600 break-words">
                            ${(company.analysis_result.financial_metrics.revenue_data.current_year_revenue / 1000000000).toFixed(1)}B
                          </div>
                          <p className="text-xs text-muted-foreground">Current Year</p>
                          {company.analysis_result.financial_metrics.revenue_data.revenue_cagr_5_year && (
                            <p className="text-xs text-green-600 break-words">
                              {company.analysis_result.financial_metrics.revenue_data.revenue_cagr_5_year}% CAGR (5Y)
                            </p>
                          )}
                        </div>
                      )}
                      
                      {company.analysis_result.financial_metrics.profitability_metrics && (
                        <div className="space-y-2 text-center max-w-full">
                          <h4 className="font-medium text-sm">Profitability</h4>
                          <div className="text-2xl font-bold text-blue-600 break-words">
                            {company.analysis_result.financial_metrics.profitability_metrics.net_profit_margin}%
                          </div>
                          <p className="text-xs text-muted-foreground">Net Margin</p>
                          <p className="text-xs text-blue-600 break-words">
                            ${(company.analysis_result.financial_metrics.profitability_metrics.net_income / 1000000000).toFixed(1)}B Net Income
                          </p>
                        </div>
                      )}
                      
                      {company.analysis_result.financial_metrics.balance_sheet && (
                        <div className="space-y-2 text-center max-w-full">
                          <h4 className="font-medium text-sm">Balance Sheet</h4>
                          <div className="text-2xl font-bold text-purple-600 break-words">
                            {company.analysis_result.financial_metrics.balance_sheet.current_ratio}
                          </div>
                          <p className="text-xs text-muted-foreground">Current Ratio</p>
                          <p className="text-xs text-purple-600 break-words">
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
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {/* Market Position Card */}
                      <div className="p-5 border rounded-lg bg-muted/30 overflow-hidden">
                        <h4 className="font-medium mb-4 text-center">Market Position</h4>
                        <div className="text-center mb-4">
                          <Badge variant="outline" className="mb-2 break-words">
                            {company.analysis_result.market_competition.market_data?.market_position || 'Not Available'}
                          </Badge>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-nowrap">Market Share:</span>
                            <span className="font-bold ml-auto">{company.analysis_result.market_competition.market_data?.current_market_share}%</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-nowrap">Market Rank:</span>
                            <span className="font-bold ml-auto">#{company.analysis_result.market_competition.market_data?.market_share_rank}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-nowrap">Growth Rate:</span>
                            <span className="font-bold text-green-600 ml-auto">{company.analysis_result.market_competition.market_data?.market_growth_rate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Competitive Strength Card */}
                      <div className="p-5 border rounded-lg bg-muted/30 overflow-hidden">
                        <h4 className="font-medium mb-4 text-center">Competitive Strength</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-nowrap">Moat Strength:</span>
                            <Badge variant="outline" className="ml-auto">{company.analysis_result.market_competition.competitive_analysis?.moat_strength}/5</Badge>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-nowrap">Barriers to Entry:</span>
                            <Badge variant="outline" className="ml-auto">{company.analysis_result.market_competition.competitive_analysis?.barriers_to_entry}/5</Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Competitors Card */}
                      {company.analysis_result.market_competition.competitive_analysis?.direct_competitors && (
                        <div className="p-5 border rounded-lg bg-muted/30 overflow-hidden">
                          <h4 className="font-medium mb-4 text-center">Top Competitors</h4>
                          <div className="space-y-3">
                            {company.analysis_result.market_competition.competitive_analysis.direct_competitors.slice(0, 3).map((competitor: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm gap-2">
                                <span className="font-medium break-words">{competitor.name}</span>
                                <span className="text-muted-foreground ml-auto">{competitor.market_share}%</span>
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
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                      {/* Environmental Card */}
                      {company.analysis_result.esg_risk.environmental && (
                        <div className="p-5 border rounded-lg bg-green-50/50 overflow-hidden">
                          <h4 className="font-medium text-green-700 mb-4 text-center">Environmental</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-nowrap">Sustainability Score:</span>
                              <Badge variant="outline" className="text-green-600 ml-auto">
                                {company.analysis_result.esg_risk.environmental.sustainability_score}/100
                              </Badge>
                            </div>
                            <div className="text-center mt-3">
                              <span className="text-xs text-muted-foreground">ESG Alignment:</span>
                              <p className="text-xs font-medium mt-1 break-words">{company.analysis_result.esg_risk.environmental.esg_alignment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Social Card */}
                      {company.analysis_result.esg_risk.social && (
                        <div className="p-5 border rounded-lg bg-blue-50/50 overflow-hidden">
                          <h4 className="font-medium text-blue-700 mb-4 text-center">Social</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-nowrap">Diversity Score:</span>
                              <Badge variant="outline" className="ml-auto">{company.analysis_result.esg_risk.social.diversity_score}/10</Badge>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-nowrap">Community Investment:</span>
                              <Badge variant="outline" className="ml-auto">{company.analysis_result.esg_risk.social.community_investment}/10</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Governance Card */}
                      {company.analysis_result.esg_risk.governance && (
                        <div className="p-5 border rounded-lg bg-purple-50/50 overflow-hidden">
                          <h4 className="font-medium text-purple-700 mb-4 text-center">Governance</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-nowrap">Governance Score:</span>
                              <Badge variant="outline" className="ml-auto">{company.analysis_result.esg_risk.governance.governance_score}/100</Badge>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-nowrap">Board Independence:</span>
                              <Badge variant="outline" className="ml-auto">{company.analysis_result.esg_risk.governance.board_independence}/10</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Risk Assessment Section */}
                    {company.analysis_result.esg_risk.risk_assessment && (
                      <div className="p-5 border rounded-lg bg-muted/30 overflow-hidden">
                        <h4 className="font-medium mb-5 text-center">Risk Assessment</h4>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                          <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-xs">Market Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.market_risk === 'Low' ? 'outline' : 'secondary'} className="break-words">
                              {company.analysis_result.esg_risk.risk_assessment.market_risk}
                            </Badge>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-xs">Financial Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.financial_risk === 'Low' ? 'outline' : 'secondary'} className="break-words">
                              {company.analysis_result.esg_risk.risk_assessment.financial_risk}
                            </Badge>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-xs">Operational Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.operational_risk === 'Low' ? 'outline' : 'secondary'} className="break-words">
                              {company.analysis_result.esg_risk.risk_assessment.operational_risk}
                            </Badge>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-xs">Overall Risk</p>
                            <Badge variant={company.analysis_result.esg_risk.risk_assessment.overall_risk_level === 'Low' ? 'outline' : 'secondary'} className="break-words">
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
                  <CardContent className="p-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Market Intelligence Sub-box */}
                      {company.analysis_result.business_intelligence.market_intelligence && (
                        <div className="p-5 border rounded-lg bg-blue-50/50 overflow-hidden">
                          <h4 className="font-medium text-green-700 mb-4 text-center">Market Intelligence</h4>
                          <div className="space-y-4">
                            {company.analysis_result.business_intelligence.market_intelligence.growth_signals && (
                              <div>
                                <h5 className="text-sm font-medium mb-3 text-green-700">Growth Signals</h5>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                  {company.analysis_result.business_intelligence.market_intelligence.growth_signals.slice(0, 3).map((signal: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="break-words leading-relaxed">{signal}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="grid gap-3 text-sm">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Digital Disruption Risk:</span>
                                <Badge variant="outline" className="ml-auto">{company.analysis_result.business_intelligence.market_intelligence.digital_disruption_risk}</Badge>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Industry Consolidation:</span>
                                <Badge variant="outline" className="ml-auto">{company.analysis_result.business_intelligence.market_intelligence.industry_consolidation_trend}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Lead Generation Intelligence Sub-box */}
                      {company.analysis_result.business_intelligence.lead_gen_intelligence && (
                        <div className="p-5 border rounded-lg bg-green-50/50 overflow-hidden">
                          <h4 className="font-medium text-blue-700 mb-4 text-center">Lead Generation Intelligence</h4>
                          <div className="space-y-4">
                            <div className="grid gap-3 text-sm">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Website Quality:</span>
                                <Badge variant="outline" className="ml-auto">{company.analysis_result.business_intelligence.lead_gen_intelligence.website_quality_score}/10</Badge>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Social Media Activity:</span>
                                <Badge variant="outline" className="ml-auto break-words">{company.analysis_result.business_intelligence.lead_gen_intelligence.social_media_activity}</Badge>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Marketing Sophistication:</span>
                                <Badge variant="outline" className="ml-auto break-words">{company.analysis_result.business_intelligence.lead_gen_intelligence.marketing_sophistication}</Badge>
                              </div>
                            </div>
                            
                            {company.analysis_result.business_intelligence.lead_gen_intelligence.recommended_approach && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium mb-2 text-blue-700">Recommended Approach</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
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
              <div className="grid gap-6 lg:grid-cols-2">
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
                    <CardContent className="p-6 overflow-hidden">
                      {company.analysis_result.leadership_management.executives && (
                        <div className="space-y-5">
                          <div>
                            <h4 className="font-medium mb-3">Executive Team</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">CEO:</span>
                                <span className="font-medium break-words ml-auto text-right">{company.analysis_result.leadership_management.executives.ceo_name}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">CEO Tenure:</span>
                                <span className="ml-auto">{company.analysis_result.leadership_management.executives.ceo_tenure_years} years</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">CEO Age:</span>
                                <span className="ml-auto">{company.analysis_result.leadership_management.executives.ceo_age}</span>
                              </div>
                            </div>
                          </div>
                          
                          {company.analysis_result.leadership_management.team_metrics && (
                            <div>
                              <h4 className="font-medium mb-3">Team Metrics</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-nowrap">Glassdoor Rating:</span>
                                  <Badge variant="outline" className="ml-auto">{company.analysis_result.leadership_management.team_metrics.glassdoor_rating}/5.0</Badge>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-nowrap">Avg Tenure:</span>
                                  <span className="ml-auto">{company.analysis_result.leadership_management.team_metrics.average_tenure_years} years</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-nowrap">Management Stability:</span>
                                  <span className="text-xs break-words ml-auto text-right max-w-[60%]">{company.analysis_result.leadership_management.team_metrics.management_stability}</span>
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
                    <CardContent className="p-6 overflow-hidden">
                      {company.analysis_result.technology_operations.rd_innovation && (
                        <div className="space-y-5">
                          <div>
                            <h4 className="font-medium mb-3">R&D Investment</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">R&D Spending:</span>
                                <span className="font-medium ml-auto">${(company.analysis_result.technology_operations.rd_innovation.rd_spending / 1000000000).toFixed(1)}B</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">% of Revenue:</span>
                                <span className="ml-auto">{company.analysis_result.technology_operations.rd_innovation.rd_percent_revenue}%</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Patents Held:</span>
                                <span className="ml-auto">{company.analysis_result.technology_operations.rd_innovation.patents_held?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-nowrap">Innovation Score:</span>
                                <Badge variant="outline" className="ml-auto">{company.analysis_result.technology_operations.rd_innovation.innovation_score}/5</Badge>
                              </div>
                            </div>
                          </div>
                          
                          {company.analysis_result.technology_operations.infrastructure && (
                            <div>
                              <h4 className="font-medium mb-3">Infrastructure</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-nowrap">Scalability Score:</span>
                                  <Badge variant="outline" className="ml-auto">{company.analysis_result.technology_operations.infrastructure.scalability_score}/5</Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Infrastructure Type:</span>
                                  <p className="text-xs mt-2 break-words leading-relaxed">{company.analysis_result.technology_operations.infrastructure.infrastructure_type}</p>
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