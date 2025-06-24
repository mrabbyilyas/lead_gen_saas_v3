import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rounded' | 'circular';
  animate?: boolean;
}

function Skeleton({
  className,
  variant = 'default',
  animate = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted",
        animate && "animate-pulse",
        variant === 'rounded' && "rounded-md",
        variant === 'circular' && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

// Company table row skeleton
function CompanyTableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-12 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </td>
    </tr>
  );
}

// Dashboard stats card skeleton
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="p-6 pt-0">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Table skeleton with multiple rows
function TableSkeleton({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4 text-left align-middle">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <CompanyTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { 
  Skeleton, 
  CompanyTableRowSkeleton, 
  StatsCardSkeleton, 
  TableSkeleton 
};