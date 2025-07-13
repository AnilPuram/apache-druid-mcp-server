# Apache Druid MCP Server

Model Context Protocol (MCP) server for Apache Druid - provides tools and resources for querying and managing Druid datasources through Claude Desktop, VS Code, and other MCP clients.

## Features

- 🔍 Execute SQL queries against Apache Druid
- 📊 List and explore datasources 
- 📋 Get detailed metadata including schema, segments, and size information
- 🔗 Test Druid cluster connectivity
- 🚀 Multiple transport protocols: stdio (default) and Server-Sent Events (SSE)
- 🐳 Docker support via published image

## Quick Start

### NPX (Recommended)

```bash
npx apache-druid-mcp
```

### Docker

```bash
# Run with SSE transport
docker run -p 3000:3000 \
  -e DRUID_URL=https://your-druid-cluster.com:8888 \
  -e DRUID_USERNAME=your-username \
  -e DRUID_PASSWORD=your-password \
  anilreddy399/apache-druid-mcp:latest --transport sse --port 3000

# Run with stdio transport (for direct MCP communication)
docker run -i \
  -e DRUID_URL=https://your-druid-cluster.com:8888 \
  -e DRUID_USERNAME=your-username \
  -e DRUID_PASSWORD=your-password \
  anilreddy399/apache-druid-mcp:latest
```

### Local Development

```bash
npm install
npm run build
npm start
```

## Configuration

### Environment Variables

- `DRUID_URL` - Druid router/broker URL (default: `http://localhost:8888`)
- `DRUID_USERNAME` - Authentication username (required for most production clusters)
- `DRUID_PASSWORD` - Authentication password (required for most production clusters)
- `DRUID_TIMEOUT` - Request timeout in milliseconds (default: `30000`)

### Transport Options

```bash
# Default stdio transport (for MCP clients)
apache-druid-mcp

# SSE transport for HTTP-based clients
apache-druid-mcp --transport sse --port 3000
```

## Claude Desktop Integration

Add this configuration to your Claude Desktop config file:

### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows  
`%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apache-druid": {
      "command": "npx",
      "args": ["apache-druid-mcp"],
      "env": {
        "DRUID_URL": "https://your-druid-cluster.com:8888",
        "DRUID_USERNAME": "your-username",
        "DRUID_PASSWORD": "your-password"
      }
    }
  }
}
```

For local development (no authentication):

```json
{
  "mcpServers": {
    "apache-druid": {
      "command": "npx", 
      "args": ["apache-druid-mcp"],
      "env": {
        "DRUID_URL": "http://localhost:8888"
      }
    }
  }
}
```

## VS Code Integration

### Using MCP Extension

1. Install the MCP extension for VS Code
2. Add to your VS Code settings.json:

```json
{
  "mcp.servers": {
    "apache-druid": {
      "command": "npx",
      "args": ["apache-druid-mcp"],
      "env": {
        "DRUID_URL": "https://your-druid-cluster.com:8888",
        "DRUID_USERNAME": "your-username",
        "DRUID_PASSWORD": "your-password"
      }
    }
  }
}
```

### Using Codeium or Continue.dev

For HTTP-based AI coding assistants, use SSE transport:

```json
{
  "mcpServers": [
    {
      "name": "apache-druid",
      "url": "http://localhost:3000/sse",
      "env": {
        "DRUID_URL": "https://your-druid-cluster.com:8888",
        "DRUID_USERNAME": "your-username",
        "DRUID_PASSWORD": "your-password"
      }
    }
  ]
}
```

Start the server with SSE transport:
```bash
npx apache-druid-mcp --transport sse --port 3000
```

## Available Tools

The MCP server provides these tools for interacting with Apache Druid:

### `execute_sql_query`
Execute SQL queries against Druid datasources.

**Parameters:**
- `query` (string, required) - SQL query to execute
- `context` (object, optional) - Query context parameters

**Example:**
```sql
SELECT __time, page, COUNT(*) as views 
FROM wikipedia 
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR 
GROUP BY 1, 2 
ORDER BY views DESC 
LIMIT 10
```

### `list_datasources`
Get a list of all available datasources in the Druid cluster.

### `get_datasource_metadata`
Get detailed metadata for a specific datasource including schema, segments, size, and intervals.

**Parameters:**
- `datasource` (string, required) - Name of the datasource

### `test_connection`
Test connectivity to the Druid cluster and return status information.

## Available Resources

Access Druid cluster information through these resources:

- `druid://cluster/status` - Current cluster status and health
- `druid://datasources` - List of all datasources  
- `druid://datasource/{name}` - Detailed metadata for specific datasource

## Examples

### Basic Usage

```bash
# Start with default settings
npx apache-druid-mcp

# Connect to remote Druid cluster
DRUID_URL=https://druid.example.com:8888 npx apache-druid-mcp

# With authentication
DRUID_URL=https://secure-druid.com:8888 \
DRUID_USERNAME=admin \
DRUID_PASSWORD=secret \
npx apache-druid-mcp
```

### Using with Claude Desktop

Once configured, you can ask Claude:

- "Show me the available datasources in Druid"
- "Query the wikipedia datasource for top pages in the last hour"
- "What's the schema of the events datasource?"
- "Test the connection to Druid"

### Advanced Configuration

```bash
# Custom timeout and SSE transport
DRUID_TIMEOUT=60000 npx apache-druid-mcp --transport sse --port 8080
```

## License

Apache License 2.0 