'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    ActivityIcon,
    SmileIcon,
    CrystalBallIcon,
    NewspaperIcon,
    BellIcon,
    SettingsIcon,
    DiamondIcon,
    DollarSignIcon
} from '@/components/Icons';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { href: '/dashboard/prix', label: 'Prix', icon: <DollarSignIcon size={20} /> },
    { href: '/dashboard/transactions', label: 'Transactions', icon: <ActivityIcon size={20} /> },
    { href: '/dashboard/sentiment', label: 'Sentiment', icon: <SmileIcon size={20} /> },
    { href: '/dashboard/predictions', label: 'Prédictions', icon: <CrystalBallIcon size={20} /> },
    { href: '/dashboard/articles', label: 'Articles', icon: <NewspaperIcon size={20} /> },
    { href: '/dashboard/alertes', label: 'Alertes', icon: <BellIcon size={20} /> },
    { href: '/dashboard/configuration', label: 'Configuration', icon: <SettingsIcon size={20} /> },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-background/50 backdrop-blur-xl border-r border-sidebar-border flex flex-col z-50">
            {/* Logo */}
            <div className="p-4 border-b border-sidebar-border/50">
                <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
                    <DiamondIcon size={24} className="text-[var(--accent-primary)]" />
                    CRYPTO VIZ
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-card)]'
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-color)]">
                <div className="text-xs text-[var(--foreground-muted)] text-center">
                    <p>API: 192.168.218.62:8000</p>
                    <p className="mt-1">v1.0.0</p>
                </div>
            </div>
        </aside>
    );
}
