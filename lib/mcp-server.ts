/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides a server-side implementation of the MCP protocol for HTTP streaming
 */

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  params?: Record<string, any>;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class MCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private initialized = false;

  constructor() {
    this.registerDefaultTools();
    this.registerDefaultResources();
  }

  /**
   * Initialize the MCP server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Register a tool with the server
   */
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register a resource with the server
   */
  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  /**
   * Handle an MCP request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolCall(request);
        case 'resources/list':
          return this.handleResourcesList(request);
        case 'resources/read':
          return this.handleResourceRead(request);
        case 'ping':
          return this.handlePing(request);
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: 'mcp-http-server',
          version: '1.0.0',
        },
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: Array.from(this.tools.values()),
      },
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    if (!toolName) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Invalid params: name is required',
        },
      };
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Tool not found: ${toolName}`,
        },
      };
    }

    try {
      const result = await this.executeTool(toolName, request.params?.arguments || {});
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Tool execution failed',
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Handle resources/list request
   */
  private handleResourcesList(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources: Array.from(this.resources.values()),
      },
    };
  }

  /**
   * Handle resources/read request
   */
  private async handleResourceRead(request: MCPRequest): Promise<MCPResponse> {
    const uri = request.params?.uri;
    if (!uri) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Invalid params: uri is required',
        },
      };
    }

    const resource = this.resources.get(uri);
    if (!resource) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Resource not found: ${uri}`,
        },
      };
    }

    // In a real implementation, you would fetch the resource content here
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text: `Resource: ${resource.name}\nDescription: ${resource.description || 'No description'}`,
          },
        ],
      },
    };
  }

  /**
   * Handle ping request
   */
  private handlePing(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        timestamp: Date.now(),
        status: 'ok',
      },
    };
  }

  /**
   * Execute a tool by name
   */
  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'echo':
        return `Echo: ${args.message || 'No message provided'}`;
      case 'add':
        return {
          result: (args.a || 0) + (args.b || 0),
          operation: 'add',
        };
      case 'get_time':
        return {
          timestamp: Date.now(),
          iso: new Date().toISOString(),
          local: new Date().toLocaleString(),
        };
      case 'get_server_info':
        return {
          name: 'mcp-http-server',
          version: '1.0.0',
          tools: Array.from(this.tools.keys()),
          resources: Array.from(this.resources.keys()),
        };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    this.registerTool({
      name: 'echo',
      description: 'Echoes back the provided message',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to echo back',
          },
        },
        required: ['message'],
      },
    });

    this.registerTool({
      name: 'add',
      description: 'Adds two numbers together',
      inputSchema: {
        type: 'object',
        properties: {
          a: {
            type: 'number',
            description: 'First number',
          },
          b: {
            type: 'number',
            description: 'Second number',
          },
        },
        required: ['a', 'b'],
      },
    });

    this.registerTool({
      name: 'get_time',
      description: 'Gets the current server time',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    this.registerTool({
      name: 'get_server_info',
      description: 'Gets information about the MCP server',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });
  }

  /**
   * Register default resources
   */
  private registerDefaultResources(): void {
    this.registerResource({
      uri: 'mcp://server/info',
      name: 'Server Information',
      description: 'Information about the MCP server',
      mimeType: 'application/json',
    });

    this.registerResource({
      uri: 'mcp://server/tools',
      name: 'Available Tools',
      description: 'List of all available tools',
      mimeType: 'application/json',
    });
  }

  /**
   * Get all registered tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all registered resources
   */
  getResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }
}
