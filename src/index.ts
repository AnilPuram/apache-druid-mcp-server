#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { 
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequest,
  CallToolResult,
  ListResourcesResult,
  ListToolsResult,
  ReadResourceRequest,
  ReadResourceResult,
  Tool,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import { DruidClient, DruidConfig } from './druid-client.js';

interface ServerConfig {
  druid: DruidConfig;
  transport: 'stdio' | 'sse';
  port?: number;
}

/**
 * Get configuration from environment variables and command line arguments
 */
function getConfig(): ServerConfig {
  const druidConfig: DruidConfig = {
    url: process.env.DRUID_URL || 'http://localhost:8888',
    username: process.env.DRUID_USERNAME,
    password: process.env.DRUID_PASSWORD,
    timeout: process.env.DRUID_TIMEOUT ? parseInt(process.env.DRUID_TIMEOUT) : 30000,
  };

  // Parse command line arguments for transport selection
  const args = process.argv.slice(2);
  let transport: 'stdio' | 'sse' = 'stdio'; // Default to stdio
  let port = 3000; // Default SSE port

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--transport' && args[i + 1]) {
      const transportArg = args[i + 1];
      if (transportArg === 'sse' || transportArg === 'stdio') {
        transport = transportArg;
      }
      i++; // Skip next argument as it's the transport value
    } else if (args[i] === '--port' && args[i + 1]) {
      const portArg = parseInt(args[i + 1]);
      if (!isNaN(portArg)) {
        port = portArg;
      }
      i++; // Skip next argument as it's the port value
    }
  }

  return {
    druid: druidConfig,
    transport,
    port,
  };
}

/**
 * Display help message
 */
function showHelp(): void {
  console.error(`
Apache Druid MCP Server v1.0.1

USAGE:
  apache-druid-mcp [OPTIONS]

OPTIONS:
  --help               Show this help message
  --transport <type>   Transport protocol: stdio (default) or sse
  --port <number>      Port for SSE transport (default: 3000)

ENVIRONMENT VARIABLES:
  DRUID_URL           Druid broker URL (default: http://localhost:8888)
  DRUID_USERNAME      Authentication username (required for most production clusters)
  DRUID_PASSWORD      Authentication password (required for most production clusters)
  DRUID_TIMEOUT       Request timeout in milliseconds (default: 30000)

EXAMPLES:
  # Default configuration (stdio transport)
  apache-druid-mcp
  
  # Use SSE transport on default port 3000
  apache-druid-mcp --transport sse
  
  # Use SSE transport on custom port
  apache-druid-mcp --transport sse --port 8080
  
  # Custom Druid URL with SSE transport
  DRUID_URL=https://production-druid:8888 apache-druid-mcp --transport sse
  
  # With authentication and SSE transport
  DRUID_URL=https://secure-druid.example.com:8888 \\
  DRUID_USERNAME=admin \\
  DRUID_PASSWORD=secret \\
  apache-druid-mcp --transport sse --port 4000
`);
}

// Initialize configuration
const config = getConfig();
const druidClient = new DruidClient(config.druid);

/**
 * List available tools
 */
async function listTools(): Promise<ListToolsResult> {
  const tools: Tool[] = [
    {
      name: 'execute_sql_query',
      description: 'Execute a SQL query against Apache Druid and return results',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query to execute (e.g., SELECT * FROM datasource LIMIT 10)',
          },
          context: {
            type: 'object',
            description: 'Optional query context parameters',
            additionalProperties: true,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_datasources',
      description: 'Get a list of all available datasources in Druid',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_datasource_metadata',
      description: 'Get detailed metadata for a specific datasource including schema, size, and segments',
      inputSchema: {
        type: 'object',
        properties: {
          datasource: {
            type: 'string',
            description: 'Name of the datasource to get metadata for',
          },
        },
        required: ['datasource'],
      },
    },
    {
      name: 'test_connection',
      description: 'Test connection to the Druid cluster',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  return { tools };
}

/**
 * Handle tool calls
 */
async function callTool(request: CallToolRequest): Promise<CallToolResult> {
  try {
    switch (request.params.name) {
      case 'execute_sql_query':
        return await handleExecuteSqlQuery(request);
      case 'list_datasources':
        return await handleListDatasources();
      case 'get_datasource_metadata':
        return await handleGetDatasourceMetadata(request);
      case 'test_connection':
        return await handleTestConnection();
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * List available resources
 */
async function listResources(): Promise<ListResourcesResult> {
  try {
    const datasources = await druidClient.getDatasources();
    
    const resources: Resource[] = [
      {
        uri: 'druid://cluster/status',
        name: 'Cluster Status',
        description: 'Current status and health of the Druid cluster',
        mimeType: 'application/json',
      },
      {
        uri: 'druid://datasources',
        name: 'All Datasources',
        description: 'List of all available datasources in the cluster',
        mimeType: 'application/json',
      },
      ...datasources.map((ds) => ({
        uri: `druid://datasource/${ds}`,
        name: `Datasource: ${ds}`,
        description: `Metadata and schema information for datasource '${ds}'`,
        mimeType: 'application/json',
      })),
    ];

    return { resources };
  } catch (error) {
    // Return basic resources if we can't connect to Druid
    const resources: Resource[] = [
      {
        uri: 'druid://cluster/status',
        name: 'Cluster Status',
        description: 'Current status and health of the Druid cluster',
        mimeType: 'application/json',
      },
      {
        uri: 'druid://datasources',
        name: 'All Datasources',
        description: 'List of all available datasources in the cluster',
        mimeType: 'application/json',
      },
    ];
    return { resources };
  }
}

/**
 * Read a specific resource
 */
async function readResource(request: ReadResourceRequest): Promise<ReadResourceResult> {
  try {
    const uri = request.params.uri;
    
    if (uri === 'druid://cluster/status') {
      const status = await druidClient.getStatus();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
    
    if (uri === 'druid://datasources') {
      const datasources = await druidClient.getDatasources();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(datasources, null, 2),
          },
        ],
      };
    }
    
    const datasourceMatch = uri.match(/^druid:\/\/datasource\/(.+)$/);
    if (datasourceMatch) {
      const datasource = datasourceMatch[1];
      const metadata = await druidClient.getDatasourceMetadata(datasource);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(metadata, null, 2),
          },
        ],
      };
    }
    
    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to read resource: ${errorMessage}`);
  }
}

// Tool handlers
async function handleExecuteSqlQuery(request: CallToolRequest): Promise<CallToolResult> {
  const { query, context } = request.params.arguments as { query: string; context?: any };
  const result = await druidClient.executeSqlQuery(query, context);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleListDatasources(): Promise<CallToolResult> {
  const datasources = await druidClient.getDatasources();
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(datasources, null, 2),
      },
    ],
  };
}

async function handleGetDatasourceMetadata(request: CallToolRequest): Promise<CallToolResult> {
  const { datasource } = request.params.arguments as { datasource: string };
  const metadata = await druidClient.getDatasourceMetadata(datasource);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(metadata, null, 2),
      },
    ],
  };
}

async function handleTestConnection(): Promise<CallToolResult> {
  const status = await druidClient.getStatus();
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Connection successful!\n${JSON.stringify(status, null, 2)}`,
      },
    ],
  };
}

/**
 * Main server function
 */
async function main(): Promise<void> {
  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  console.error('Starting Apache Druid MCP Server...');

  try {
    console.error(`Druid URL: ${config.druid.url}`);
    console.error(`Transport: ${config.transport}`);
    if (config.transport === 'sse') {
      console.error(`Port: ${config.port}`);
    }

    // Create MCP server
    const server = new Server(
      {
        name: 'apache-druid-mcp',
        version: '1.0.1',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, listTools);
    server.setRequestHandler(CallToolRequestSchema, callTool);
    server.setRequestHandler(ListResourcesRequestSchema, listResources);
    server.setRequestHandler(ReadResourceRequestSchema, readResource);

    // Create and connect transport based on configuration
    if (config.transport === 'sse') {
      // Create Express app for SSE transport
      const app = express();
      app.use(express.json());
      
      // Store transports for session management
      const transports: Record<string, SSEServerTransport> = {};
      
      // SSE endpoint that clients connect to
      app.get('/sse', async (req: Request, res: Response) => {
        console.error('Received GET request to /sse (establishing SSE stream)');
        try {
          // Create a new SSE transport for the client
          // The endpoint for POST messages is '/messages'
          const transport = new SSEServerTransport('/messages', res);
          
          // Store the transport by session ID
          const sessionId = transport.sessionId;
          transports[sessionId] = transport;
          
          // Set up onclose handler to clean up transport when closed
          transport.onclose = () => {
            console.error(`SSE transport closed for session ${sessionId}`);
            delete transports[sessionId];
          };
          
          // Connect the transport to the MCP server
          await server.connect(transport);
          console.error(`Established SSE stream with session ID: ${sessionId}`);
        } catch (error) {
          console.error('Error establishing SSE stream:', error);
          if (!res.headersSent) {
            res.status(500).send('Error establishing SSE stream');
          }
        }
      });
      
      // Messages endpoint for client communication
      app.post('/messages', async (req: Request, res: Response) => {
        console.error('Received POST request to /messages');
        try {
          // Extract session ID from URL query parameter
          const sessionId = req.query.sessionId as string;
          
          if (!sessionId) {
            console.error('No session ID provided in request URL');
            res.status(400).send('Missing sessionId parameter');
            return;
          }
          
          const transport = transports[sessionId];
          if (!transport) {
            console.error(`No active transport found for session ID: ${sessionId}`);
            res.status(404).send('Session not found');
            return;
          }
          
          // Handle the POST message with the transport
          await transport.handlePostMessage(req, res, req.body);
        } catch (error) {
          console.error('Error handling request:', error);
          if (!res.headersSent) {
            res.status(500).send('Error handling request');
          }
        }
      });
      
      // Start Express server
      const httpServer = app.listen(config.port, () => {
        console.error('Apache Druid MCP Server started successfully!');
        console.error(`Using SSE transport on http://localhost:${config.port}/sse`);
        console.error(`Messages endpoint: http://localhost:${config.port}/messages`);
        console.error('Server will keep running until terminated...');
      });
      
      // Handle graceful shutdown for SSE transport
      process.on('SIGINT', () => {
        console.error('Shutting down SSE server...');
        // Close all active transports to properly clean up resources
        for (const sessionId in transports) {
          try {
            console.error(`Closing transport for session ${sessionId}`);
            transports[sessionId].close();
            delete transports[sessionId];
          } catch (error) {
            console.error(`Error closing transport for session ${sessionId}:`, error);
          }
        }
        httpServer.close(() => {
          process.exit(0);
        });
      });
      
    } else {
      // Default stdio transport
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('Apache Druid MCP Server started successfully!');
      console.error('Using stdio transport for MCP client communication');
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}