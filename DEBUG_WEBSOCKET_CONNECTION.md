# 🔍 Luna WebSocket Connection Debug Guide

## Current Issue Status: ✅ RESOLVED

The WebSocket connection issue has been **fixed** with support for both authenticated and guest users.

## 🔧 What Was Fixed

### 1. **Authentication Flow Issue**
**Problem**: Luna WebSocket service required Auth0 JWT tokens, but the iframe context didn't have proper authentication.

**Solution**: 
- ✅ Added guest token support alongside Auth0 JWT tokens
- ✅ Frontend creates guest tokens when no Auth0 token is available
- ✅ Backend validates both Auth0 JWT and guest tokens
- ✅ Email prompting for guest users

### 2. **Token Validation**
**Problem**: Backend only accepted Auth0 JWT tokens verified with `jsonwebtoken.verify()`.

**Solution**:
- ✅ Backend now tries Auth0 JWT first, then falls back to guest token format
- ✅ Guest tokens are base64-encoded JSON with email and expiration
- ✅ Proper validation for both token types

### 3. **User Experience**
**Problem**: No way for guest users to provide email for WebSocket connection.

**Solution**:
- ✅ Email prompting when no authentication is available
- ✅ Email stored in localStorage for session persistence
- ✅ Graceful fallback from authenticated to guest mode

## 🧪 How to Test the Fix

### Step 1: Check Environment Variable
```bash
# Make sure you have the correct WebSocket endpoint
echo $VITE_LUNA_WS_ENDPOINT
# Should output: wss://4i704zb47j.execute-api.us-east-1.amazonaws.com/staging
```

### Step 2: Check Console Output
Open browser console and look for these logs:

```javascript
// 1. Service initialization
🌙 Luna WebSocket Service initialized: {
  wsEndpoint: "wss://4i704zb47j.execute-api.us-east-1.amazonaws.com/staging",
  hasEnvVar: true,
  envValue: "wss://4i704zb47j.execute-api.us-east-1.amazonaws.com/staging"
}

// 2. WebSocket connection
🌙 Luna WebSocket: Establishing mystical connection...
🌟 Luna WebSocket: Connection established

// 3. Authentication check
🔐 Luna WebSocket: Auth check: {
  hasToken: false,
  tokenLength: 0,
  isAuthenticated: false,
  userEmail: "user@example.com",
  authStoreEmail: undefined
}

// 4. Guest token creation
🎭 Luna WebSocket: Creating guest session for: user@example.com
📤 Luna WebSocket: Sending session start with token...
✅ Luna WebSocket: Session start message sent

// 5. Session started
🔮 Luna WebSocket: Session started, sending request...
```

### Step 3: Check Backend Logs
If you have access to CloudWatch logs for the WebSocket Lambda:

```
🎭 Session started for guest user: user@example.com
```

### Step 4: Expected User Flow

1. **Open Luna streaming page** (`/luna-streaming`)
2. **Type a message** and click send
3. **Email prompt appears** (if not authenticated): "🌙 Luna a besoin de votre email..."
4. **Enter valid email** (e.g., `test@example.com`)
5. **WebSocket connection establishes**
6. **Message sent to Luna**
7. **Real-time streaming response**

## 🚨 If Still Not Working

### Check These Potential Issues:

#### 1. **Environment Variable Not Set**
```bash
cd front
echo "VITE_LUNA_WS_ENDPOINT=wss://4i704zb47j.execute-api.us-east-1.amazonaws.com/staging" > .env.local
npm run dev
```

#### 2. **WebSocket Lambda Not Deployed**
```bash
cd back
sam deploy --guided
```

#### 3. **API Gateway WebSocket Not Configured**
Check AWS Console:
- API Gateway → WebSocket APIs
- Should see "staging-luna-websocket-api"
- Routes: `$connect`, `$disconnect`, `$default`

#### 4. **Lambda Permissions**
Ensure Lambda has permissions for:
- `bedrock:InvokeModel`
- `bedrock-runtime:ConverseStream`
- `bedrock-agent-runtime:Retrieve`
- `dynamodb:PutItem`, `dynamodb:Query`
- `execute-api:ManageConnections`

#### 5. **Check Browser Network Tab**
1. Open DevTools → Network
2. Filter by "WS" (WebSocket)
3. Look for connection to your WebSocket URL
4. Check if connection succeeds or fails

#### 6. **CORS Issues**
WebSocket connections don't use CORS, but check if there are any Origin restrictions in API Gateway.

## 🔧 Advanced Debugging

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('luna_debug', 'true');
```

### Force Guest Mode Test
```javascript
// In browser console, clear auth store
localStorage.removeItem('auth0.access_token');
localStorage.removeItem('luna_guest_email');
// Then try connecting again
```

### Check DynamoDB Table
Verify WebSocket session table exists:
- Table name: `staging-luna-websocket-sessions`
- Items should appear when connections are made

### Manual WebSocket Test
```bash
# Install wscat
npm install -g wscat

# Test connection (replace with your URL)
wscat -c wss://4i704zb47j.execute-api.us-east-1.amazonaws.com/staging

# Should connect successfully
# Try sending a START message:
{"step":"START","token":"test"}
```

## ✅ Expected Results After Fix

1. **Connection Established**: WebSocket connects successfully
2. **Authentication Works**: Both Auth0 users and guests can connect
3. **Email Prompting**: Guest users are prompted for email
4. **Session Persistence**: Email stored in localStorage
5. **Error Handling**: Clear error messages for connection issues
6. **Real-time Streaming**: Luna responses stream in real-time
7. **Reasoning Mode**: Works with both authenticated and guest users

## 📞 If You Still Need Help

If the connection still doesn't work after these fixes:

1. **Share console logs** - Copy all Luna WebSocket logs from browser console
2. **Check backend logs** - CloudWatch logs for the WebSocket Lambda function
3. **Verify URL** - Confirm the WebSocket endpoint is correct
4. **Test manually** - Use wscat to test raw WebSocket connection

The issue should now be resolved with the guest authentication support! 🌙✨
