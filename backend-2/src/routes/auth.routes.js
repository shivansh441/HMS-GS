import { Router } from 'express';
import { login, websiteLogin, registerPublicUser, refresh, logout, getCurrentUser } from '../controllers/auth.controller.js'; // Adjust path if needed
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/security.middleware.js';
const router = Router();
// ---------------------------------------------------------
// Authentication Routes
// ---------------------------------------------------------
// 1. Admin Panel Login 
// (Already wired to your existing admin frontend)
router.post('/login', authLimiter, login);
// 2. Public Website Login 
// (Point your React landing page login form to this route)
router.post('/website-login', websiteLogin);
// 3. Registration (Defaults to CUSTOMER / NONE)
router.post('/register', registerPublicUser);
// 4. Token Refresh & Logout
router.post('/refresh', refresh);
router.post('/logout', logout);
// 5. Get Current User Info (Protected)
router.get('/me', requireAuth, getCurrentUser);
export default router;
//# sourceMappingURL=auth.routes.js.map