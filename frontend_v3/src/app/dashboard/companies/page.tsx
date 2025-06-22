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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Search, Filter, Download, Eye, RefreshCw, FileText, FileJson, BarChart, Database } from "lucide-react";
import { useCompanies, useDebounce } from "@/hooks/use-company-data";
import { SystemStatusIndicator } from "@/components/system-status";
import { exportToCSV, exportToJSON } from "@/lib/export";
import { formatAIScore, getScoreBadgeVariant } from "@/lib/ai-score";

export default function CompaniesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use debounced search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Fetch real data from database
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies(
    debouncedSearchQuery.trim() ? debouncedSearchQuery : undefined, 
    50
  );

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
        : 'companies_database_export';
      exportToCSV(companies, filename);
    }
  };

  const handleExportJSON = () => {
    if (companies.length > 0) {
      const filename = debouncedSearchQuery 
        ? `companies_search_${debouncedSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` 
        : 'companies_database_export';
      exportToJSON(companies, filename);
    }
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
                <BreadcrumbPage>Company Database</BreadcrumbPage>
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
                <Database className="h-8 w-8" />
                Company Database
              </h1>
              <p className="text-muted-foreground">
                Browse and search through analyzed companies with AI-powered insights
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                disabled={companiesLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${companiesLoading ? 'animate-spin' : ''}`} />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Database
              </CardTitle>
              <CardDescription>
                Search through company database by name or canonical name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search companies (e.g., Apple, Microsoft, Tesla...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Company Database Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {debouncedSearchQuery ? `Search Results for "${debouncedSearchQuery}"` : 'All Companies'}
                  </CardTitle>
                  <CardDescription>
                    {companiesLoading 
                      ? 'Loading company database...' 
                      : `${companies.length} companies in database`
                    }
                  </CardDescription>
                </div>
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
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companiesLoading ? (
                      // Loading skeleton rows
                      [...Array(10)].map((_, index) => (
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
                          {debouncedSearchQuery ? 'No companies found matching your search.' : 'No companies in database.'}
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
                                variant={getScoreBadgeVariant(company.score)}
                                className="font-mono"
                              >
                                {formatAIScore(company.score)}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Analysis"
                              onClick={() => handleViewCompany(company.id)}
                            >
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