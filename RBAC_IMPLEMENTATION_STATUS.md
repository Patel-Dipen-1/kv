# RBAC System Implementation Status

## ✅ Completed (Backend)

### 1. Permissions System
- ✅ Created `backend/constants/permissions.js` with all permission definitions
- ✅ Permissions organized by category (User Management, Events, Committee, etc.)
- ✅ Helper functions for permission management

### 2. Role Model
- ✅ Created `backend/models/roleModel.js`
- ✅ Role schema with permissions Map
- ✅ System role flag (admin/user/committee cannot be deleted)
- ✅ Auto-generate roleKey from roleName
- ✅ Instance methods: `hasPermission()`, `getEnabledPermissions()`

### 3. User Model Updates
- ✅ Added `roleRef` field (references Role model)
- ✅ Kept existing `role` field for backward compatibility
- ✅ Index on roleRef for faster queries

### 4. Role Controller
- ✅ `createRole` - Create custom roles
- ✅ `getAllRoles` - List all roles with user counts
- ✅ `getRoleById` - Get role details with permissions
- ✅ `updateRole` - Update role permissions (with system role protection)
- ✅ `deleteRole` - Soft delete custom roles (with validation)
- ✅ `assignRoleToUser` - Assign role to user
- ✅ `getAllPermissions` - Get all available permissions for forms
- ✅ `initializeSystemRoles` - Create default Admin/User/Committee roles

### 5. Permission Middleware
- ✅ `authorizePermission(permissionKey)` - Check single permission
- ✅ `authorizeAnyPermission([keys])` - Check if user has any of the permissions
- ✅ `authorizeAllPermissions([keys])` - Check if user has all permissions
- ✅ Auto-populates role and permissions in request object

### 6. Routes
- ✅ Created `backend/routes/roleRoutes.js`
- ✅ All routes protected with `canManageRoles` permission
- ✅ Added routes to `app.js`
- ✅ Route: `POST /api/admin/roles/initialize` - Initialize system roles

### 7. Auth Updates
- ✅ Updated login to populate `roleRef`
- ✅ Updated `getMe` to populate `roleRef`
- ✅ User data includes role and permissions on login

### 8. Initialization Script
- ✅ Created `backend/scripts/initializeRoles.js`
- ✅ Run once to create default system roles

---

## ⏳ In Progress / TODO

### Backend
- [ ] Update existing routes to use permission middleware instead of `authorizeRoles`
- [ ] Update `updateRole` in userController to also set `roleRef`
- [ ] Auto-assign default "User" role to new registrations
- [ ] Migration script to assign roles to existing users

### Frontend
- [ ] Create `frontend/src/constants/permissions.js` ✅ (DONE)
- [ ] Create role management Redux slice
- [ ] Create role management pages:
  - [ ] Roles list page
  - [ ] Create/Edit role form with permission checkboxes
  - [ ] Role detail view
- [ ] Create permission checking hook: `usePermission()`
- [ ] Update sidebar to show/hide menu items based on permissions
- [ ] Update route protection to check permissions
- [ ] Update action buttons to check permissions before showing
- [ ] Add role assignment UI in user management
- [ ] Update user detail modal to show role and permissions

---

## 📋 Next Steps

### Step 1: Initialize System Roles
```bash
node backend/scripts/initializeRoles.js
```

### Step 2: Assign Admin Role to Existing Admin Users
Run a migration script to assign the "Admin" role to users with `role: "admin"`

### Step 3: Frontend Implementation
1. Create Redux slice for roles
2. Create role management UI
3. Create permission checking utilities
4. Update all components to use permissions

---

## 🔑 Key Files Created

**Backend:**
- `backend/constants/permissions.js` - All permission definitions
- `backend/models/roleModel.js` - Role model
- `backend/controllers/roleController.js` - Role CRUD operations
- `backend/middleware/permissions.js` - Permission checking middleware
- `backend/routes/roleRoutes.js` - Role API routes
- `backend/scripts/initializeRoles.js` - Role initialization script

**Frontend:**
- `frontend/src/constants/permissions.js` - Frontend permission constants

---

## 📝 API Endpoints

### Role Management (All require `canManageRoles` permission)
- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/:id` - Get role by ID
- `POST /api/admin/roles` - Create new role
- `PATCH /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/permissions` - Get all available permissions
- `POST /api/admin/roles/initialize` - Initialize system roles

### Role Assignment (Requires `canChangeRoles` permission)
- `PATCH /api/admin/roles/users/:userId/assign` - Assign role to user

---

## 🎯 Permission Categories

1. **USER_MANAGEMENT** - View, approve, edit, delete users, change roles
2. **FAMILY_MANAGEMENT** - View, approve, edit, delete family members
3. **COMMITTEE_MANAGEMENT** - Manage and view committee
4. **EVENT_MANAGEMENT** - Create, edit, delete, view events
5. **NOTIFICATION_MANAGEMENT** - Send and manage notifications
6. **MEDIA_MANAGEMENT** - Upload and delete media
7. **REPORTS_ANALYTICS** - View reports and export data
8. **SETTINGS** - Manage app settings and roles

---

## ⚠️ Important Notes

1. **System Roles** (Admin, User, Committee) cannot be deleted
2. **Admin role** has all permissions enabled by default
3. **Custom roles** can be created, edited, and deleted by admins
4. **Role assignment** updates both `roleRef` and `role` fields for compatibility
5. **Permission checks** happen on both frontend (UI) and backend (API)
6. **Default role** for new users should be "User" role

---

## 🚀 Usage Example

### Backend Route Protection
```javascript
const { authorizePermission } = require("../middleware/permissions");

router.post(
  "/events",
  authenticate,
  authorizePermission("canCreateEvents"),
  createEvent
);
```

### Frontend Permission Check
```javascript
import { usePermission } from "../hooks/usePermission";

const canCreate = usePermission("canCreateEvents");

{canCreate && <Button>Create Event</Button>}
```

