import React from 'react';
import Dialog from './Dialog';
import { BTN_SECONDARY } from './ui';

export const SHORTCUTS: { keys: string; action: string }[] = [
    { keys: '/', action: 'Focus the search box' },
    { keys: 'n', action: 'New invoice' },
    { keys: '1', action: 'Go to Dashboard' },
    { keys: '2', action: 'Go to Customers' },
    { keys: '3', action: 'Go to Invoices' },
    { keys: 't', action: 'Toggle dark / light mode' },
    { keys: '?', action: 'Show this help' },
    { keys: 'Esc', action: 'Close a dialog' },
];

const ShortcutHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <Dialog title="Keyboard shortcuts" variant="light" onClose={onClose}>
        {() => (
            <>
                <dl className="mb-6 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
                    {SHORTCUTS.map((s) => (
                        <React.Fragment key={s.keys}>
                            <dt>
                                <kbd className="inline-block min-w-[1.75rem] rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-center font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">{s.keys}</kbd>
                            </dt>
                            <dd>{s.action}</dd>
                        </React.Fragment>
                    ))}
                </dl>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Single-key shortcuts are off while you are typing in a field or a dialog is open.</p>
                <button type="button" data-autofocus="" onClick={onClose} className={BTN_SECONDARY}>Got it</button>
            </>
        )}
    </Dialog>
);

export default ShortcutHelp;
