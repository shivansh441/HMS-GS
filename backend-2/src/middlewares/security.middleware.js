import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
const isProduction = process.env.NODE_ENV === 'production';
// ==========================================
// 1. STRICT LIMITER (For Login & Auth)
// ==========================================
// Blocks brute-force password guessing.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 10 : 100,
    message: { error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// ==========================================
// 2. GLOBAL LIMITER (For General API Traffic)
// ==========================================
// Prevents Denial of Service (DoS) attacks from crashing your server.
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 300 : 5000,
    message: { error: 'Too many requests from this IP. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/auth'),
});
// ==========================================
// 3. GLOBAL SECURITY BOOTSTRAPPER
// ==========================================
export const setupSecurity = (app) => {
    // 1. Helmet: Sets 15+ invisible security headers (XSS protection, prevents MIME-sniffing, etc.)
    app.use(helmet());
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ].filter(Boolean);
    // 2. CORS: Restrict who can talk to your API
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin not allowed by CORS: ${origin}`));
        },
        credentials: true, // Crucial for passing JWTs/Cookies securely
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    // 3. Apply the Global Rate Limiter to ALL /api/ routes automatically
    app.use('/api', globalLimiter);
};
//# sourceMappingURL=security.middleware.js.map