import React, { useEffect, useId, useRef } from 'react';

export type DialogVariant = 'dark' | 'light';

const STYLES: Record<DialogVariant, { overlay: string; panel: string; title: string; close: string }> = {
    dark: {
        overlay: 'bg-gray-400 bg-opacity-50',
        panel: 'bg-gray-600 bg-opacity-50 backdrop-blur-sm border border-gray-400 rounded-lg shadow-xl',
        title: 'text-white',
        close: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
    },
    light: {
        overlay: 'bg-gray-500 bg-opacity-50',
        panel: 'bg-white rounded-lg shadow',
        title: 'text-gray-800',
        close: 'bg-red-500 hover:bg-red-700 focus:ring-red-500',
    },
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
    title: string;
    variant: DialogVariant;
    onClose: () => void;
    children: (titleId: string) => React.ReactNode;
}

// Modal dialog: Escape closes, Tab is trapped inside, focus moves in on open
// and returns to the opener on close. Mount it only while open.
const Dialog: React.FC<DialogProps> = ({ title, variant, onClose, children }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const titleId = useId();
    const s = STYLES[variant];

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
        <div className={`fixed inset-0 z-50 overflow-auto flex ${s.overlay}`} onKeyDown={handleKeyDown}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`relative p-8 w-full max-w-md m-auto flex-col flex focus:outline-none ${s.panel}`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className={`absolute top-0 right-0 mt-4 mr-4 text-white rounded-full p-2 leading-none flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${s.close}`}
                    style={{ width: '30px', height: '30px' }}
                >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <h2 id={titleId} className={`text-2xl font-semibold mb-4 ${s.title}`}>{title}</h2>
                {children(titleId)}
            </div>
        </div>
    );
};

export default Dialog;
