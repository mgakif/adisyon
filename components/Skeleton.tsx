import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-slate-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Pre-built skeleton components
export const ProductCardSkeleton = () => (
  <>
    {/* Mobile Skeleton */}
    <div className="rounded-xl px-3 py-2 flex items-center justify-between h-16 border border-slate-200 bg-white md:hidden">
      <div className="flex items-center gap-2 flex-1">
        <Skeleton variant="rectangular" className="w-8 h-8" />
        <Skeleton variant="text" className="w-24 h-4" />
      </div>
      <Skeleton variant="text" className="w-16 h-6" />
    </div>
    {/* Desktop Skeleton */}
    <div className="hidden md:flex flex-col justify-between rounded-xl px-4 py-4 min-h-[140px] border border-slate-200 bg-white">
      <div className="flex items-start gap-3 flex-1">
        <Skeleton variant="rectangular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-full h-4" />
          <Skeleton variant="text" className="w-3/4 h-4" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <Skeleton variant="text" className="w-20 h-6" />
      </div>
    </div>
  </>
);

export const TableCardSkeleton = () => (
  <div className="h-28 md:h-32 rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center gap-2">
    <Skeleton variant="circular" className="w-8 h-8" />
    <Skeleton variant="text" className="w-16 h-4" />
  </div>
);

export const CartItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
    <div className="flex-1">
      <Skeleton variant="text" className="w-32 h-4 mb-2" />
      <Skeleton variant="text" className="w-24 h-3" />
    </div>
    <Skeleton variant="text" className="w-16 h-6" />
  </div>
);
