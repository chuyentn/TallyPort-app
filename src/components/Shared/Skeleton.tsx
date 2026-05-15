import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="max-w-[1600px] mx-auto space-y-10">
    <div className="flex justify-between items-end">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-40 rounded-full" />
      </div>
      <Skeleton className="h-24 w-80 rounded-[2rem]" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[2.5rem]" />)}
    </div>
    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <Skeleton className="xl:col-span-2 h-96 rounded-[3rem]" />
      <div className="space-y-8">
        <Skeleton className="h-44 rounded-[2.5rem]" />
        <Skeleton className="h-44 rounded-[2.5rem]" />
      </div>
    </div>
  </div>
);
