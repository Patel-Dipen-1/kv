# Fix for 403 Forbidden Error

## Problem
After logging in as admin, you're getting:
```
403 Forbidden
You don't have permission to access this page.
Required permission: canApproveUsers
```

## Root Cause
The `roleRef.permissions` is a Mongoose Map type, which doesn't serialize properly to JSON when sent to the frontend. The frontend receives the user data but the permissions Map is empty or not properly converted.

## Solution Applied
✅ Fixed `backend/utils/jwtToken.js` to convert the permissions Map to a plain object before sending to frontend.

## Steps to Fix Your Session

### Option 1: Logout and Login Again (Recommended)
1. Click "Logout" in your application
2. Login again with:
   - Email: `admin@test.com`
   - Password: `12345678`
3. The new login will have properly serialized permissions

### Option 2: Clear Browser Storage
1. Open browser Developer Tools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click on "Local Storage" → your domain
4. Delete the `user` and `token` items
5. Refresh the page and login again

### Option 3: Use Browser Console
Open browser console (F12) and run:
```javascript
localStorage.removeItem('user');
localStorage.removeItem('token');
location.reload();
```
Then login again.

## Verification

After logging in again, you can verify your permissions in the browser console:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user.roleRef?.roleName);
console.log('Can Approve Users:', user.roleRef?.permissions?.canApproveUsers);
console.log('All Permissions:', user.roleRef?.permissions);
```

You should see:
- Role: "Admin"
- Can Approve Users: true
- All Permissions: Object with 37 permissions all set to true

## If Still Not Working

1. **Check if user has role assigned:**
   ```bash
   node backend/scripts/checkUserRole.js admin@test.com
   ```

2. **Recreate admin role with all permissions:**
   ```bash
   node backend/scripts/testAllFunctions.js
   ```

3. **Verify admin role permissions:**
   ```bash
   node backend/scripts/verifyAdminPermissions.js
   ```

## Technical Details

The fix converts the Mongoose Map to a plain JavaScript object:
```javascript
if (userData.roleRef && userData.roleRef.permissions) {
  if (userData.roleRef.permissions instanceof Map) {
    const permissionsObj = {};
    userData.roleRef.permissions.forEach((value, key) => {
      permissionsObj[key] = value;
    });
    userData.roleRef.permissions = permissionsObj;
  }
}
```

This ensures the permissions are properly serialized to JSON and can be read by the frontend.

