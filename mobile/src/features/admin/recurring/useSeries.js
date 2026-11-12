import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Existing fixed-slot series (GET /api/bookings/bulk, admin only).
 * The ArenaContext has no action for this list, so it is loaded here through the shared API client.
 */
export function useSeries() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSeries = useCallback(async () => {
        setLoading(true);
        const r = await api('/api/bookings/bulk');
        if (r.ok && Array.isArray(r.data.series)) {
            setSeries(r.data.series);
            setError('');
        } else if (!r.ok) {
            setError(r.error || 'Could not load the series list.');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadSeries(); }, [loadSeries]);

    return { series, loading, error, loadSeries };
}
