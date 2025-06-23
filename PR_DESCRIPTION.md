# Add Apache Druid MCP (Model Context Protocol) Server

### Description

This PR introduces a new **Apache Druid MCP Server** that enables AI agents and applications to interact with Apache Druid through the Model Context Protocol (MCP). The MCP server provides a standardized interface for AI tools like Claude, ChatGPT, and other MCP-compatible clients to query Druid datasources, retrieve metadata, and perform administrative operations.

#### What is MCP?
The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to data sources and tools. By providing an MCP server for Apache Druid, we're making Druid more accessible to the growing ecosystem of AI-powered applications and workflows.

#### Added MCP Server Implementation
- **Location**: `mcp-server/` directory containing a complete TypeScript-based MCP server
- **Architecture**: Clean, minimal single-file approach following established MCP server patterns
- **Dependencies**: Minimal footprint using only `@modelcontextprotocol/sdk` and `axios`
- **Deployment**: Supports both NPX (`npx apache-druid-mcp`) and Docker deployment methods

#### Core MCP Tools Provided
1. **`execute_sql_query`** - Execute SQL queries against Druid datasources with proper error handling
2. **`list_datasources`** - Retrieve all available datasources with metadata
3. **`get_datasource_metadata`** - Get detailed schema and configuration for specific datasources  
4. **`test_connection`** - Verify connectivity and authentication with Druid broker

#### Key Features
- **Secure Configuration**: Environment-based configuration for URLs, credentials, and timeouts
- **Error Handling**: Comprehensive error handling with informative messages for AI agents
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **Production Ready**: Docker support, proper logging, and configuration validation
- **Documentation**: Complete deployment guides for both NPX and Docker methods

#### Design Decisions
- **Single-file Architecture**: Following the pattern of successful MCP servers (like Google Maps MCP), consolidated handlers into `index.ts` for simplicity and maintainability
- **Environment Configuration**: Uses standard environment variables (`DRUID_URL`, `DRUID_USERNAME`, etc.) for flexible deployment
- **Stdio Transport**: Uses MCP's standard stdio transport for seamless integration with AI clients
- **Minimal Dependencies**: Only essential dependencies to reduce attack surface and maintenance burden

#### Use Cases
- **AI-Powered Analytics**: Enable AI agents to query Druid data for insights and reporting
- **Automated Monitoring**: AI tools can monitor datasource health and performance
- **Dynamic Dashboards**: AI applications can build dynamic visualizations based on Druid data
- **Data Discovery**: AI agents can explore and understand available datasets in Druid

#### Release note
Added Apache Druid MCP (Model Context Protocol) Server that enables AI agents and applications to interact with Druid through a standardized interface. The MCP server provides tools for executing SQL queries, listing datasources, retrieving metadata, and testing connections. Available via NPX (`npx apache-druid-mcp`) and Docker deployment methods. This integration makes Druid more accessible to AI-powered applications and workflows.

<hr>

##### Key added files in this PR
 * `mcp-server/src/index.ts` - Main MCP server implementation with all tools and handlers
 * `mcp-server/src/druid-client.ts` - Druid API client with proper error handling
 * `mcp-server/package.json` - NPX-ready package configuration
 * `mcp-server/Dockerfile` - Multi-stage Docker build for production deployment
 * `mcp-server/docker-compose.yml` - Docker Compose configuration
 * `mcp-server/DEPLOY.md` - Comprehensive deployment documentation
 * `mcp-server/README.md` - Project overview and quick start guide

<hr>

This PR has:

- [x] been self-reviewed.
- [x] added documentation for new or modified features or behaviors.
- [x] a release note entry in the PR description.
- [x] added comments explaining the "why" and the intent of the code wherever would not be obvious for an unfamiliar reader.
- [x] added unit tests or modified existing tests to cover new code paths, ensuring the threshold for code coverage is met.
- [x] been tested in a test Druid cluster.

**Note**: This MCP server is a standalone TypeScript application that communicates with Druid via HTTP APIs. It doesn't modify core Druid functionality but provides a new integration point for AI applications. The server has been thoroughly tested with both NPX and Docker deployment methods. 