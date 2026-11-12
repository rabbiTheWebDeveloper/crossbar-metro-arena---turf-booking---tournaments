import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Card, Button, Row, Label } from '@/components/ui';

/** Backup utility bar: JSON export through the share sheet. Restore is intentionally unavailable. */
export function DatabaseTools() {
    const { exportDatabaseBackup } = useArena();
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try { await exportDatabaseBackup(); } finally { setExporting(false); }
    };

    return (
        <Card style={{ gap: 10 }}>
            <Label>Database tools</Label>
            <Row>
                <Button title="Export backup" icon={Download} variant="outline" size="sm" loading={exporting} onPress={handleExport} style={{ flex: 1 }} />
                <Button title="Restore" icon={Upload} variant="secondary" size="sm" disabled style={{ flex: 1 }} accessibilityHint="Restore from a JSON file is not supported" />
            </Row>
            <AppText size="xs" tone="dim">
                Backups are read-only JSON exports. Data lives in the MongoDB database; restore via your database tooling, not this panel.
            </AppText>
        </Card>
    );
}
