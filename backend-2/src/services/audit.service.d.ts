import type { Request } from 'express';
/**
 * ----------------------------------------------------------------------
 * CORE AUDIT ENGINE
 * ----------------------------------------------------------------------
 * @param req - The Express Request object (can be null for CRON jobs)
 * @param entityType - The category of the record (e.g., 'UNIT', 'PROPERTY')
 * @param entityId - The specific numeric ID of the record altered
 * @param action - The verb describing the event (e.g., 'UPDATE_TAX')
 * @param details - The JSON payload of what was actually changed
 */
export declare const logAction: (req: Request | null, entityType: string, entityId: number, action: string, details?: any) => Promise<void>;
//# sourceMappingURL=audit.service.d.ts.map