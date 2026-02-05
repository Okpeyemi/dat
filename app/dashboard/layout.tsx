import { Sidebar, Header } from '@/components';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar />
            <div className="ml-64">
                {children}
            </div>
        </div>
    );
}
