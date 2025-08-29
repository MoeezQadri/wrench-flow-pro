import { LoadingStateIndicator } from './LoadingStateIndicator';

interface LoadingStateWrapperProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onForceRefresh?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
}

export const LoadingStateWrapper: React.FC<LoadingStateWrapperProps> = ({
  isLoading,
  error,
  onRetry,
  onForceRefresh,
  children,
  loadingMessage
}) => {
  if (isLoading || error) {
    return (
      <LoadingStateIndicator
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onForceRefresh={onForceRefresh}
        loadingMessage={loadingMessage}
      />
    );
  }

  return <>{children}</>;
};