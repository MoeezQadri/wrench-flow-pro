import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingProgressProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
}

export function LoadingProgress({ isVisible, progress = 0, message }: LoadingProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-1" />
          {message && (
            <span className="text-xs text-muted-foreground min-w-fit">
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}