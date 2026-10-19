import { Router } from 'express';
// Note: .js extensions are required here for NodeNext/ESM compatibility!
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePropertyScope } from '../middlewares/scope.middleware.js';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} from '../controllers/property.controller.js';

const router = Router();

// ----------------------------------------------------------------------
// GLOBAL MIDDLEWARE
// ----------------------------------------------------------------------
// Require a valid, unexpired JWT for EVERY route in this file
router.use(requireAuth);

// ----------------------------------------------------------------------
// SYSTEM-WIDE ROUTES (No specific property scope needed)
// ----------------------------------------------------------------------

// Create a new property (Strictly SUPER_ADMIN)
router.post(
  '/',
  requireRole(['SUPER_ADMIN']),
  createProperty
);

// Get all properties (Controller handles filtering based on user role)
router.get(
  '/',
  getProperties
);

// ----------------------------------------------------------------------
// TENANT-SPECIFIC ROUTES (Requires property scope validation)
// ----------------------------------------------------------------------

// Get a specific property's details
router.get(
  '/:propertyId',
  requirePropertyScope,
  getPropertyById
);

// Update a property (Super Admins & Managers Only)
router.patch(
  '/:propertyId',
  requireRole(['SUPER_ADMIN', 'MANAGER']),
  requirePropertyScope,
  updateProperty
);

// Soft-Delete/Deactivate a property (Strictly SUPER_ADMIN + Password check)
// We use POST instead of DELETE because we are sending a password payload in the body
router.post(
  '/:propertyId/deactivate',
  requireRole(['SUPER_ADMIN']),
  deleteProperty
);

export default router;