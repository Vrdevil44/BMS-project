import React, { useEffect, useState } from 'react';
import AddressBook from './Addressbook/AddressBook';
import InvoiceBook, { InvoiceIntent } from './Invoicebook/InvoiceBook';
import Dashboard from './Dashboard/Dashboard';
import ShortcutHelp from './ShortcutHelp';
import { useTheme } from './useTheme';
import { FOCUS } from './ui';
import { resetDemoData } from '../data';

interface MainLayoutProps {
    children: React.ReactNode;
}

type Tab = 'dashboard' | 'customers' | 'invoices';

const TABS: { id: Tab; label: string; key: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', key: '1', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { id: 'customers', label: 'Customers', key: '2', icon: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: 'invoices', label: 'Invoices', key: '3', icon: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
];

const Icon: React.FC<{ d: string }> = ({ d }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor"><path d={d} /></svg>
);

const isTyping = (el: EventTarget | null) => {
    const t = el as HTMLElement | null;
    return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [intent, setIntent] = useState<InvoiceIntent | null>(null);
    const [dataVersion, setDataVersion] = useState(0);
    const [newNonce, setNewNonce] = useState(0);
    const [showHelp, setShowHelp] = useState(false);
    const { theme, toggle } = useTheme();

    const goTab = (tab: Tab) => {
        setIntent(null);
        setActiveTab(tab);
    };

    const openInvoice = (intentValue: InvoiceIntent) => {
        setIntent(intentValue);
        setActiveTab('invoices');
    };

    const handleReset = () => {
        setIntent(null);
        resetDemoData();
        setDataVersion((v) => v + 1);
    };

    // Global single-key shortcuts. Ignored while typing, with modifiers held,
    // or while any dialog is open (the dialog owns the keyboard then).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
            if (document.querySelector('[role="dialog"]')) return;
            switch (e.key) {
                case '/': {
                    const el = document.querySelector<HTMLInputElement>('[data-search]');
                    if (!el) return;
                    e.preventDefault();
                    el.focus();
                    el.select();
                    return;
                }
                case 'n':
                    e.preventDefault();
                    setNewNonce((v) => v + 1);
                    setIntent({ kind: 'new', customerUUID: '' });
                    setActiveTab('invoices');
                    return;
                case '1': case '2': case '3':
                    setIntent(null);
                    setActiveTab(TABS[Number(e.key) - 1].id);
                    return;
                case 't':
                    toggle();
                    return;
                case '?':
                    e.preventDefault();
                    setShowHelp(true);
                    return;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toggle]);

    const navBtn = (t: (typeof TABS)[number]) => (
        <button
            key={t.id}
            type="button"
            className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-full ${FOCUS} ${activeTab === t.id
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            aria-current={activeTab === t.id ? 'page' : undefined}
            aria-keyshortcuts={t.key}
            onClick={() => goTab(t.id)}
        >
            <Icon d={t.icon} />
            {t.label}
        </button>
    );

    const sideBtn = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ' + FOCUS;

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:p-4">
                <div className="flex items-center gap-2 px-1 md:mb-6 md:px-3 md:pt-1">
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">B</span>
                    <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">BMS</span>
                </div>
                <nav aria-label="Main" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:flex-col md:space-y-1">
                    {TABS.map(navBtn)}
                </nav>
                <div className="ml-auto flex items-center gap-1 md:ml-0 md:flex-col md:items-stretch md:space-y-1 md:border-t md:border-slate-200 md:pt-3 dark:md:border-slate-800">
                    <button type="button" className={sideBtn} onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-keyshortcuts="t">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {theme === 'dark'
                                ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>
                                : <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />}
                        </svg>
                        <span className="hidden md:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                    </button>
                    <button type="button" className={sideBtn} onClick={() => setShowHelp(true)} aria-keyshortcuts="?">
                        <kbd aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 font-mono text-xs dark:border-slate-600">?</kbd>
                        <span className="hidden md:inline">Shortcuts</span>
                        <span className="sr-only md:hidden">Keyboard shortcuts</span>
                    </button>
                    {process.env.NEXT_PUBLIC_BMS_BACKEND !== 'pocketbase' && (
                        <button
                            type="button"
                            className={`${sideBtn} !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-950/40`}
                            onClick={handleReset}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5" /></svg>
                            <span className="hidden md:inline">Reset demo data</span>
                            <span className="sr-only md:hidden">Reset demo data</span>
                        </button>
                    )}
                </div>
            </aside>

            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">
                    {/* key re-mounts on tab change so the fade-in replays */}
                    <div key={activeTab} className="animate-fade-in">
                        {activeTab === 'dashboard' && (
                            <Dashboard key={dataVersion} onOpenInvoice={(id) => openInvoice({ kind: 'view', id })} />
                        )}
                        {activeTab === 'customers' && (
                            <AddressBook
                                key={dataVersion}
                                onOpenInvoice={(id) => openInvoice({ kind: 'view', id })}
                                onNewInvoice={(customerUUID) => openInvoice({ kind: 'new', customerUUID })}
                            />
                        )}
                        {activeTab === 'invoices' && <InvoiceBook key={`${dataVersion}-${newNonce}-${intent ? JSON.stringify(intent) : ''}`} intent={intent} />}
                    </div>
                </div>
            </main>
            {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default MainLayout;
