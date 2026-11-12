import { todayDhakaIso } from '@/lib/dateUtils';

/** 33.400000000000006 -> "33.4", 25 -> "25" (percentages that came out of float arithmetic). */
export const trimNumber = (value) => String(Math.round((Number(value) || 0) * 100) / 100);

/**
 * Date preselected in the "add expense / income" forms: today when the report shows the current
 * month, otherwise the first day of the month being viewed.
 */
export const defaultEntryDate = (selectedMonth) => {
    const today = todayDhakaIso();
    return selectedMonth === today.slice(0, 7) ? today : `${selectedMonth}-01`;
};
