// Hybrid companies page that can switch between direct database and API modes
// This allows for smooth transition and fallback capabilities

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Cloud, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";

// Import both API and direct database hooks
import { 
  useDirectCompanies, 
  useDirectCompanyCache, 
  useDirectDatabaseHealth,
  type EnhancedCompanyAnalysis 
} from "@/hooks/use-direct-company-data";
// Removed API hooks - using database-first mode only

interface HybridCompaniesPageProps {
  searchTerm?: string;
  limit?: number;
  children: (props: {
    companies: any[];
    loading: boolean;
    error: string | null;
    dataSource: 'database';
    isHealthy: boolean;
    switchMode: () => void;
    invalidateCache: () => void;
  }) => React.ReactNode;
}

export function HybridCompaniesPage({
  searchTerm,
  limit = 50,
  children
}: HybridCompaniesPageProps) {
  // Database-first mode only (no API fallback)
  const { data: isDbHealthy, isLoading: healthChecking } = useDirectDatabaseHealth();
  
  // Direct database hooks (enforced mode)
  const {
    data: dbResults,
    isLoading: dbLoading,
    error: dbError
  } = useDirectCompanies(searchTerm, limit, 0);
  
  const { invalidateCompanyList: invalidateDbCache } = useDirectCompanyCache();
  
  // Database-only data
  const companies = dbResults?.companies || [];
  const loading = dbLoading;
  const error = dbError ? (dbError instanceof Error ? dbError.message : String(dbError)) : null;
  const dataSource = 'database';
  
  const switchMode = () => {
    console.log('Mode switching disabled - database-first mode only');
  };
  
  const invalidateCache = () => {
    invalidateDbCache();
  };
  
  return (
    <div className="space-y-4">
      {/* Data Source Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">
                Data Source: Direct PostgreSQL (Database-First Mode)
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                Database-Only Mode
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={invalidateCache}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Direct database queries enforced - optimized for performance and real-time data
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Health Status Alerts */}
      {healthChecking && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Checking database connection health...
          </AlertDescription>
        </Alert>
      )}
      
      {!isDbHealthy && !healthChecking && preferDirectDb && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-medium mb-1">Database connection unavailable</div>
            <p className="text-sm">
              Automatically switched to API mode. Check database configuration or try refreshing.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Render children with data */}
      {children({
        companies,
        loading,
        error,
        dataSource,
        isHealthy: isDbHealthy || false,
        switchMode,
        invalidateCache
      })}
    </div>
  );
}

// Enhanced company interface that works with both modes
export type HybridCompanyData = EnhancedCompanyAnalysis | {
  id: number;
  company_name: string;
  canonical_name?: string;
  analysis_result: any;
  status: string;
  created_at: Date | string;
  // Add computed fields for compatibility
  ai_score_breakdown?: any;
  formatted_ai_score?: string;
  score?: number;
  industry?: string;
  revenue_range?: string;
};