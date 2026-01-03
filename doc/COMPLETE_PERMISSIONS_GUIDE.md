# Complete Permissions Guide

## Overview
This document lists ALL permissions in the system and their corresponding routes/pages.

## Total Permissions: 37

### Admin Role
- **All 37 permissions are enabled** ✅
- Admin has full access to all features

---

## Permission Categories

### 1. USER_MANAGEMENT (10 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canViewUsers` | View Users | `GET /api/users`<br>`/admin/approved`<br>`/admin/rejected` | Can see list of all users |
| `canApproveUsers` | Approve Users | `PATCH /api/users/:id/role` (status: approved)<br>`/admin/pending` | Can approve pending registrations |
| `canRejectUsers` | Reject Users | `PATCH /api/users/:id/role` (status: rejected) | Can reject pending registrations |
| `canEditUsers` | Edit Users | `PATCH /api/users/:id` | Can modify user details |
| `canDeleteUsers` | Delete Users | `DELETE /api/users/:id` | Can remove users from system |
| `canChangeRoles` | Change User Roles | `PATCH /api/users/:id/role`<br>`PATCH /api/admin/roles/users/:userId/assign` | Can assign roles to users |
| `canDeactivateUsers` | Deactivate Users | `PATCH /api/users/:id/deactivate` | Can deactivate user accounts |
| `canSearchUsers` | Search Users | `GET /api/users/search` | Can search and filter users |
| `canBulkApproveUsers` | Bulk Approve Users | `PATCH /api/users/bulk-approve` | Can approve multiple users at once |
| `canBulkRejectUsers` | Bulk Reject Users | `PATCH /api/users/bulk-reject` | Can reject multiple users at once |

---

### 2. FAMILY_MANAGEMENT (7 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canViewFamilyMembers` | View Family Members | `GET /api/family-members/my`<br>`GET /api/family-members/sub-family/:subFamilyNumber` | Can see family member lists |
| `canApproveFamilyMembers` | Approve Family Members | `PATCH /api/family-members/:id/approve`<br>`/admin/pending-family` | Can approve family members (6+ member approval) |
| `canRejectFamilyMembers` | Reject Family Members | `PATCH /api/family-members/:id/reject` | Can reject family member requests |
| `canEditFamilyMembers` | Edit Family Members | `PATCH /api/family-members/:id` | Can modify family member details |
| `canDeleteFamilyMembers` | Delete Family Members | `DELETE /api/family-members/:id` | Can remove family members |
| `canAddFamilyMembers` | Add Family Members | `POST /api/family-members` | Can add new family members |
| `canViewPendingFamilyMembers` | View Pending Family Members | `GET /api/family-members/pending` | Can see pending family member requests |

---

### 3. COMMITTEE_MANAGEMENT (2 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canManageCommittee` | Manage Committee | `POST/PATCH/DELETE /api/committee` | Can add/edit/delete committee members |
| `canViewCommittee` | View Committee | `GET /api/committee-members`<br>`/committee` | Can see committee members list |

---

### 4. EVENT_MANAGEMENT (4 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canCreateEvents` | Create Events | `POST /api/events` | Can add new events |
| `canEditEvents` | Edit Events | `PATCH /api/events/:id` | Can modify existing events |
| `canDeleteEvents` | Delete Events | `DELETE /api/events/:id` | Can remove events |
| `canViewEvents` | View Events | `GET /api/events` | Can see all events |

---

### 5. NOTIFICATION_MANAGEMENT (2 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canSendNotifications` | Send Notifications | `POST /api/notifications` | Can send notifications to users |
| `canManageNotifications` | Manage Notifications | `PATCH/DELETE /api/notifications/:id` | Can edit/delete notifications |

---

### 6. MEDIA_MANAGEMENT (2 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canUploadMedia` | Upload Media | `POST /api/media/upload` | Can upload photos/videos |
| `canDeleteMedia` | Delete Media | `DELETE /api/media/:id` | Can remove media files |

---

### 7. REPORTS_ANALYTICS (3 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canViewReports` | View Reports | Reports page | Can access reports and analytics |
| `canExportData` | Export Data | `GET /api/admin/export/*`<br>All export endpoints | Can export data to CSV/Excel |
| `canViewStats` | View Statistics | `GET /api/admin/stats`<br>`/admin/dashboard` | Can view dashboard statistics |

---

### 8. SETTINGS (3 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canManageSettings` | Manage App Settings | Settings page | Can modify application settings |
| `canManageRoles` | Manage Roles | `GET/POST/PATCH/DELETE /api/admin/roles`<br>`/admin/roles` | Can create/edit/delete custom roles |
| `canManageEnums` | Manage Enums | `GET/POST/PATCH /api/admin/enums`<br>`/admin/enums` | Can manage enum values and types |

---

### 9. ACTIVITY_LOGS (2 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canViewActivityLogs` | View Activity Logs | `GET /api/admin/activity-logs`<br>`/admin/activity-logs` | Can view system activity and audit logs |
| `canManageActivityLogs` | Manage Activity Logs | `DELETE /api/admin/activity-logs/:id` | Can delete or manage activity logs |

---

### 10. ADMIN_MANAGEMENT (2 permissions)

| Permission Key | Label | Route/Page | Description |
|---------------|-------|------------|-------------|
| `canCreateAdmin` | Create Admin Users | Create admin user endpoint | Can create new admin users |
| `canManageAdmins` | Manage Admin Users | Edit/delete admin user endpoints | Can edit or remove admin users |

---

## Route Protection Summary

### Backend Routes (All Protected with Permissions)

#### User Routes (`/api/users`)
- `GET /` → `canViewUsers`
- `GET /search` → `canSearchUsers`
- `GET /:id` → Authenticated (self or admin)
- `PATCH /:id/role` → `canChangeRoles`
- `PATCH /:id/deactivate` → `canDeactivateUsers`
- `PATCH /bulk-approve` → `canBulkApproveUsers`
- `PATCH /bulk-reject` → `canBulkRejectUsers`

#### Family Member Routes (`/api/family-members`)
- `GET /pending` → `canViewPendingFamilyMembers`
- `PATCH /:id/approve` → `canApproveFamilyMembers`
- `PATCH /:id/reject` → `canRejectFamilyMembers`
- `GET /sub-family/:subFamilyNumber` → `canViewFamilyMembers`

#### Activity Log Routes (`/api/admin/activity-logs`)
- `GET /` → `canViewActivityLogs`
- `GET /:id` → `canViewActivityLogs`

#### Export Routes (`/api/admin/export`)
- `GET /users` → `canExportData`
- `GET /pending-users` → `canExportData`
- `GET /family-tree/:subFamilyNumber` → `canExportData`
- `GET /committee-members` → `canExportData`

#### Stats Routes (`/api/admin/stats`)
- `GET /` → `canViewStats`

#### Enum Routes (`/api/admin/enums`)
- `GET /:enumType` → `canManageEnums`
- `POST /` → `canManageEnums`
- `PATCH /:enumType/add-value` → `canManageEnums`
- `PATCH /:enumType/remove-value` → `canManageEnums`
- `POST /initialize` → `canManageEnums`

#### Role Routes (`/api/admin/roles`)
- `GET /permissions` → `canManageRoles`
- `POST /initialize` → `canManageRoles`
- `GET /` → `canManageRoles`
- `GET /:id` → `canManageRoles`
- `POST /` → `canManageRoles`
- `PATCH /:id` → `canManageRoles`
- `DELETE /:id` → `canManageRoles`
- `PATCH /users/:userId/assign` → `canChangeRoles`

---

### Frontend Routes (All Protected with Permissions)

| Route | Required Permission | Component |
|-------|---------------------|-----------|
| `/admin/dashboard` | None (authenticated) | Dashboard |
| `/admin/pending` | `canApproveUsers` | PendingUsers |
| `/admin/approved` | `canViewUsers` | ApprovedUsers |
| `/admin/rejected` | `canViewUsers` | RejectedUsers |
| `/admin/pending-family` | `canApproveFamilyMembers` | PendingFamilyMembers |
| `/admin/activity-logs` | `canViewActivityLogs` | ActivityLog |
| `/admin/enums` | `canManageEnums` | EnumManagement |
| `/admin/roles` | `canManageRoles` | RoleManagement |

---

## Default System Roles

### Admin Role
- **All 37 permissions enabled** ✅
- Full system access

### User Role
- `canViewEvents` ✅
- `canViewCommittee` ✅

### Committee Member Role
- `canViewUsers` ✅
- `canViewFamilyMembers` ✅
- `canViewEvents` ✅
- `canViewCommittee` ✅
- `canViewReports` ✅

---

## Testing

### Test Admin Account
- **Email:** `admin@test.com`
- **Mobile:** `9876543210`
- **Password:** `12345678`
- **Permissions:** All 37 enabled ✅

### Verify Permissions
Run the test script to verify all permissions:
```bash
node backend/scripts/testAllFunctions.js
```

### Check Admin Permissions
Run the verification script:
```bash
node backend/scripts/verifyAdminPermissions.js
```

---

## Notes

1. **All routes are now protected with permission-based middleware** instead of role-based
2. **Admin role has ALL permissions** - no page or API endpoint should be inaccessible
3. **Frontend and backend permissions are synchronized** - both use the same constants file
4. **New permissions can be added** to `backend/constants/permissions.js` and `frontend/src/constants/permissions.js`
5. **Always use `authorizePermission()` middleware** in backend routes
6. **Always use `usePermission()` hook** in frontend components

---

## Permission Count by Category

- USER_MANAGEMENT: 10 permissions
- FAMILY_MANAGEMENT: 7 permissions
- COMMITTEE_MANAGEMENT: 2 permissions
- EVENT_MANAGEMENT: 4 permissions
- NOTIFICATION_MANAGEMENT: 2 permissions
- MEDIA_MANAGEMENT: 2 permissions
- REPORTS_ANALYTICS: 3 permissions
- SETTINGS: 3 permissions
- ACTIVITY_LOGS: 2 permissions
- ADMIN_MANAGEMENT: 2 permissions

**Total: 37 permissions**

