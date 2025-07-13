#!/usr/bin/env node

const { DruidClient } = require('./dist/druid-client.js');

async function testTools() {
  console.log('Testing Apache Druid MCP Server Tools...\n');

  // Test with localhost (will likely fail, but we can see the errors)
  const client = new DruidClient({
    url: 'http://localhost:8082',
    timeout: 5000
  });

  const coordinatorClient = new DruidClient({
    url: 'http://localhost:8081',
    timeout: 5000
  });

  // Test 1: Connection test
  console.log('1. Testing connection...');
  try {
    const connected = await client.testConnection();
    console.log(`   ✅ Connection: ${connected}`);
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
  }

  // Test 2: List datasources
  console.log('\n2. Testing list datasources...');
  try {
    const datasources = await client.getDatasources();
    console.log(`   ✅ Datasources: ${JSON.stringify(datasources)}`);
  } catch (error) {
    console.log(`   ❌ List datasources failed: ${error.message}`);
  }

  // Test 3: Get segments
  console.log('\n3. Testing get segments...');
  try {
    const segments = await coordinatorClient.getSegments();
    console.log(`   ✅ Segments: ${segments.length} segments found`);
  } catch (error) {
    console.log(`   ❌ Get segments failed: ${error.message}`);
  }

  // Test 4: SQL Query
  console.log('\n4. Testing SQL query...');
  try {
    const result = await client.executeSqlQuery('SELECT 1 as test');
    console.log(`   ✅ SQL Query: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`   ❌ SQL query failed: ${error.message}`);
  }

  // Test 5: Status check
  console.log('\n5. Testing status check...');
  try {
    const status = await client.getStatus();
    console.log(`   ✅ Status: ${JSON.stringify(status)}`);
  } catch (error) {
    console.log(`   ❌ Status check failed: ${error.message}`);
  }

  console.log('\n✅ Tool testing complete!');
}

testTools().catch(console.error);