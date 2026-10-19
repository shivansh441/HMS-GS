import { prisma } from '../utils/prisma.js';
/**
 * ----------------------------------------------------------------------
 * DATA SANITIZER
 * ----------------------------------------------------------------------
 * Prevents highly sensitive payloads from ever hitting the database.
 */
const sanitizeDetails = (details) => {
    if (!details || typeof details !== 'object')
        return details;
    // Deep clone to avoid mutating the original request body
    const sanitized = JSON.parse(JSON.stringify(details));
    const blacklistedKeys = [
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'creditCard',
        'cvv'
    ];
    const recursiveScrub = (obj) => {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (blacklistedKeys.includes(key.toLowerCase())) {
                    obj[key] = '***REDACTED_BY_AUDIT_SERVICE***';
                }
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    recursiveScrub(obj[key]);
                }
            }
        }
    };
    recursiveScrub(sanitized);
    return sanitized;
};
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
export const logAction = async (req, entityType, entityId, action, details = {}) => {
    try {
        // 1. Context Extraction
        // Fallbacks ensure that automated background jobs don't crash the logger
        const accountId = req?.user?.id || null;
        const propertyId = req?.user?.propertyId || null;
        // Extract real IP even if running behind an Nginx proxy or load balancer
        const ipAddress = req?.headers['x-forwarded-for']?.toString() || req?.socket.remoteAddress || 'SYSTEM_PROCESS';
        const userAgent = req?.headers['user-agent'] || 'BACKGROUND_JOB';
        // 2. Execute Database Write
        await prisma.auditLog.create({
            data: {
                accountId,
                propertyId,
                entityType,
                entityId,
                action,
                details: sanitizeDetails(details),
                ipAddress,
                userAgent,
            }
        });
    }
    catch (error) {
        // 3. THE FIRE AND FORGET TRAP
        // We strictly catch and swallow this error. 
        // If Prisma fails to write the log (e.g., database timeout), we DO NOT want 
        // to crash the original controller and show the user a 500 error.
        console.error(`[CRITICAL ALERT: Audit Service Failure] Failed to log action: ${action} on ${entityType} ${entityId}`);
        console.error(error);
    }
};
//# sourceMappingURL=audit.service.js.map