// Database test page to verify direct PostgreSQL connection
// This page helps verify the transition is working correctly

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
import { Badge } from "@/components/ui/badge";
import { Database, TestTube, CheckCircle, XCircle } from "lucide-react";
import { DatabaseTestPanel } from "@/components/db-test-panel";
import { DatabaseStatus } from "@/components/database-status";
import { HybridCompaniesPage } from "@/components/hybrid-companies-page";
import { useDirectCompanies, useDirectDashboardStats } from "@/hooks/use-direct-company-data";

export default function DatabaseTestPage() {
  const { data: companiesData, isLoading: companiesLoading, error: companiesError } = useDirectCompanies(undefined, 5);
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDirectDashboardStats();

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
                <BreadcrumbPage>Database Testing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <TestTube className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Database Connection Testing</h1>
              <p className="text-muted-foreground">
                Verify direct PostgreSQL connection and transition functionality
              </p>
            </div>
          </div>

          {/* Database Status */}
          <DatabaseStatus />

          {/* Test Suite */}
          <DatabaseTestPanel />

          {/* Quick Data Preview */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Companies Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Companies Preview (Direct DB)
                </CardTitle>
                <CardDescription>
                  First 5 companies from direct database query
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companiesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : companiesError ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    Error: {companiesError.message}
                  </div>
                ) : companiesData?.companies ? (
                  <div className="space-y-3">
                    {companiesData.companies.slice(0, 5).map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{company.company_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {company.id} | AI Score: {company.formatted_ai_score || 'N/A'}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {company.status}
                        </Badge>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total found: {companiesData.total} companies
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No companies found</div>
                )}
              </CardContent>
            </Card>

            {/* Stats Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Dashboard Stats (Direct DB)
                </CardTitle>
                <CardDescription>
                  Statistics calculated from direct database queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : statsError ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    Error: {statsError.message}
                  </div>
                ) : statsData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Companies:</span>
                      <Badge>{statsData.total_companies}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>High Score Leads:</span>
                      <Badge variant="secondary">{statsData.high_score_leads}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <Badge variant="outline">{statsData.average_score.toFixed(1)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <Badge variant="default">{statsData.success_rate}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Recent Analyses:</span>
                      <Badge variant="secondary">{statsData.recent_analyses_count}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Industries Found:</span>
                      <Badge variant="outline">{statsData.industry_breakdown.length}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No stats available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hybrid Mode Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Hybrid Mode Demonstration
              </CardTitle>
              <CardDescription>
                This shows how the system can switch between database and API modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HybridCompaniesPage searchTerm="" limit={3}>
                {({ companies, loading, error, dataSource, switchMode }) => (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={dataSource === 'database' ? 'default' : 'secondary'}
                        className={dataSource === 'database' ? 'bg-blue-600' : 'bg-purple-600'}
                      >
                        Currently using: {dataSource}
                      </Badge>
                      <button
                        onClick={switchMode}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Switch to {dataSource === 'database' ? 'API' : 'Database'} mode
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="text-muted-foreground">Loading from {dataSource}...</div>
                    ) : error ? (
                      <div className="text-red-600">Error from {dataSource}: {error instanceof Error ? error.message : String(error)}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Successfully loaded {companies.length} companies from {dataSource}
                      </div>
                    )}
                  </div>
                )}
              </HybridCompaniesPage>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}