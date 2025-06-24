import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Simplified progress bar without external dependency
const SimpleProgress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);
import { CheckCircle2, XCircle, Clock, X, Loader2 } from "lucide-react";

interface AsyncProgressProps {
  isActive: boolean;
  status: string | null;
  progress: string | null;
  elapsedTime?: string;
  estimatedRemaining?: string;
  error?: string | null;
  onCancel?: () => void;
  className?: string;
}

export function AsyncProgress({
  isActive,
  status,
  progress,
  elapsedTime,
  estimatedRemaining,
  error,
  onCancel,
  className,
}: AsyncProgressProps) {
  if (!isActive && !progress && !error) {
    return null;
  }

  const getProgressValue = () => {
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;
    if (status === 'processing') {
      // Simulate progress based on typical analysis time
      if (progress?.includes('Starting')) return 10;
      if (progress?.includes('Checking existing')) return 20;
      if (progress?.includes('Generating AI analysis')) return 60;
      if (progress?.includes('Saving')) return 90;
      return 30;
    }
    return 0;
  };

  const getStatusIcon = () => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (status === 'failed' || error) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (isActive) {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (status === 'completed') return 'text-green-700';
    if (status === 'failed' || error) return 'text-red-700';
    if (isActive) return 'text-blue-700';
    return 'text-gray-700';
  };

  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-600';
    if (status === 'failed' || error) return 'bg-red-600';
    return 'bg-blue-600';
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-card",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className={cn("font-medium", getStatusColor())}>
              {error ? 'Analysis Failed' : 
               status === 'completed' ? 'Analysis Completed' :
               status === 'failed' ? 'Analysis Failed' :
               isActive ? 'Analyzing Company...' : 'Ready'}
            </p>
            {progress && (
              <p className="text-sm text-muted-foreground mt-1">
                {error || progress}
              </p>
            )}
          </div>
        </div>
        
        {isActive && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
            title="Cancel search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {(isActive || status === 'completed' || status === 'failed') && (
        <div className="mb-3">
          <SimpleProgress 
            value={getProgressValue()} 
            className="h-2"
          />
        </div>
      )}

      {/* Time Information */}
      {(elapsedTime || estimatedRemaining) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {elapsedTime && (
            <span>Elapsed: {elapsedTime}</span>
          )}
          {estimatedRemaining && isActive && (
            <span>{estimatedRemaining}</span>
          )}
        </div>
      )}

      {/* Status Messages */}
      {status === 'completed' && (
        <div className="mt-2 text-sm text-green-700 bg-green-50 rounded p-2">
          ✅ Company analysis completed successfully! Results are ready.
        </div>
      )}
      
      {(status === 'failed' || error) && (
        <div className="mt-2 text-sm text-red-700 bg-red-50 rounded p-2">
          ❌ {error || 'Analysis failed. Please try again.'}
        </div>
      )}
    </div>
  );
}