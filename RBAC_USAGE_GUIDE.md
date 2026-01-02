# RBAC System - Complete Usage Guide

## 🚀 Quick Start

### Step 1: Initialize System Roles
```bash
node backend/scripts/seedDatabase.js
```

This will:
- Drop all existing data
- Create 3 system roles (Admin, User, Committee Member)
- Create 4 test users with assigned roles
- Create enum data

### Step 2: Test Accounts Created

**Admin User:**
- Email: `admin@test.com`
- Mobile: `9876543210`
- Password: `12345678`
- Role: Admin (all permissions enabled)

**Regular User:**
- Email: `user@test.com`
- Mobile: `9876543211`
- Password: `12345678`
- Role: User (only view events & committee)

**Committee Member:**
- Email: `committee@test.com`
- Mobile: `9876543212`
- Password: `12345678`
- Role: Committee (view users, family, events, committee, reports)

**Pending User:**
- Email: `pending@test.com`
- Mobile: `9876543213`
- Password: `12345678`
- Role: User (pending approval)

---

## 📋 How the System Works

### Backend Permission Checking

Every protected route uses permission middleware:

```javascript
const { authorizePermission } = require("../middleware/permissions");

router.post(
  "/events",
  authenticate,
  authorizePermission("canCreateEvents"),
  createEvent
);
```

### Frontend Permission Checking

Use the `usePermission` hook in any component:

```javascript
import { usePermission } from "../../hooks/usePermission";

const MyComponent = () => {
  const canCreate = usePermission("canCreateEvents");
  const canEdit = usePermission("canEditEvents");
  
  return (
    <>
      {canCreate && <Button>Create Event</Button>}
      {canEdit && <Button>Edit Event</Button>}
    </>
  );
};
```

---

## 🎯 Permission-Based UI Examples

### Example 1: User with Only "View Profile" Permission

**What they see:**
- ✅ Profile page
- ✅ View their own profile data
- ❌ "Edit Profile" button (hidden - no `canEditUsers` permission)
- ❌ Admin menu items (hidden)
- ❌ Committee page (if no `canViewCommittee` permission)

**What they DON'T see:**
- Any admin features
- Edit buttons
- Delete buttons
- Role management

### Example 2: User with "Committee" Role

**What they see:**
- ✅ Profile page
- ✅ Committee page (has `canViewCommittee`)
- ✅ View users list (has `canViewUsers`)
- ✅ View family members (has `canViewFamilyMembers`)
- ✅ View reports (has `canViewReports`)
- ❌ Approve users button (no `canApproveUsers`)
- ❌ Edit users button (no `canEditUsers`)
- ❌ Role management (no `canManageRoles`)

### Example 3: Custom "Event Manager" Role

**Permissions assigned:**
- ✅ `canCreateEvents`
- ✅ `canEditEvents`
- ✅ `canDeleteEvents`
- ✅ `canViewEvents`
- ✅ `canUploadMedia`
- ❌ All other permissions disabled

**What they see:**
- ✅ Events menu in sidebar
- ✅ "Create Event" button
- ✅ "Edit" and "Delete" buttons on events
- ✅ Media upload option
- ❌ Users menu (no `canViewUsers`)
- ❌ Admin dashboard (no admin permissions)
- ❌ Reports (no `canViewReports`)

---

## 🔧 Creating Custom Roles

### Via Admin Panel

1. Login as Admin
2. Go to **Admin → Role Management** (`/admin/roles`)
3. Click **"Create New Role"**
4. Enter role name (e.g., "Event Manager")
5. Select permissions by category:
   - Check boxes for permissions you want to enable
   - Use "Select All" in category to enable all
   - Use "Clear All" to disable all
6. Click **"Create Role"**

### Via API

```bash
POST /api/admin/roles
Authorization: Bearer <admin_token>

{
  "roleName": "Event Manager",
  "description": "Manages all community events",
  "permissions": {
    "canCreateEvents": true,
    "canEditEvents": true,
    "canDeleteEvents": true,
    "canViewEvents": true,
    "canUploadMedia": true,
    // All other permissions: false
  }
}
```

---

## 👤 Assigning Roles to Users

### Via Admin Panel

1. Go to **Admin → Approved Users** (or Pending Users)
2. Click **"View Details"** on a user
3. Click **"Change Role"** button (if you have `canChangeRoles` permission)
4. Select new role from dropdown
5. Click **"Update Role"**

### Via API

```bash
PATCH /api/admin/roles/users/:userId/assign
Authorization: Bearer <admin_token>

{
  "roleId": "<role_id>"
}
```

---

## 🔍 Testing Different Roles

### Test Scenario 1: Regular User

1. Login as `user@test.com` / `12345678`
2. **Expected:**
   - ✅ See Profile page
   - ✅ See Committee page (public)
   - ❌ No Admin menu
   - ❌ No "Edit Profile" button (if permission not given)
   - ❌ Cannot access `/admin/dashboard` (403 error)

### Test Scenario 2: Committee Member

1. Login as `committee@test.com` / `12345678`
2. **Expected:**
   - ✅ See Profile page
   - ✅ See Committee page
   - ✅ See Admin Dashboard (but limited features)
   - ✅ See Users list (view only)
   - ✅ See Reports
   - ❌ No "Approve Users" button
   - ❌ No "Edit Users" button
   - ❌ No Role Management

### Test Scenario 3: Admin

1. Login as `admin@test.com` / `12345678`
2. **Expected:**
   - ✅ See ALL menu items
   - ✅ See ALL buttons
   - ✅ Can access all pages
   - ✅ Can create/edit/delete roles
   - ✅ Can assign roles to users

---

## 📝 Permission List

### User Management
- `canViewUsers` - View users list
- `canApproveUsers` - Approve/reject pending users
- `canEditUsers` - Edit user details
- `canDeleteUsers` - Delete users
- `canChangeRoles` - Assign roles to users

### Family Management
- `canViewFamilyMembers` - View family members
- `canApproveFamilyMembers` - Approve 6+ family members
- `canEditFamilyMembers` - Edit family member details
- `canDeleteFamilyMembers` - Delete family members

### Committee Management
- `canManageCommittee` - Add/edit/delete committee members
- `canViewCommittee` - View committee page (usually public)

### Event Management
- `canCreateEvents` - Create new events
- `canEditEvents` - Edit existing events
- `canDeleteEvents` - Delete events
- `canViewEvents` - View events (usually public)

### Notification Management
- `canSendNotifications` - Send notifications
- `canManageNotifications` - Edit/delete notifications

### Media Management
- `canUploadMedia` - Upload photos/videos
- `canDeleteMedia` - Delete media files

### Reports & Analytics
- `canViewReports` - Access reports page
- `canExportData` - Export data to CSV/Excel

### Settings
- `canManageSettings` - Modify app settings
- `canManageRoles` - Create/edit/delete custom roles

---

## 🛠️ Dynamic UI Behavior

### Sidebar Menu
- Menu items automatically show/hide based on permissions
- If user has no permissions, sidebar shows "No menu items available"

### Action Buttons
- Buttons only appear if user has required permission
- Example: "Approve" button only shows if `canApproveUsers === true`

### Route Protection
- Routes check permissions before allowing access
- Direct URL access is blocked if no permission
- Shows 403 error page with permission name

### Profile Page
- "Edit Profile" button only shows if user has permission
- If only view permission, button is hidden

---

## ⚠️ Important Notes

1. **System Roles Cannot Be Deleted**
   - Admin, User, Committee Member roles are protected
   - Can be edited but critical permissions cannot be disabled

2. **Role Assignment Updates Both Fields**
   - Updates `roleRef` (for permissions)
   - Updates `role` (for backward compatibility)

3. **Permissions Are Checked on Both Frontend and Backend**
   - Frontend hides UI elements
   - Backend validates API requests
   - Never rely only on frontend checks!

4. **Default Role for New Users**
   - New registrations automatically get "User" role
   - Family members also get "User" role

5. **Permission Changes Take Effect Immediately**
   - When role permissions are updated, all users with that role get new permissions
   - User must refresh page or re-login to see changes

---

## 🧪 Testing Checklist

- [ ] Login as Admin - see all features
- [ ] Login as User - see only allowed features
- [ ] Login as Committee - see committee-specific features
- [ ] Create custom role - verify it appears in dropdown
- [ ] Assign custom role to user - verify permissions work
- [ ] Update role permissions - verify changes reflect immediately
- [ ] Try accessing protected route without permission - verify 403 error
- [ ] Verify buttons hide/show based on permissions
- [ ] Verify sidebar menu items hide/show based on permissions

---

## 📚 API Endpoints

### Role Management
- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/:id` - Get role details
- `POST /api/admin/roles` - Create new role
- `PATCH /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/permissions` - Get all available permissions
- `POST /api/admin/roles/initialize` - Initialize system roles

### Role Assignment
- `PATCH /api/admin/roles/users/:userId/assign` - Assign role to user

---

## 🎨 Frontend Components

### Role Management
- `RoleManagement.jsx` - List all roles, create/edit/delete
- `RoleFormModal.jsx` - Form to create/edit role with permission checkboxes

### Permission Hooks
- `usePermission(key)` - Check single permission
- `useAnyPermission([keys])` - Check if has any permission
- `useAllPermissions([keys])` - Check if has all permissions
- `useUserPermissions()` - Get all user permissions as object

---

## 🔄 Migration Notes

If you have existing users without `roleRef`:

1. Run initialization script (assigns default "User" role)
2. Or manually assign roles via admin panel
3. Or use API to bulk assign roles

---

## ✅ System is Fully Dynamic

- ✅ No hardcoded role checks
- ✅ All UI elements check permissions
- ✅ All routes protected by permissions
- ✅ Admin can create unlimited custom roles
- ✅ Permissions automatically reflect in UI
- ✅ Frontend and backend stay in sync

