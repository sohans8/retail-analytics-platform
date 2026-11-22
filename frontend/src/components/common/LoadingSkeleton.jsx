import React from 'react';

export const LoadingSkeleton = ({ rows = 4, className = '' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-slate-100 rounded w-full"></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
