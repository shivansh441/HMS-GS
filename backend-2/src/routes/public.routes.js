import { Router } from 'express';
import { getPublicProperties, getPublicPropertyById, getPublicUnitsByPropertyId } from '../controllers/property.controller.js';
import { createPublicReservation } from '../controllers/reservation.controller.js';
const router = Router();
// ----------------------------------------------------------------------
// PUBLIC PROPERTY ROUTES (No authentication required)
// ----------------------------------------------------------------------
// Get all available properties for public website
router.get('/properties', getPublicProperties);
// Get a specific property's details for public website
router.get('/properties/:propertyId', getPublicPropertyById);
// Get available units for a specific property
router.get('/properties/:propertyId/units', getPublicUnitsByPropertyId);
// ----------------------------------------------------------------------
// PUBLIC RESERVATION ROUTES (No authentication required)
// ----------------------------------------------------------------------
// Create a reservation request
router.post('/reservations', createPublicReservation);
export default router;
//# sourceMappingURL=public.routes.js.map