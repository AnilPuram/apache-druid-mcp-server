#!/usr/bin/env node

const { spawn } = require('child_process');

// Test configuration
const DRUID_URL = process.env.DRUID_URL || 'http://localhost:8888';
const TEST_TIMEOUT = 30000; // 30 seconds for Druid startup

console.log('🧪 Testing Apache Druid MCP Server Tools');
console.log(`📍 Druid URL: ${DRUID_URL}`);
console.log('=' .repeat(50));

// MCP Protocol messages for testing
const mcpMessages = {
  // Initialize connection
  initialize: {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },

  // List available tools
  listTools: {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  },

  // Test connection tool
  testConnection: {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "test_connection",
      arguments: {}
    }
  },

  // List datasources tool
  listDatasources: {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "list_datasources",
      arguments: {}
    }
  },

  // Execute SQL query tool
  executeSqlQuery: {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "execute_sql_query",
      arguments: {
        query: "SELECT * FROM test_events LIMIT 5"
      }
    }
  },

  // Get datasource metadata (will test with 'test_events' if it exists)
  getDatasourceMetadata: {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "get_datasource_metadata",
      arguments: {
        datasource: "test_events"
      }
    }
  }
};

function testMcpServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting MCP Server...');
    
    // Spawn the MCP server
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, DRUID_URL }
    });

    let testResults = {};
    let currentTestId = 1;
    let responseBuffer = '';

    // Handle server output
    server.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // Try to parse complete JSON messages
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || ''; // Keep incomplete line
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line.trim());
            handleMcpResponse(response);
          } catch (e) {
            console.log('📄 Server message:', line.trim());
          }
        }
      }
    });

    server.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message.includes('Starting Apache Druid MCP Server')) {
        console.log('✅ Server started successfully');
        runTests();
      } else if (message.includes('Apache Druid MCP Server started successfully')) {
        console.log('✅ Server ready for connections');
      } else {
        console.log('📢 Server:', message);
      }
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      reject(error);
    });

    // Set test timeout
    const timeout = setTimeout(() => {
      console.log('⏰ Test timeout reached');
      server.kill();
      resolve(testResults);
    }, TEST_TIMEOUT);

    function handleMcpResponse(response) {
      console.log(`📨 Response ${response.id}:`, JSON.stringify(response, null, 2));
      testResults[response.id] = response;

      // Continue with next test based on ID
      switch(response.id) {
        case 1: // Initialize
          if (response.result) {
            sendMessage(mcpMessages.listTools);
          }
          break;
        case 2: // List tools
          if (response.result && response.result.tools) {
            console.log(`✅ Found ${response.result.tools.length} tools`);
            sendMessage(mcpMessages.testConnection);
          }
          break;
        case 3: // Test connection
          console.log('🔌 Connection test:', response.error ? '❌ Failed' : '✅ Passed');
          sendMessage(mcpMessages.listDatasources);
          break;
        case 4: // List datasources
          console.log('📊 Datasources test:', response.error ? '❌ Failed' : '✅ Passed');
          sendMessage(mcpMessages.executeSqlQuery);
          break;
        case 5: // Execute SQL
          console.log('🔍 SQL Query test:', response.error ? '❌ Failed' : '✅ Passed');
          sendMessage(mcpMessages.getDatasourceMetadata);
          break;
        case 6: // Get metadata
          console.log('📋 Metadata test:', response.error ? '❌ Failed' : '✅ Passed');
          console.log('🎉 All tests completed!');
          clearTimeout(timeout);
          server.kill();
          resolve(testResults);
          break;
      }
    }

    function sendMessage(message) {
      console.log(`📤 Sending: ${message.method} (id: ${message.id})`);
      server.stdin.write(JSON.stringify(message) + '\n');
    }

    function runTests() {
      console.log('\n🧪 Running MCP Tool Tests...');
      console.log('-'.repeat(30));
      sendMessage(mcpMessages.initialize);
    }
  });
}

// Run the tests
testMcpServer()
  .then(results => {
    console.log('\n📊 Test Summary:');
    console.log('=' .repeat(50));
    
    const testNames = {
      1: 'Initialize',
      2: 'List Tools',
      3: 'Test Connection',
      4: 'List Datasources', 
      5: 'Execute SQL Query',
      6: 'Get Datasource Metadata'
    };

    for (const [id, name] of Object.entries(testNames)) {
      const result = results[id];
      if (result) {
        const status = result.error ? '❌ FAILED' : '✅ PASSED';
        console.log(`${name}: ${status}`);
        if (result.error) {
          console.log(`  Error: ${result.error.message}`);
        }
      } else {
        console.log(`${name}: ⏭️  SKIPPED`);
      }
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });