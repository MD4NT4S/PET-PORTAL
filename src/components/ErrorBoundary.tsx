import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', fontFamily: 'sans-serif' }}>
                    <h1>Algo deu errado.</h1>
                    <p>Ocorreu um erro ao carregar a aplicação.</p>
                    <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Limpar Dados e Recarregar (Reset)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
