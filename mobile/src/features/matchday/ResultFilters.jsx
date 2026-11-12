import React from 'react';
import { Card, Row, Chip, DateField, Label } from '@/components/ui';
import { spacing } from '@/theme';

export const DATE_FILTERS = [
    { id: 'all', label: 'All Results' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'custom', label: 'Pick Date' }
];

/**
 * Date filter row for the match scores list.
 *   dateFilter: 'all' | 'today' | 'yesterday' | 'custom'      customDate: YYYY-MM-DD ('' = not picked)
 */
export function ResultFilters({ dateFilter, onChangeFilter, customDate, onChangeDate, maxDate }) {
    return (
        <Card padded={false} style={{ padding: spacing.md, gap: spacing.sm }}>
            <Label>Filter by</Label>
            <Row wrap gap={6}>
                {DATE_FILTERS.map(f => (
                    <Chip key={f.id} label={f.label} selected={dateFilter === f.id} onPress={() => onChangeFilter(f.id)} />
                ))}
            </Row>
            {dateFilter === 'custom' ? (
                <DateField value={customDate} onChange={onChangeDate} maxDate={maxDate} placeholder="Pick a match date" clearable />
            ) : null}
        </Card>
    );
}
