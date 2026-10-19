// ============================================================================
// ROLE AUTHORIZATION MIDDLEWARE
// ============================================================================
/**
 * Factory function to generate a middleware that restricts route access
 * based on the user's role.
 * @param allowedRoles - An array of roles (e.g., ['SUPER_ADMIN', 'MANAGER']) permitted to access the route
 * @returns Express middleware function
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // 1. Ensure the user object exists (requires requireAuth to run first)
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required. User context missing.' });
                return;
            }
            // 2. Check if the user's role is in the allowed list
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({ error: 'Insufficient permissions.' });
                return;
            }
            // 3. User is authorized, proceed to the next handler
            next();
        }
        catch (error) {
            console.error('[Role Middleware Error]:', error);
            res.status(500).json({ error: 'Internal server error during authorization.' });
            return;
        }
    };
};
//# sourceMappingURL=role.middleware.js.map