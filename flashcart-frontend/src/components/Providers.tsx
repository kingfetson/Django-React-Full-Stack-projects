"use client";

import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./ErrorFallback";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}