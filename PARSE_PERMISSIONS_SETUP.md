# Parse Permissions Setup for User Query

## Problem
The NewChat screen cannot fetch users because Parse blocks querying the User class by default for security reasons.

## Solution: Enable User Class Read Permissions

### Step-by-Step Instructions for Back4App:

1. **Go to Back4App Dashboard**
   - Visit https://www.back4app.com
   - Log in to your account

2. **Select Your App**
   - Click on your QuickChat app

3. **Navigate to Database**
   - Click on "Database" in the left sidebar
   - Or go to: https://www.back4app.com/dashboard/[your-app-id]/database

4. **Open User Class**
   - Find and click on the `_User` class (or `User` class)

5. **Go to Security/Permissions**
   - Click on the "Security" or "Permissions" tab
   - Or look for a "Security" button/icon

6. **Set Read Permission**
   - Find the "Read" permission row
   - Change it from the default (usually "Only the owner") to one of these:
     - **"Authenticated users"** (Recommended - only logged-in users can read)
     - **"Public"** (For testing only - anyone can read)

7. **Save Changes**
   - Click "Save" or "Update" button

8. **Test**
   - Go back to your app
   - Open the NewChat screen
   - You should now see registered users

## Alternative: Using Cloud Function (Advanced)

If you cannot change permissions, you can create a Cloud Function to fetch users:

```javascript
// In Parse Cloud Code
Parse.Cloud.define("getRegisteredUsers", async (request) => {
  const currentUser = request.user;
  if (!currentUser) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "User not authenticated");
  }
  
  const query = new Parse.Query(Parse.User);
  query.notEqualTo("objectId", currentUser.id);
  query.equalTo("isRegistered", true);
  query.include("profilePic");
  query.ascending("name");
  
  const users = await query.find({ useMasterKey: true });
  return users;
});
```

Then call it from the app:
```javascript
const results = await Parse.Cloud.run("getRegisteredUsers");
```

## Quick Fix for Testing

If you just want to test quickly, you can temporarily set User class Read permission to "Public" in Back4App dashboard, then change it back to "Authenticated users" for production.

