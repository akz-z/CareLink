# CareLink Login Flow Documentation

## Overview
A basic login flow has been implemented for the CareLink application with the following features:
- Login form with email/password validation
- Session persistence using localStorage
- Protected dashboard (shows after login)
- Logout functionality
- Demo credentials for testing

## Components

### LoginForm Component
**Location:** `app/components/LoginForm.jsx`

A client-side form component that handles user authentication. Features:
- Email and password input fields
- Real-time form validation
- Error message display
- Loading state during authentication
- Demo credentials display for testing

**Props:**
- `onLoginSuccess(userData)` - Callback when login is successful

**Usage:**
```jsx
import LoginForm from "./components/LoginForm";

<LoginForm onLoginSuccess={(user) => {
  console.log("User logged in:", user);
}} />
```

### Styles
**Location:** `app/components/LoginForm.module.css`

CSS Module with responsive design using CSS custom properties defined in `app/globals.css`:
- `--sage` - Primary color
- `--ink` - Text color
- `--shadow-md` - Medium shadow effect

## API Routes

### POST /api/auth/login
**Location:** `app/api/auth/login/route.js`

Authenticates user credentials and returns user data + token.

**Request:**
```json
{
  "email": "demo@carelink.com",
  "password": "demo123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "1",
    "email": "demo@carelink.com",
    "name": "Demo User",
    "joinDate": "2026-03-28T..."
  },
  "token": "base64-encoded-token",
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

### POST /api/auth/logout
**Location:** `app/api/auth/logout/route.js`

Clears user session.

## Hooks

### useAuth Hook
**Location:** `app/hooks/useAuth.js`

Custom React hook for managing authentication state. Can be used in any component.

**Return Value:**
```javascript
{
  user,        // Current user object or null
  isLoggedIn,  // Boolean indicating auth status
  isLoading,   // Boolean indicating initial load state
  login,       // Function to set user as logged in
  logout       // Function to clear auth state
}
```

**Usage:**
```jsx
"use client";
import { useAuth } from "@/app/hooks/useAuth";

export default function MyComponent() {
  const { user, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

## Main Page Flow

**Location:** `app/page.jsx`

The landing page now implements a full authentication flow:

1. **Loading State** - Shows "Loading..." while checking session
2. **Not Logged In** - Shows `LoginForm` component
3. **Logged In** - Shows dashboard with:
   - User welcome message in header
   - Logout button
   - Dashboard cards (Scheduler, Journal, Recovery tools)

## Demo Credentials
For testing purposes, use:
- **Email:** `demo@carelink.com`
- **Password:** `demo123`

## Session Storage
Authentication state is persisted in browser's localStorage:
- `user` - Stringified user object
- `token` - Authentication token

## Future Enhancements
- Integrate with real backend authentication (JWT, OAuth, etc.)
- Add sign-up functionality
- Implement "Remember me" option
- Add password reset flow
- Add two-factor authentication
- Store tokens more securely (httpOnly cookies)
- Add session expiry/refresh logic
