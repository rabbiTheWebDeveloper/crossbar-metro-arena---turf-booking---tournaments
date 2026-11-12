import { useCallback, useMemo, useState } from 'react';
import { buildMonthList } from '@/data/finance';
import { todayDhakaIso } from '@/lib/dateUtils';

/**
 * Rolling window of the last `count` months ending at the current Dhaka month (the investor
 * portal only looks back a few months). Feed `minMonth` / `maxMonth` to <MonthSwitcher>.
 */
export function useMonthWindow(count = 6) {
    const months = useMemo(() => buildMonthList(todayDhakaIso().slice(0, 7), count), [count]);
    const last = months[months.length - 1];
    const [month, setMonth] = useState(last.key);
    const current = months.find(m => m.key === month) || last;
    return {
        months,
        selectedMonth: current.key,
        setSelectedMonth: setMonth,
        monthLabel: current.label,
        minMonth: months[0].key,
        maxMonth: last.key
    };
}

/**
 * "Show more" pagination for long lists rendered inside a scrolling screen.
 * The visible count resets whenever `resetKey` changes (e.g. another month is selected).
 */
export function usePagedList(list, resetKey, pageSize = 30) {
    const [state, setState] = useState({ key: resetKey, limit: pageSize });
    const limit = state.key === resetKey ? state.limit : pageSize;
    const shown = useMemo(() => list.slice(0, limit), [list, limit]);
    const showMore = useCallback(() => setState({ key: resetKey, limit: limit + pageSize }), [resetKey, limit, pageSize]);
    return { shown, hasMore: list.length > limit, remaining: Math.max(0, list.length - limit), showMore };
}
