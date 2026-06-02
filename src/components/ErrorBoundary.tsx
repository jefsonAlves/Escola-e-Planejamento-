import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Ops! Algo deu errado.
      </h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md">
        Ocorreu um erro inesperado ao carregar esta parte do aplicativo.
        Nossa equipe já foi notificada.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

export default function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
