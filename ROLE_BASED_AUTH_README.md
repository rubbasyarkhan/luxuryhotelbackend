# Luxury Stay Management System - Role-Based Authentication

## Overview
This system implements a comprehensive role-based authentication system for a luxury hotel management platform with five distinct user roles.

## User Roles

### 1. Admin (Highest Privileges)
- **Access Level**: Full system access
- **Capabilities**:
  - Manage all users (view, create, update, delete)
  - Assign and change user roles
  - Activate/deactivate user accounts
  - Access all system features
  - View system analytics and reports

### 2. Manager (High Privileges)
- **Access Level**: Management-level access
- **Capabilities**:
  - View and manage staff (except admins)
  - Access management reports
  - Oversee operations
  - Manage room assignments
  - Handle customer complaints

### 3. Receptionist (Medium Privileges)
- **Access Level**: Front desk operations
- **Capabilities**:
  - Guest check-in/check-out
  - Room booking and reservations
  - Guest information management
  - Basic reporting
  - Customer service

### 4. Housekeeping (Limited Privileges)
- **Access Level**: Housekeeping operations
- **Capabilities**:
  - Room status updates
  - Maintenance requests
  - Cleaning schedules
  - Inventory management
  - Basic guest information

### 5. Guest (Basic Access)
- **Access Level**: Guest portal access
- **Capabilities**:
  - View own bookings
  - Make reservations
  - Update personal information
  - Request services
  - View room status

## API Endpoints

### Public Routes
```
POST /api/users/Signup - User registration
POST /api/users/Login - User login
POST /api/users/forgotpassword - Forgot password
POST /api/users/verifyotp - Verify OTP
POST /api/users/resetpassword - Reset password
```

### Protected Routes
```
GET /api/users/profile - Get user profile (All authenticated users)
```

### Admin Only Routes
```
GET /api/users/users - Get all users
PATCH /api/users/:userId/role - Update user role
PATCH /api/users/:userId/status - Toggle user active status
```

### Role-Specific Dashboard Routes
```
GET /api/users/admin/dashboard - Admin dashboard
GET /api/users/manager/dashboard - Manager dashboard
GET /api/users/receptionist/dashboard - Receptionist dashboard
GET /api/users/housekeeping/dashboard - Housekeeping dashboard
GET /api/users/guest/dashboard - Guest dashboard
```

## Authentication Flow

### 1. User Registration
```javascript
POST /api/users/Signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Guest" // Optional, defaults to "Guest"
}
```

### 2. User Login
```javascript
POST /api/users/Login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Using Protected Routes
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role Hierarchy
```
Admin > Manager > Receptionist/Housekeeping > Guest
```

- **Admin**: Can access everything
- **Manager**: Can access everything except admin management
- **Receptionist**: Can access guest and booking management
- **Housekeeping**: Can access room and maintenance management
- **Guest**: Can access only personal information and bookings

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  profileImage: String (required),
  role: String (enum: ['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  token: String,
  otp: {
    value: String,
    expireAt: Date,
    verified: Boolean
  },
  timestamps: true
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with:
```
JWT_SECRET_KEY=your-secret-key
MONGODB_URI=your-mongodb-connection-string
```

### 3. Create Admin User
Run the admin creation script:
```bash
node src/utils/createAdmin.js
```

Default admin credentials:
- Email: admin@luxurystay.com
- Password: admin123

### 4. Start the Server
```bash
npm start
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access Control**: Granular permission system
4. **Account Status**: Users can be activated/deactivated
5. **OTP Verification**: For password reset functionality
6. **Input Validation**: All inputs are validated
7. **Error Handling**: Comprehensive error handling

## Middleware Functions

### Authentication Middleware
- `authMiddleware`: Verifies JWT token
- `authorizeRoles(...roles)`: Checks user roles
- `requireAdmin`: Admin-only access
- `requireManager`: Manager and above access
- `requireReceptionist`: Receptionist and above access
- `requireHousekeeping`: Housekeeping and above access
- `requireGuest`: All authenticated users

## Error Responses

### Authentication Errors
```javascript
{
  "message": "No token provided, authorization denied"
}
```

### Authorization Errors
```javascript
{
  "message": "Access denied. Required roles: Admin, Manager"
}
```

### Validation Errors
```javascript
{
  "message": "Please fill all required fields"
}
```

## Best Practices

1. **Always validate roles** before processing requests
2. **Use HTTPS** in production
3. **Implement rate limiting** for login attempts
4. **Regular token rotation** for security
5. **Log all authentication events** for audit trails
6. **Implement session management** for better security
7. **Use environment variables** for sensitive data

## Testing

Test the role-based system using different user accounts:

1. Create users with different roles
2. Test access to role-specific endpoints
3. Verify that lower roles cannot access higher-privilege endpoints
4. Test admin functions (user management, role updates)

## Future Enhancements

1. **Permission Groups**: More granular permissions
2. **Session Management**: Better session handling
3. **Audit Logs**: Track all user actions
4. **Two-Factor Authentication**: Additional security layer
5. **API Rate Limiting**: Prevent abuse
6. **Password Policies**: Enforce strong passwords
