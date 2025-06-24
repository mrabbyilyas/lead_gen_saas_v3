import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export function BackendStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    error?: string;
    loading: boolean;
    lastChecked?: Date;
  }>({ connected: false, loading: true });

  const checkBackendHealth = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await api.testConnection();
      setStatus({
        connected: result.connected,
        error: result.error,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const getStatusIcon = () => {
    if (status.loading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (status.connected) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (status.loading) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    if (status.connected) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>;
    }
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">Backend Status</span>
          {getStatusBadge()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkBackendHealth}
          disabled={status.loading}
        >
          <RefreshCw className={`h-4 w-4 ${status.loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!status.connected && status.error && (
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-700">
            <strong>Backend Connection Issue:</strong> {status.error}
            <div className="mt-2 text-sm">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Check if backend server is running on port 8000</li>
                <li>Verify the API URL in environment settings</li>
                <li>Check for CORS or firewall issues</li>
                <li>Review backend logs for errors</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status.connected && (
        <Alert className="border-green-500/20 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-green-700">
            Backend is connected and healthy. All API endpoints should be working properly.
          </AlertDescription>
        </Alert>
      )}

      {status.lastChecked && (
        <p className="text-xs text-muted-foreground">
          Last checked: {status.lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}