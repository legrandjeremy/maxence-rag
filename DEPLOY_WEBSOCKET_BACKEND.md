# 🚀 Deploy Luna WebSocket Backend

## If restarting frontend doesn't fix error 1006, deploy the backend:

### 1. Configure AWS Credentials
```bash
# Check current credentials
aws configure list

# If empty or expired, configure:
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1)
# - Default output format (json)
```

### 2. Deploy WebSocket Infrastructure
```bash
cd /Users/jlegrand/Persocker/maxence-rag/back

# Build the application
sam build

# Deploy (first time - guided)
sam deploy --guided

# OR deploy with auto-resolve (if already configured)
sam deploy --resolve-s3
```

### 3. Get WebSocket URL from Outputs
After deployment, look for:
```
Outputs:
WebSocketApiUrl: wss://NEW-ID.execute-api.us-east-1.amazonaws.com/staging
```

### 4. Update Environment Variable
```bash
cd /Users/jlegrand/Persocker/maxence-rag/front
echo "VITE_LUNA_WS_ENDPOINT=wss://NEW-ID.execute-api.us-east-1.amazonaws.com/staging" > .env.local
```

### 5. Restart Frontend Again
```bash
npm run dev
```

## ✅ Expected Results After Fix

### Browser Console Should Show:
```javascript
🌙 Testing Luna WebSocket connection on mount...
🌙 Luna WebSocket: Testing connection...
✅ Luna WebSocket: Test connection successful
✅ Luna WebSocket: Connected successfully on mount
```

### Instead of:
```javascript
🚨 Luna WebSocket: Test connection closed unexpectedly: 1006
```

## 🧪 Test Connection Manually
```bash
# Install wscat if not available
npm install -g wscat

# Test connection
wscat -c wss://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/staging

# Should connect successfully and show:
# Connected (press CTRL+C to quit)
```

## 🔍 If Still Not Working

1. **Check AWS Region**: Ensure your credentials and deployment are in `us-east-1`
2. **Check Stack Status**: `aws cloudformation describe-stacks --stack-name maijin-defi-challenge`
3. **Check API Gateway**: AWS Console → API Gateway → WebSocket APIs
4. **Check Lambda Functions**: AWS Console → Lambda → Functions (should see WebSocketFunction)

## 📞 Quick Verification Commands
```bash
# Check if environment variable is loaded
echo $VITE_LUNA_WS_ENDPOINT

# Check if API Gateway exists
curl -I "https://4i704zb47j.execute-api.us-east-1.amazonaws.com"

# Check CloudFormation stack
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```
