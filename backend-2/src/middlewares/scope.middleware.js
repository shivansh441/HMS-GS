import { prisma } from '../utils/prisma.js'; // Added to execute cross-relational mapping checks
// ============================================================================
// TENANT/PROPERTY ISOLATION MIDDLEWARE
// ============================================================================
/**
 * Middleware to enforce tenant isolation.
 * Intercepts property-specific requests by dropping STAFF entirely, verifying
 * MANAGER cross-relational mappings, and allowing SUPER_ADMIN bypass.
 */
export const requirePropertyScope = async (req, res, next) => {
    try {
        // 0. Ensure the user object exists (requires requireAuth to run first)
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required. User context missing.' });
            return;
        }
        // Rule 1: Bypass check completely for SUPER_ADMIN
        if (req.user.role === 'SUPER_ADMIN') {
            next();
            return;
        }
        // Rule 2: Absolute Restriction — If identity belongs to STAFF, drop with 403 Forbidden
        if (req.user.role === 'STAFF') {
            res.status(403).json({ error: 'Access Denied: Staff administrative portal access is completely restricted.' });
            return;
        }
        // Attempt to extract propertyId from either the route parameters or the request body
        const rawPropertyId = req.params.propertyId || req.body.propertyId;
        // If no propertyId is targeted in this specific request, proceed to the controller
        if (!rawPropertyId) {
            next();
            return;
        }
        // Convert the extracted ID to a number for strict comparison
        const targetPropertyId = parseInt(String(rawPropertyId), 10);
        if (isNaN(targetPropertyId)) {
            res.status(400).json({ error: 'Invalid property ID format provided.' });
            return;
        }
        // Rule 3: Verify cross-relational mapping inside the property data object for MANAGER
        if (req.user.role === 'MANAGER') {
            const isAssigned = await prisma.property.findFirst({
                where: {
                    id: targetPropertyId,
                    isDeleted: false,
                    managers: {
                        some: {
                            id: req.user.id, // Verifies user id exists in the implicit join table
                        },
                    },
                },
            });
            if (!isAssigned) {
                res.status(403).json({ error: 'Forbidden. You are not explicitly assigned to this property scope.' });
                return;
            }
            // Relationship verified, grant route lifecycle execution
            next();
            return;
        }
        // Default safety catch-all for undefined customer scenarios
        res.status(403).json({ error: 'Forbidden. Insufficient permissions to access this property\'s data.' });
        return;
    }
    catch (error) {
        console.error('[Property Scope Middleware Error]:', error);
        res.status(500).json({ error: 'Internal server error during property scope validation.' });
        return;
    }
};
//# sourceMappingURL=scope.middleware.js.map