import React, { useEffect, useId, useRef } from 'react';
import { FOCUS } from './ui';

// Kept for call-site compatibility: both variants now share one themed look.
export type DialogVariant = 'dark' | 'light';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
    title: string;
    variant: DialogVariant;
    onClose: () => void;
    wide?: boolean;
    children: (titleId: string) => React.ReactNode;
}

// Modal dialog: Escape closes, Tab is trapped inside, focus moves in on open
// and returns to the opener on close. Mount it only while open.
const Dialog: React.FC<DialogProps> = ({ title, onClose, wide, children }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const titleId = useId();

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
        target?.focus();
        return () => opener?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onCloseRef.current();
            return;
        }
        if (e.key !== 'Tab' || !panelRef.current) return;
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex animate-overlay-in overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6" onKeyDown={handleKeyDown}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`relative m-auto flex w-full animate-pop-in flex-col rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:p-8 ${wide ? 'max-w-3xl' : 'max-w-md'}`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${FOCUS}`}
                >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <h2 id={titleId} className="mb-4 pr-8 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                {children(titleId)}
            </div>
        </div>
    );
};

export default Dialog;
