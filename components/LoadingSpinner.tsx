interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div
                className={`${sizeClasses[size]} border-2 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin`}
            ></div>
            {text && <p className="text-sm text-[var(--foreground-muted)]">{text}</p>}
        </div>
    );
}
