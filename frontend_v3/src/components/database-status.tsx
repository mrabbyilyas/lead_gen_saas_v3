// Database status indicator component
// Shows the health and connection status of the direct PostgreSQL connection

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useDirectDatabaseHealth } from "@/hooks/use-direct-company-data";

export function DatabaseStatus() {
  const { 
    data: isHealthy, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useDirectDatabaseHealth();

  const getStatusIcon = () => {
    if (isLoading || isFetching) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (isHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (isLoading || isFetching) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }
    if (isHealthy) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <Wifi className="h-3 w-3" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (isLoading || isFetching) {
      return "Checking database connection...";
    }
    if (isHealthy) {
      return "Direct PostgreSQL connection is healthy and active.";
    }
    if (error) {
      return `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    return "Database connection is not available. Using fallback data.";
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Database Connection</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="h-8"
            >
              {isFetching ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">
          {isHealthy ? (
            <div className="space-y-1">
              <p>✅ Direct database queries enabled</p>
              <p>✅ Connection pooling active</p>
              <p>✅ Optimized performance mode</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p>⚠️ Using API fallback mode</p>
              <p>⚠️ Performance may be reduced</p>
              <p>💡 Check database configuration</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for header/sidebar use
export function DatabaseStatusBadge() {
  const { data: isHealthy, isLoading, isFetching } = useDirectDatabaseHealth();

  if (isLoading || isFetching) {
    return (
      <Badge variant="secondary" className="gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        DB
      </Badge>
    );
  }

  if (isHealthy) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <Database className="h-3 w-3" />
        Direct DB
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
      <Database className="h-3 w-3" />
      API Mode
    </Badge>
  );
}