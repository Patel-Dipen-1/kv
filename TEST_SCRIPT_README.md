# Database Testing Scripts

## 🚀 Quick Start

### Option 1: Simple Seed (Fast)
```bash
node backend/scripts/seedDatabase.js
```
This script:
- Drops all collections
- Creates 3 system roles (Admin, User, Committee)
- Creates 4 test users
- Creates enum data

### Option 2: Comprehensive Test (Recommended)
```bash
node backend/scripts/testAllFunctions.js
```
This script:
- Drops all collections
- Creates 3 system roles
- Creates 5 test users (including Event Manager test user)
- Creates enum data
- Creates test family members
- Tests permission system
- Tests role management
- Verifies all data

---

## 📋 Test Accounts Created

### Admin User
- **Email:** `admin@test.com`
- **Mobile:** `9876543210`
- **Password:** `12345678`
- **Role:** Admin (all permissions enabled)
- **Status:** Approved
- **Can Do:** Everything (all permissions)

### Regular User
- **Email:** `user@test.com`
- **Mobile:** `9876543211`
- **Password:** `12345678`
- **Role:** User (limited permissions)
- **Status:** Approved
- **Can Do:** 
  - ✅ View events
  - ✅ View committee page
  - ✅ View own profile
  - ❌ Cannot approve users
  - ❌ Cannot edit users
  - ❌ Cannot access admin features

### Committee Member
- **Email:** `committee@test.com`
- **Mobile:** `9876543212`
- **Password:** `12345678`
- **Role:** Committee Member
- **Status:** Approved
- **Can Do:**
  - ✅ View users
  - ✅ View family members
  - ✅ View events
  - ✅ View committee
  - ✅ View reports
  - ❌ Cannot approve users
  - ❌ Cannot edit users
  - ❌ Cannot manage roles

### Pending User
- **Email:** `pending@test.com`
- **Mobile:** `9876543213`
- **Password:** `12345678`
- **Role:** User
- **Status:** Pending (needs admin approval)
- **Can Do:** Nothing (account pending)

### Event Manager (Custom Role - Created by testAllFunctions.js)
- **Email:** `rajesh@test.com`
- **Mobile:** `9876543214`
- **Password:** `12345678`
- **Role:** Event Manager (custom role)
- **Status:** Approved
- **Can Do:**
  - ✅ Create events
  - ✅ Edit events
  - ✅ Delete events
  - ✅ View events
  - ✅ Upload media
  - ❌ Cannot view users
  - ❌ Cannot approve users
  - ❌ Cannot access admin features

---

## 🧪 Testing Checklist

### Test 1: Admin Login
1. Login as `admin@test.com` / `12345678`
2. ✅ Should see all menu items in sidebar
3. ✅ Should see all buttons (Approve, Edit, Delete, etc.)
4. ✅ Should be able to access all pages
5. ✅ Should be able to create/edit/delete roles
6. ✅ Should be able to assign roles to users

### Test 2: Regular User Login
1. Login as `user@test.com` / `12345678`
2. ✅ Should see Profile page
3. ✅ Should see Committee page (public)
4. ❌ Should NOT see Admin menu
5. ❌ Should NOT see "Edit Profile" button (if permission not given)
6. ❌ Should get 403 error if trying to access `/admin/dashboard`

### Test 3: Committee Member Login
1. Login as `committee@test.com` / `12345678`
2. ✅ Should see Admin Dashboard
3. ✅ Should see Users list (view only)
4. ✅ Should see Committee page
5. ✅ Should see Reports
6. ❌ Should NOT see "Approve Users" button
7. ❌ Should NOT see "Edit Users" button
8. ❌ Should NOT see Role Management

### Test 4: Event Manager Login (Custom Role)
1. Login as `rajesh@test.com` / `12345678`
2. ✅ Should see Events menu (if implemented)
3. ✅ Should be able to create events (if permission enabled)
4. ❌ Should NOT see Users menu
5. ❌ Should NOT see Admin Dashboard
6. ❌ Should NOT see Reports

### Test 5: Pending User
1. Try to login as `pending@test.com` / `12345678`
2. ❌ Should get error: "Your account is pending approval"
3. Admin should approve this user first

### Test 6: Permission-Based UI
1. Login as regular user
2. Check sidebar - should only show allowed menu items
3. Check buttons - should only show if user has permission
4. Try direct URL access - should be blocked with 403

### Test 7: Role Management
1. Login as admin
2. Go to Role Management (`/admin/roles`)
3. Create a new custom role
4. Assign it to a user
5. Logout and login as that user
6. Verify permissions work correctly

---

## 🔧 Manual Testing Steps

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Start Frontend
```bash
cd frontend
npm start
```

### Step 3: Run Test Script
```bash
node backend/scripts/testAllFunctions.js
```

### Step 4: Test in Browser
1. Open `http://localhost:3000`
2. Login with test accounts
3. Verify UI shows/hides based on permissions
4. Test all functions

---

## 📊 What Gets Created

### Roles (3 System + 1 Custom)
- **Admin** - All permissions enabled
- **User** - View events & committee only
- **Committee Member** - View users, family, events, committee, reports
- **Event Manager** (custom) - Event management only

### Users (5)
- 1 Admin user
- 2 Regular users (1 approved, 1 pending)
- 1 Committee member
- 1 User with custom "Event Manager" role

### Family Members (3)
- Father, Mother, Sister for `user@test.com`

### Enums (8 types)
- USER_ROLES
- USER_STATUS
- COMMITTEE_POSITIONS
- MARITAL_STATUS
- OCCUPATION_TYPES
- RELATIONSHIP_TYPES
- SAMAJ_TYPES
- COUNTRIES

---

## ⚠️ Important Notes

1. **All passwords are:** `12345678`
2. **Script drops ALL existing data** - use with caution!
3. **Test users are created with proper roleRef assignments**
4. **Family members are linked to test user**
5. **Custom role is created and assigned to test user**

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
- Make sure you're running from project root
- Check that `backend/scripts/` directory exists

### Error: "Database connection failed"
- Check `.env` file has correct `DB_URI`
- Make sure MongoDB is running

### Error: "Role not found"
- Run the script again - it will create roles if they don't exist

### Users don't have permissions
- Make sure roles are created before users
- Check that `roleRef` is properly assigned
- Verify role permissions are set correctly

---

## ✅ Success Indicators

After running the script, you should see:
- ✅ All collections dropped
- ✅ 3-4 roles created
- ✅ 4-5 users created
- ✅ All users have roleRef assigned
- ✅ Permission tests pass
- ✅ Role management tests pass
- ✅ Data verification shows correct counts

---

## 🎯 Next Steps After Running Script

1. **Test Admin Features:**
   - Login as admin
   - Create a custom role
   - Assign it to a user
   - Verify permissions work

2. **Test User Limitations:**
   - Login as regular user
   - Try to access admin pages (should be blocked)
   - Verify only allowed features are visible

3. **Test Committee Features:**
   - Login as committee member
   - Verify can view but not edit
   - Check reports are accessible

4. **Test Custom Role:**
   - Login as Event Manager (rajesh@test.com)
   - Verify only event-related features are visible

---

## 📝 Script Output Example

```
🚀 Starting comprehensive database setup and testing...

============================================================
✅ MongoDB connected: localhost:27017

🗑️  Step 1: Dropping all collections...
✅ All collections dropped successfully

📋 Step 2: Creating system roles...
✅ Created 3 system roles:
   - Admin (25 permissions enabled)
   - User (2 permissions enabled)
   - Committee Member (5 permissions enabled)

👥 Step 3: Creating test users...
✅ Created 5 test users:
   - Admin User (admin@test.com) - Role: admin - Status: approved
   - John Doe (user@test.com) - Role: user - Status: approved
   - Committee Member (committee@test.com) - Role: committee - Status: approved
   - Pending User (pending@test.com) - Role: user - Status: pending
   - Rajesh Kumar (rajesh@test.com) - Role: user - Status: approved

📝 Step 4: Creating enum data...
✅ Created 8 enum types

👨‍👩‍👧‍👦 Step 5: Creating test family members...
✅ Created 3 family members for John Doe

🔍 Step 6: Testing permission system...
   Testing Admin permissions:
   - canApproveUsers: ✅
   - canManageRoles: ✅
   
   Testing User permissions:
   - canViewEvents: ✅
   - canApproveUsers: ✅ (correct - should be false)
   
   Testing Committee permissions:
   - canViewUsers: ✅
   - canApproveUsers: ✅ (correct - should be false)

✅ Permission tests completed

🎭 Step 7: Testing role management...
   Creating custom 'Event Manager' role...
   ✅ Custom role created successfully
   Assigning 'Event Manager' role to Rajesh...
   ✅ Role assigned successfully
   ✅ Rajesh can create events: Yes

✅ Role management tests completed

✅ Step 8: Verifying all data...

📊 Database Summary:
   - Users: 5
   - Roles: 4
   - Family Members: 3
   - Enum Types: 8

✅ All users have roles assigned

📋 Roles:
   - Admin: 25 permissions, 1 users
   - User: 2 permissions, 3 users
   - Committee Member: 5 permissions, 1 users
   - Event Manager: 5 permissions, 1 users

✅ Data verification completed

============================================================

✅ ALL TESTS COMPLETED SUCCESSFULLY!

📋 Test Accounts Created:
   ┌─────────────────────────────────────────────────┐
   │ Admin: admin@test.com / 9876543210             │
   │ User: user@test.com / 9876543211               │
   │ Committee: committee@test.com / 9876543212      │
   │ Pending: pending@test.com / 9876543213         │
   │ Event Manager: rajesh@test.com / 9876543214    │
   └─────────────────────────────────────────────────┘

🔑 All passwords: 12345678

🎯 Next Steps:
   1. Start backend: npm run dev (in backend folder)
   2. Start frontend: npm start (in frontend folder)
   3. Login as admin@test.com to test all features
   4. Login as user@test.com to test limited permissions
   5. Login as committee@test.com to test committee permissions
   6. Login as rajesh@test.com to test custom 'Event Manager' role

✨ System is ready for testing!
```

