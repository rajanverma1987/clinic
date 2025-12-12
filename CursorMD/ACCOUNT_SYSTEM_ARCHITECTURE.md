# Account System Architecture - Complete Implementation

## 🎯 System Overview

This document describes the complete account creation and management system with proper role hierarchy and access control.

## ✅ What Has Been Implemented

### 1. **Fixed Authentication Persistence**
- **Issue Fixed**: Page refresh now maintains logged-in user session
- **Solution**: 
  - Store user info in localStorage for persistence
  - Proper token storage and retrieval
  - Enhanced auth check with fallback to stored user info
  - Token refresh on activity

### 2. **Role Hierarchy**

```
Super Admin (super_admin)
  ├── Full system access
  ├── Can create: Super Admin, Clinic Admin
  └── Can manage: All tenants, all users, all data

Clinic Admin (clinic_admin)
  ├── Manages single clinic/tenant
  ├── Can create: Doctor, Manager, Staff (nurse, receptionist, etc.)
  └── Can manage: Clinic users, clinic settings

Doctor (doctor)
  ├── Clinical operations
  ├── Can create: Manager accounts (limited access)
  └── Can manage: Patients, appointments, prescriptions

Manager (manager) - NEW
  ├── External use account
  ├── Limited access (read-only for most operations)
  └── Cannot access: Financial data, PHI, critical settings

Staff Roles
  ├── Nurse
  ├── Receptionist
  ├── Accountant
  └── Pharmacist
```

### 3. **Account Creation Flow**

#### Public Registration (`/register`)
- **Only creates**: Doctor accounts
- **Requires**: Clinic association (tenantId)
- **Error if no clinic**: "Doctor accounts must be associated with an existing clinic. Please contact your clinic administrator."
- **Future**: Can add invitation code system

#### Super Admin Creation (`/admin/create-admin`)
- **Can create**: Super Admin, Clinic Admin
- **Access**: Super Admin only
- **Features**:
  - Full form validation
  - Password confirmation
  - Role selection
  - Success/error handling

#### Manager Creation (`/settings/create-manager`)
- **Can create**: Manager accounts
- **Access**: Doctors and Clinic Admins only
- **Features**:
  - Limited access explanation
  - Password management
  - Created within same tenant

### 4. **Manager Role - Limited Access**

Manager accounts have restricted permissions:
- ✅ **Can View**:
  - Appointments (read-only)
  - Queue status (read-only)
  - Basic patient information (no PHI)
  
- ❌ **Cannot Access**:
  - Financial data (invoices, payments)
  - Full patient PHI (encrypted data)
  - Critical settings
  - User management
  - System configuration

### 5. **Registration Service Logic**

```javascript
// Public registration flow:
1. User submits registration form
2. System enforces doctor role only
3. Checks if tenantId provided
4. If no tenantId → Error: "Contact clinic administrator"
5. If tenantId → Creates doctor account in that clinic
6. Auto-login after successful registration
```

## 📋 Implementation Details

### Files Created/Modified

1. **Authentication Persistence**:
   - `contexts/AuthContext.jsx` - Enhanced with userInfo storage
   - `lib/api/client.js` - Token management

2. **Account Creation Pages**:
   - `app/admin/create-admin/page.jsx` - Super admin creation
   - `app/settings/create-manager/page.jsx` - Manager creation

3. **Registration Updates**:
   - `app/register/page.jsx` - Doctor-only registration
   - `services/auth.service.js` - Registration logic updates
   - `lib/validations/auth.js` - Added manager role

4. **Model Updates**:
   - `models/User.js` - Added MANAGER role

5. **Navigation**:
   - `components/layout/Sidebar.jsx` - Added "Create Admin" link
   - `app/admin/page.jsx` - Added "Create Admin" quick action
   - `app/settings/page.jsx` - Added manager creation section

## 🔐 Security & Access Control

### Role-Based Permissions

**Super Admin**:
- ✅ Create super admin accounts
- ✅ Create clinic admin accounts
- ✅ Access all system data
- ✅ Manage all tenants

**Clinic Admin**:
- ✅ Create doctor accounts
- ✅ Create manager accounts
- ✅ Create staff accounts
- ✅ Manage clinic settings

**Doctor**:
- ✅ Create manager accounts
- ✅ Full clinical access
- ❌ Cannot create other doctors
- ❌ Cannot access other clinics

**Manager**:
- ✅ View appointments (read-only)
- ✅ View queue (read-only)
- ✅ Basic patient info (no PHI)
- ❌ No financial access
- ❌ No settings access
- ❌ No user management

## 🚀 How The System Runs

### Account Creation Flow

1. **Public Registration**:
   ```
   User → /register → Doctor Account (requires clinic)
   ```

2. **Super Admin Creates Admin**:
   ```
   Super Admin → /admin/create-admin → Super Admin or Clinic Admin
   ```

3. **Doctor Creates Manager**:
   ```
   Doctor → /settings → Profile Tab → Create Manager → Manager Account
   ```

4. **Clinic Admin Creates Users**:
   ```
   Clinic Admin → /settings → Doctors Tab → Create User → Any Staff Role
   ```

### Authentication Flow

1. **Login**:
   - User enters credentials
   - System validates and returns tokens
   - Tokens stored in localStorage
   - User info stored for persistence

2. **Page Refresh**:
   - Check localStorage for tokens
   - Validate token with `/auth/me`
   - If token expired, refresh using refreshToken
   - Restore user from stored userInfo if needed
   - Maintain session across refreshes

3. **Token Refresh**:
   - Automatic refresh on activity
   - Refresh if token expires within 30 minutes
   - Background refresh every 5 minutes

## 📝 Best Practices Implemented

1. **Role Hierarchy**: Clear separation of permissions
2. **Access Control**: Role-based restrictions enforced
3. **Security**: Password hashing, token management
4. **User Experience**: Clear error messages, proper validation
5. **Persistence**: Session maintained across page refreshes
6. **Limited Access**: Manager role with restricted permissions

## 🔄 Future Enhancements

1. **Invitation Code System**: For doctor registration
2. **Manager Permissions UI**: Visual permission matrix
3. **Audit Logs**: Track all account creations
4. **Bulk User Import**: CSV import for multiple users
5. **Account Templates**: Pre-configured role templates

## ✨ Summary

The system now provides:
- ✅ Fixed authentication persistence (no more logout on refresh)
- ✅ Doctor-only public registration
- ✅ Super admin can create admin accounts
- ✅ Doctors can create manager accounts (limited access)
- ✅ Proper role hierarchy and access control
- ✅ Complete account management system

**The system is production-ready with proper security and access control!**

