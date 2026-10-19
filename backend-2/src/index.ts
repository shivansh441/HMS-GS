import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

// ----------------------------------------------------------------------
// ROUTE IMPORTS (Strict .js extensions for ESM compatibility)
// ----------------------------------------------------------------------
import authRoutes from './routes/auth.routes.js';           // Phase 2: Identity & Security
import propertyRoutes from './routes/property.routes.js';   // Phase 3.1: Property Management
import unitRoutes from './routes/unit.routes.js';           // Phase 3.3: Unit Inventory
import blockRoutes from './routes/block.routes.js';         // Phase 3.4: Maintenance Blocks
import reservationRoutes from './routes/reservation.routes.js'; // Phase 4.1: Reservations
import allReservationsRoutes from './routes/allReservations.routes.js'; // Phase 4.1: All Reservations
import frontdeskRoutes from './routes/frontdesk.routes.js'; // Phase 4.2: Front Desk Operations
import rosterRoutes from './routes/roster.routes.js';       // Phase 4.3: Roster & Reallocation
import guestRoutes from './routes/guest.routes.js';         // Phase 4.4: Guest Management

import './services/cron.service.js';
import amenityRoutes from './routes/amenity.routes.js';     // Phase 6: Amenities
import publicRoutes from './routes/public.routes.js';       // Public website routes

import analyticsRoutes from './routes/analytics.routes.js'; // Phase 10: Analytics & Dashboards
import communicationRoutes from './routes/communication.routes.js'; // Phase 11: Communications
import accountRoutes from './routes/account.routes.js';
import diningRoutes from './routes/dining.routes.js';

// --- PHASE 12: SECURITY IMPORTS ---
import { setupSecurity } from './middlewares/security.middleware.js';

const app = express();
const PORT = process.env.PORT || 8000;

// ----------------------------------------------------------------------
// GLOBAL SECURITY MIDDLEWARES (PHASE 12)
// ----------------------------------------------------------------------
// Bootstraps Helmet, strict CORS, and Global Rate Limiting
setupSecurity(app);
  
// ----------------------------------------------------------------------
// STANDARD MIDDLEWARES
// ----------------------------------------------------------------------
app.use(express.json()); // Parses incoming JSON payloads into req.body
app.use(cookieParser()); // Parses incoming cookies (crucial for refresh tokens)

// ----------------------------------------------------------------------
// REQUEST LOGGING MIDDLEWARE
// ----------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// ----------------------------------------------------------------------
// SYSTEM HEALTH CHECK
// ----------------------------------------------------------------------
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ONLINE', 
    timestamp: new Date().toISOString(),
    message: 'Maharanapratap Enterprise API is operational.' 
  });
});

// ----------------------------------------------------------------------
// PUBLIC WEBSITE ROUTES (No authentication required)
// ----------------------------------------------------------------------
app.use('/api/public', publicRoutes); 

// ----------------------------------------------------------------------
// PROTECTED API ROUTER MOUNTING
// ----------------------------------------------------------------------
// Phase 2: Identity & Security
app.use('/api/auth', authRoutes);
app.use('/api/reservations', allReservationsRoutes);

// Phase 3: Real Estate & Financial Frameworks
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propertyId/units', unitRoutes);
app.use('/api/properties/:propertyId/units/:unitId/blocks', blockRoutes);

// Phase 4: Reservations & Guest Operations
app.use('/api/properties/:propertyId/reservations', reservationRoutes);
app.use('/api/properties/:propertyId/frontdesk', frontdeskRoutes);
app.use('/api/properties/:propertyId/roster', rosterRoutes);
app.use('/api/properties/:propertyId/guests', guestRoutes);


// Phase 6: Amenities
app.use('/api/properties/:propertyId/amenities', amenityRoutes);
app.use('/api/properties/:propertyId/dining', diningRoutes);

// Phase 10: Analytics Command Center
app.use('/api/properties/:propertyId/analytics', analyticsRoutes);

// Phase 11: Internal & External Communications
app.use('/api/properties/:propertyId/communication', communicationRoutes);

app.use('/api/accounts', accountRoutes);

// ----------------------------------------------------------------------
// GLOBAL ERROR TRAP
// ----------------------------------------------------------------------
// Catches any raw errors that slip past your controller try/catch blocks
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[System Failure Trap]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  res.status(500).json({ error: 'A critical system error occurred. Operations logged.' });
});

// ----------------------------------------------------------------------
// IGNITION
// ----------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Maharanapratap Core Engine successfully booted on port ${PORT}`);
});