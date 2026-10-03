import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'bms-theme';

// Follows the system preference until the user picks one; the pick persists.
export function useTheme(): { theme: Theme; toggle: () => void } {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => {
            if (localStorage.getItem(KEY)) return;
            document.documentElement.classList.toggle('dark', e.matches);
            setTheme(e.matches ? 'dark' : 'light');
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const toggle = useCallback(() => {
        const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        try {
            localStorage.setItem(KEY, next);
        } catch {
            /* storage unavailable: the choice just won't persist */
        }
        setTheme(next);
    }, []);

    return { theme, toggle };
}
