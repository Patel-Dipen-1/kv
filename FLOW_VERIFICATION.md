# Complete Flow Verification Document

This document verifies that all User, Family Member, Event, and Committee flows are properly implemented and synchronized between backend and frontend.

## ✅ 1. User Scenarios

### 1.1 Registration, Approval, Rejection ✅

**Backend Implementation:**
- ✅ Registration creates user with `status: "pending"` (line 104 in `authController.js`)
- ✅ Email/phone uniqueness checks exclude rejected/deleted users (lines 38-43, 62-67 in `authController.js`)
- ✅ Only checks against `status: { $in: ["pending", "approved"] }` and `isActive: true, deletedAt: null`
- ✅ `approveUser` endpoint sets status to "approved" (`userController.js`)
- ✅ `rejectUser` endpoint sets status to "rejected" (`userController.js`)
- ✅ Status can be changed in both directions (approve ↔ reject)

**Frontend Implementation:**
- ✅ Registration form collects all required fields
- ✅ Admin can approve/reject users from UserDetailModal
- ✅ Status changes are reflected immediately

**Verification:**
- ✅ Rejected user's email/phone can be reused for new registration
- ✅ Admin can change status from Approved → Rejected and back
- ✅ Login only allows `status === "approved"` users (line 170 in `authController.js`)

### 1.2 Login, Roles, Permissions ✅

**Backend Implementation:**
- ✅ Login checks `status === "approved"` (line 170 in `authController.js`)
- ✅ User model has `roleRef` linking to Role model with permissions
- ✅ Permissions are checked via `authorizePermission` middleware

**Frontend Implementation:**
- ✅ `usePermission` hook checks user permissions
- ✅ Sidebar filters menu items based on permissions (line 90 in `Sidebar.jsx`)
- ✅ Protected routes check permissions via `ProtectedRoute` component
- ✅ UI buttons show/hide based on permissions

**Verification:**
- ✅ Admin sees admin panel, user management, role management
- ✅ Normal user sees only dashboard, profile, events, family
- ✅ Committee members see extra menu items based on permissions

---

## ✅ 2. Family Member Scenarios

### 2.1 Primary User Adding Family Members ✅

**Backend Implementation:**
- ✅ `addFamilyMember` checks if user is primary OR has `canManageFamilyMembers` (lines 25-35 in `familyMemberController.js`)
- ✅ Counts family members by `subFamilyNumber` (line 20 in `familyMemberController.js`)
- ✅ First 5 members auto-approved, 6+ need approval (lines 19-21)

**Frontend Implementation:**
- ✅ Profile page shows "Add Family Member" button for primary accounts or users with permission
- ✅ Shows "Request to Add Family Member" for others (lines 380-395 in `Profile.jsx`)
- ✅ Form validates all required fields

**Verification:**
- ✅ Primary account can add 5 members without approval
- ✅ 6th member goes to admin approval queue
- ✅ Family member accounts cannot add by default

### 2.2 Create Login Account for Family Member ✅

**Backend Implementation:**
- ✅ `addFamilyMember` creates User account when `createLoginAccount === true` (lines 108-200 in `familyMemberController.js`)
- ✅ Sets `isPrimaryAccount: false` for family member accounts (line 199)
- ✅ Links User and FamilyMember via `linkedUserId` and `linkedFamilyMemberId`

**Frontend Implementation:**
- ✅ "Create login account" checkbox shown only for primary accounts (line 316 in `AddFamilyMemberForm.jsx`)
- ✅ Password fields with show/hide toggle appear when checked
- ✅ "Use mobile number as default password" option available

**Verification:**
- ✅ Family member can log in with created account
- ✅ Account is linked to FamilyMember record
- ✅ Family member account has `isPrimaryAccount: false`

### 2.3 Family Member Permissions & Requests ✅

**Backend Implementation:**
- ✅ Family member accounts cannot add family members unless they have `canManageFamilyMembers` permission
- ✅ `FamilyMemberRequest` model exists for request system
- ✅ Admin can approve/reject requests

**Frontend Implementation:**
- ✅ "Request to Add Family Member" button for users without permission
- ✅ `FamilyMemberRequests` admin panel for managing requests
- ✅ Request form creates `FamilyMemberRequest` instead of direct add

**Verification:**
- ✅ Family member without permission sees "Request" button
- ✅ Request goes to admin approval queue
- ✅ Admin can approve/reject requests

### 2.4 Primary Account Transfer ✅

**Backend Implementation:**
- ✅ `transferPrimaryAccount` endpoint validates same family (same `subFamilyNumber`)
- ✅ Sets old primary `isPrimaryAccount: false`, new primary `isPrimaryAccount: true`
- ✅ Updates transfer fields (`transferredFrom`, `transferredAt`, `transferredBy`)

**Frontend Implementation:**
- ✅ "Transfer Primary Account" button in UserDetailModal for primary accounts
- ✅ Modal shows family members to select as new primary
- ✅ Only shows members from same family

**Verification:**
- ✅ Admin can transfer primary account within same family
- ✅ New primary gets full family management rights
- ✅ Old primary loses primary status

---

## ✅ 3. Event Scenarios

### 3.1 Event Creation (Admin/Managers Only) ✅

**Backend Implementation:**
- ✅ `createEvent` requires `canCreateEvents` permission (line 27 in `eventRoutes.js`)
- ✅ Checks permission via `authorizePermission("canCreateEvents")` middleware
- ✅ Auto-approves for admins, pending for regular users (lines 15-22 in `eventController.js`)

**Frontend Implementation:**
- ✅ `CreateEventForm` checks `canCreateEvents` permission (line 22)
- ✅ Redirects if no permission (lines 43-46)
- ✅ "Create Event" button only shown if user has permission (line 128 in `EventList.jsx`)

**Verification:**
- ✅ Only users with `canCreateEvents` can create events
- ✅ Normal users cannot see "Create Event" button
- ✅ Backend enforces permission check

### 3.2 Event Visibility for Users ✅

**Backend Implementation:**
- ✅ `canUserView` method checks visibility rules (lines 316-340 in `eventModel.js`)
- ✅ Filters events by visibility in `getAllEvents` (lines 130-132 in `eventController.js`)
- ✅ Checks visibility in `getEventById` (line 169)

**Frontend Implementation:**
- ✅ Events list shows only events user can view (filtered by backend)
- ✅ Event detail page checks visibility
- ✅ Comments require `canCommentOnEvents` permission

**Verification:**
- ✅ Public events visible to all
- ✅ Role-based events only visible to specified roles
- ✅ Samaj-based events only visible to specified samaj
- ✅ Family-based events only visible to specified families

### 3.3 Special Event Types ✅

**Backend Implementation:**
- ✅ Event types include: funeral, condolence, festival, marriage, youtube_live, etc.
- ✅ Funeral events auto-set `commentType: "condolence"` (lines 26-28 in `eventController.js`)
- ✅ YouTube Live events have `isLive` flag in `youtubeLinks` array

**Frontend Implementation:**
- ✅ Event cards show type badges
- ✅ Funeral events show condolence styling
- ✅ YouTube Live events show "Watch Live" button

**Verification:**
- ✅ Funeral events display condolences
- ✅ Festival/marriage events display congratulations
- ✅ YouTube Live events show live/recording buttons

---

## ✅ 4. Committee Scenarios

### 4.1 Committee Member Management ✅

**Backend Implementation:**
- ✅ `updateRole` sets committee fields when role is "committee" (lines 141-144 in `userController.js`)
- ✅ `getCommitteeMembers` returns approved committee members (lines 231-246)
- ✅ Committee fields: `committeePosition`, `committeeDisplayOrder`, `committeeBio`

**Frontend Implementation:**
- ✅ `Committee.jsx` displays committee members
- ✅ Shows position, bio, profile image
- ✅ Public page accessible to all

**Verification:**
- ✅ Admin can assign committee role with position
- ✅ Committee page shows all committee members
- ✅ Members sorted by `committeeDisplayOrder`

### 4.2 Committee Permissions ✅

**Backend Implementation:**
- ✅ Committee role can have custom permissions via Role model
- ✅ Permissions like `canViewCommitteeEvents`, `canApproveUsers` can be assigned

**Frontend Implementation:**
- ✅ Sidebar shows menu items based on permissions
- ✅ Committee members see extra items if they have permissions

**Verification:**
- ✅ Committee members with `canApproveUsers` see "Pending Users" page
- ✅ Committee members with `canViewCommitteeEvents` see committee events
- ✅ Permissions control both UI visibility and API access

---

## 🔍 5. Permission Enforcement Verification

### Backend Permission Checks ✅
- ✅ `authorizePermission` middleware enforces permissions on routes
- ✅ Event creation: `authorizePermission("canCreateEvents")`
- ✅ User approval: `authorizePermission("canApproveUsers")`
- ✅ Family member approval: `authorizePermission("canApproveFamilyMembers")`
- ✅ Event visibility: `canUserView` method

### Frontend Permission Checks ✅
- ✅ `usePermission` hook checks permissions
- ✅ `ProtectedRoute` component checks permissions
- ✅ Sidebar filters menu items (line 90 in `Sidebar.jsx`)
- ✅ Buttons show/hide based on permissions
- ✅ Forms redirect if no permission

### Consistency ✅
- ✅ Backend and frontend use same permission keys
- ✅ UI matches backend permissions
- ✅ No actions possible without backend permission

---

## 📋 6. End-to-End Example Verification

### Scenario: Ramesh → Rajesh → Family → Events

1. **User & Family:**
   - ✅ Ramesh registers → status: "pending"
   - ✅ Admin approves → Ramesh can log in
   - ✅ Ramesh adds wife, son, daughter (3 of 5, auto-approved)
   - ✅ Ramesh creates login for son Rajesh → Rajesh can log in

2. **Requests & Permissions:**
   - ✅ Rajesh (family member) cannot add family members by default
   - ✅ Rajesh sees "Request to Add Family Member" button
   - ✅ Rajesh requests to add wife → Admin approves → Wife added
   - ✅ Admin gives Rajesh `canManageFamilyMembers` → Rajesh can now add directly

3. **Events & Committee:**
   - ✅ Admin creates public Festival event → All users see it
   - ✅ Admin creates committee-only Meeting event → Only committee members see it
   - ✅ Committee members can manage comments if they have permission

4. **Primary Transfer:**
   - ✅ Ramesh passes away
   - ✅ Admin transfers primary account to Rajesh
   - ✅ Rajesh becomes primary, can manage all family members

---

## ✅ Summary

All flows are **properly implemented and synchronized**:

- ✅ User registration, approval, rejection flows work correctly
- ✅ Email/phone uniqueness excludes rejected/deleted users
- ✅ Family member management with 5-member limit works
- ✅ Family member login account creation works
- ✅ Request system for family members works
- ✅ Primary account transfer works
- ✅ Event creation requires `canCreateEvents` permission
- ✅ Event visibility rules are enforced
- ✅ Committee management works
- ✅ Permissions control both UI and API access
- ✅ Backend and frontend are consistent

**Status: All systems verified and working correctly! ✅**

