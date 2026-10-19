# Login System Documentation

## Overview

This document provides comprehensive documentation for the authentication and login system used in the Maharana Pratap Hostels Admin Portal and backend API.

## Architecture

The authentication system follows a modern JWT-based architecture with refresh tokens for enhanced security:

- **Backend**: Node.js/Express with Prisma ORM
- **Frontend**: React with Redux Toolkit for state management
- **Database**: PostgreSQL with Prisma schema
- **Authentication**: JWT access tokens + HTTP-only refresh token cookies

## Backend Implementation

### Authentication Endpoints

#### 1. Admin Panel Login
- **Endpoint**: `POST /api/auth/login`
- **Purpose**: Admin panel authentication for staff and managers
- **Access**: Restricted to `STAFF`, `MANAGER`, and `SUPER_ADMIN` roles only
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "admin@example.com",
      "role": "MANAGER"
    }
  }
  ```
- **Cookies**: Sets `refreshToken` as HTTP-only cookie (7 days expiry)

#### 2. Public Website Login
- **Endpoint**: `POST /api/auth/website-login`
- **Purpose**: Public website authentication for customers
- **Access**: Available for all account types
- **Request Body**: Same as admin login
- **Response**: Includes `customerType` field for routing

#### 3. Registration
- **Endpoint**: `POST /api/auth/register`
- **Purpose**: Public user registration
- **Access**: Public endpoint
- **Security**: Forces `CUSTOMER` role and `NONE` customer type
- **Request Body**:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "customerType": "HOTEL_GUEST"
  }
  ```

#### 4. Token Refresh
- **Endpoint**: `POST /api/auth/refresh`
- **Purpose**: Issue new access token using refresh token
- **Authentication**: Uses HTTP-only `refreshToken` cookie
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 5. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Purpose**: Destroy session and clear cookies
- **Authentication**: Uses HTTP-only `refreshToken` cookie
- **Response**:
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

### Security Features

1. **Role-Based Access Control**: 
   - Admin login restricted to `STAFF`, `MANAGER`, `SUPER_ADMIN`
   - Customer login available for all roles

2. **Token Security**:
   - Access tokens: 15-minute expiry
   - Refresh tokens: 7-day expiry, stored in HTTP-only cookies
   - SHA-256 hashing for refresh token storage

3. **Password Security**:
   - Bcrypt hashing with 12 salt rounds
   - Password validation on login

4. **Session Management**:
   - Database-backed session storage
   - IP address and user agent tracking
   - Automatic cleanup of expired sessions

## Frontend Implementation

### Redux Store Structure

#### Auth Slice (`src/store/slices/authSlice.ts`)
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  error: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}
```

#### Actions
- `loginUser`: Async thunk for login
- `logout`: Clear auth state
- `clearAuthError`: Clear error messages

### Service Layer

#### Auth Service (`src/services/authService.ts`)
```typescript
export const loginUserApi = async (email: string, password: string): Promise<LoginResponse>
export const refreshTokenApi = async (): Promise<{ accessToken: string }>
export const logoutApi = async (): Promise<{ message: string }>
```

### Login Page (`src/pages/Login.tsx`)

Features:
- React 19 Action State for form handling
- GSAP animations for enhanced UX
- Error handling with visual feedback
- Automatic navigation on successful login
- Theme toggle support

### Configuration

#### Environment Variables (`.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_PORT=5173
```

#### Backend Environment Variables (`.env`)
```env
PORT=8000
NODE_ENV=development
DATABASE_URL='postgres://...'
ACCESS_TOKEN_SECRET="sk_access_..."
REFRESH_TOKEN_SECRET="sk_refresh_..."
```

## User Roles and Permissions

### Account Roles
- **SUPER_ADMIN**: Full system access, can manage all properties and accounts
- **MANAGER**: Property management, staff oversight, restricted from admin accounts
- **STAFF**: Operational tasks within assigned properties
- **CUSTOMER**: Limited access, self-service features

### Customer Types
- **HOSTELER**: Long-term hostel residents
- **HOSTEL_GUEST**: Short-term hostel visitors
- **HOTEL_GUEST**: Short-term hotel guests
- **NONE**: Internal system administration/staff

## Database Schema

### Key Models

#### Account
```prisma
model Account {
  id               Int          @id @default(autoincrement())
  role             AccountRole  @default(CUSTOMER)
  customerType     CustomerType @default(NONE)
  firstName        String
  lastName         String
  email            String?      @unique
  passwordHash     String?
  // ... additional fields
  sessions          Session[]
  managedProperties Property[]        @relation("PropertyManagers")
  staffProperties   Property[]        @relation("PropertyStaff")
}
```

#### Session
```prisma
model Session {
  id           String   @id @default(uuid())
  accountId    Int
  account      Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime @db.Timestamptz(6)
}
```

## Authentication Flow

### Login Process
1. User enters credentials in login form
2. Frontend calls `loginUserApi` with email/password
3. Backend validates credentials and role permissions
4. Backend generates access token (15min) and refresh token (7days)
5. Refresh token stored in HTTP-only cookie
6. Access token returned in response
7. Frontend stores access token in Redux state and localStorage
8. User redirected to dashboard

### Token Refresh Process
1. Access token expires (15 minutes)
2. Frontend calls `refreshTokenApi`
3. Backend validates refresh token from cookie
4. Backend issues new access token
5. Frontend updates Redux state
6. User session continues seamlessly

### Logout Process
1. User clicks logout
2. Frontend calls `logoutApi`
3. Backend destroys session in database
4. Backend clears refresh token cookie
5. Frontend clears Redux state and localStorage
6. User redirected to login page

## Error Handling

### Common Error Scenarios

1. **Invalid Credentials**
   - Error: "Invalid credentials or inactive account."
   - Resolution: Check email/password, verify account is active

2. **Access Denied**
   - Error: "Access denied. You do not have permission to access the admin panel."
   - Resolution: User must have STAFF, MANAGER, or SUPER_ADMIN role

3. **Session Expired**
   - Error: "Session expired or invalid. Please log in again."
   - Resolution: User must re-authenticate

4. **Network Errors**
   - Error: "Internal server error."
   - Resolution: Check backend server status and network connectivity

## Development Setup

### Backend Setup
```bash
cd backend-2
npm install
cp .env.example .env  # Configure environment variables
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd my-admin-portal
npm install
cp .env.example .env  # Configure API URL
npm run dev
```

## Testing

### Manual Testing Steps
1. Start backend server on port 8000
2. Start frontend dev server on port 5173/5174
3. Navigate to http://localhost:5173
4. Test login with valid admin credentials
5. Verify token storage and navigation
6. Test logout functionality
7. Test token refresh (wait 15 minutes or simulate expiry)

### Test Accounts
Ensure test accounts exist in database with appropriate roles:
- Super Admin: Full access
- Manager: Property management access
- Staff: Operational access
- Customer: Limited access

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS configuration allows frontend origin
   - Check security middleware settings

2. **Cookie Issues**
   - Verify `credentials: 'include'` in fetch requests
   - Check cookie domain and path settings
   - Ensure HTTPS in production (cookies require secure flag)

3. **Token Validation Failures**
   - Verify `ACCESS_TOKEN_SECRET` matches between environments
   - Check token expiry times
   - Ensure system time is synchronized

4. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL server status
   - Ensure Prisma client is generated

## Security Best Practices

1. **Never commit secrets**: Keep `.env` files out of version control
2. **Use HTTPS in production**: Required for secure cookies
3. **Rotate secrets regularly**: Update JWT secrets periodically
4. **Monitor failed logins**: Implement rate limiting and monitoring
5. **Keep dependencies updated**: Regular security updates
6. **Use strong passwords**: Enforce password complexity requirements

## Support

For issues or questions related to the login system:
1. Check this documentation first
2. Review error messages in browser console and backend logs
3. Verify environment configuration
4. Check database connectivity and schema
5. Ensure all services are running

## Changelog

### Recent Updates
- Fixed TypeScript compilation errors in frontend
- Created missing service files (authService, propertyService, unitService)
- Added proper type definitions for authentication
- Fixed role-based access control in backend
- Corrected property association queries in leave controller
- Added proper null handling for nullable date fields
- Enhanced error handling across authentication flow

### Known Issues
- None currently identified

---

**Last Updated**: 2026-09-06
**Version**: 1.0.0
**Maintained By**: Maharana Pratap Hostels Development Team
