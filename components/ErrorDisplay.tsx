interface ErrorDisplayProps {
    title?: string;
    message: string;
    retry?: () => void;
}

export default function ErrorDisplay({
    title = 'Erreur',
    message,
    retry,
}: ErrorDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-danger)]/10 flex items-center justify-center mb-4">
                <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--foreground-muted)] max-w-md mb-4">{message}</p>
            {retry && (
                <button onClick={retry} className="btn btn-secondary">
                    <span>🔄</span>
                    Réessayer
                </button>
            )}
        </div>
    );
}
