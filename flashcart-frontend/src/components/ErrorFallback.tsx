"use client";

import { FallbackProps } from "react-error-boundary";

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}