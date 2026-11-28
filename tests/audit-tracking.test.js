import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
    actorId, actorLabel, stampCreate, stampCreateAuditOnly, stampUpdate, applyUpdateAudit, resolveAuditMeta
} from '../src/lib/audit.js';

const admin = { id: 'a1', name: 'Rabbi', role: 'admin' };
const staff = { userId: 's1', name: 'Tanvir', role: 'staff', staffRoleName: 'Front Desk' };

describe('audit helpers', () => {
    it('resolves actor id and label', () => {
        expect(actorId(admin)).toBe('a1');
        expect(actorId(null)).toBe('');
        expect(actorLabel(admin)).toBe('Rabbi (Admin)');
        expect(actorLabel(staff)).toBe('Tanvir (Front Desk)');
        expect(actorLabel(null, 'System')).toBe('System');
    });

    it('stamps create and update fields', () => {
        expect(stampCreate(admin)).toEqual({ userId: 'a1', createdBy: 'Rabbi (Admin)', updatedBy: 'Rabbi (Admin)', createdById: 'a1', updatedById: 'a1' });
        expect(stampCreate(admin, { userId: 'cust' }).userId).toBe('cust');
        expect(stampCreateAuditOnly(staff)).not.toHaveProperty('userId');
        expect(stampUpdate(staff, { backfillUserId: true })).toEqual({ updatedBy: 'Tanvir (Front Desk)', updatedById: 's1', userId: 's1' });
        expect(stampUpdate(staff, { backfillUserId: true, currentUserId: 'x' })).not.toHaveProperty('userId');
    });

    it('applies update audit to a document and resolves metadata', () => {
        const doc = applyUpdateAudit({ recordedBy: 'Desk' }, admin, { backfillUserId: true });
        expect(doc).toMatchObject({ updatedBy: 'Rabbi (Admin)', createdBy: 'Desk', userId: 'a1' });
        expect(resolveAuditMeta({ postedBy: 'Cap', createdById: 'z' })).toEqual({ createdBy: 'Cap', updatedBy: '', userId: 'z' });
        expect(resolveAuditMeta(null)).toEqual({ createdBy: '', updatedBy: '', userId: '' });
    });
});

describe('every model exposes audit fields', () => {
    const dir = path.resolve(__dirname, '../src/models');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    it.each(files)('%s', async (file) => {
        const mod = await import(pathToFileURL(path.join(dir, file)).href);
        const models = Object.values(mod).filter(v => v && v.schema && typeof v.schema.path === 'function');
        expect(models.length).toBeGreaterThan(0);
        for (const M of models) {
            for (const field of ['userId', 'createdBy', 'updatedBy', 'createdById', 'updatedById']) {
                expect(M.schema.path(field), `${M.modelName}.${field}`).toBeTruthy();
            }
        }
    });
});
