#!/usr/bin/env node

/**
 * 🔍 Luna WebSocket Connection Diagnostic Tool
 * 
 * Run this to debug WebSocket connection issues:
 * node debug-websocket.js
 */

const WebSocket = require('ws');

// Check environment variables
console.log('🔍 DEBUGGING LUNA WEBSOCKET CONNECTION\n');

console.log('📋 Environment Check:');
console.log(`- VITE_LUNA_WS_ENDPOINT: ${process.env.VITE_LUNA_WS_ENDPOINT || 'NOT SET'}`);

// Read from .env.local if available
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('- .env.local content:');
  console.log(`  ${envContent.trim()}`);
  
  // Extract WebSocket URL
  const match = envContent.match(/VITE_LUNA_WS_ENDPOINT=(.+)/);
  if (match) {
    const wsUrl = match[1].trim();
    console.log(`\n🌐 Testing WebSocket Connection: ${wsUrl}`);
    
    // Test WebSocket connection
    const ws = new WebSocket(wsUrl);
    
    const timeout = setTimeout(() => {
      console.log('❌ Connection timeout after 5 seconds');
      ws.close();
      process.exit(1);
    }, 5000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket connection successful!');
      console.log('📤 Sending test message...');
      
      // Send a test START message
      ws.send(JSON.stringify({
        step: 'START',
        token: 'test-token'
      }));
    });
    
    ws.on('message', (data) => {
      console.log(`📥 Received: ${data}`);
      ws.close();
      process.exit(0);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`❌ WebSocket Error: ${error.message}`);
      process.exit(1);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (code === 1006) {
        console.log('❌ Connection closed abnormally (1006)');
        console.log('💡 This usually means:');
        console.log('   1. Backend WebSocket API not deployed');
        console.log('   2. Wrong endpoint URL');
        console.log('   3. Network connectivity issue');
        console.log('\n🚀 Try deploying backend:');
        console.log('   cd ../back && sam build && sam deploy --guided');
      } else {
        console.log(`🔄 Connection closed: ${code} ${reason || ''}`);
      }
      process.exit(code === 1000 ? 0 : 1);
    });
    
  } else {
    console.log('❌ VITE_LUNA_WS_ENDPOINT not found in .env.local');
    process.exit(1);
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('💡 Create it with:');
  console.log('echo "VITE_LUNA_WS_ENDPOINT=wss://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/staging" > .env.local');
  process.exit(1);
}
