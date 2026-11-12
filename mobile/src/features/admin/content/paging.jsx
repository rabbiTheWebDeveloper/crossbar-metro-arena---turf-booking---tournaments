import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react-native';
import { Button } from '@/components/ui';

/**
 * "Show more" pagination for lists rendered inside a scrolling screen (no nested FlatList).
 *   resetKey: when it changes (filter / search), the list goes back to the first page
 */
export function usePaged(list, resetKey = '', pageSize = 30) {
    const [state, setState] = useState({ key: resetKey, count: pageSize });
    const count = state.key === resetKey ? state.count : pageSize;
    const visible = useMemo(() => list.slice(0, count), [list, count]);
    const showMore = useCallback(() => setState({ key: resetKey, count: count + pageSize }), [resetKey, count, pageSize]);
    return { visible, hasMore: list.length > count, remaining: Math.max(0, list.length - count), showMore };
}

/** Button under a paged list. Renders nothing when everything is already shown. */
export function ShowMoreButton({ paged }) {
    if (!paged.hasMore) return null;
    return <Button title={`Show more (${paged.remaining} left)`} variant="secondary" icon={ChevronDown} onPress={paged.showMore} block />;
}
