/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides a server-side implementation of the MCP protocol for HTTP streaming
 */

import { getEpgData, getAvailableCountries, getCountryConfig } from './epg-service';
import { XMLParser } from 'fast-xml-parser';

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

// XML Parser für EPG-Daten
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  trimValues: true,
});

export class MCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private initialized = false;

  constructor() {
    this.registerDefaultTools();
    this.registerEpgTools();
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
      // EPG Tools
      case 'get_available_countries':
        return this.getAvailableCountries();
      case 'get_channels':
        return this.getChannels(args.country || 'DE');
      case 'get_programme':
        return this.getProgramme(args.country || 'DE', args.channelId);
      case 'get_current_programmes':
        return this.getCurrentProgrammes(args.country || 'DE', args.channelId);
      case 'search_programmes':
        return this.searchProgrammes(args.country || 'DE', args.query, args.limit || 10);
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
   * Register EPG-related tools
   */
  private registerEpgTools(): void {
    this.registerTool({
      name: 'get_available_countries',
      description: 'Gets a list of all available countries with EPG data',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    this.registerTool({
      name: 'get_channels',
      description: 'Gets all TV channels for a specific country',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country code (e.g., DE, US, GB, FR). Default: DE',
          },
        },
      },
    });

    this.registerTool({
      name: 'get_programme',
      description: 'Gets the programme schedule for a specific TV channel',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country code (e.g., DE, US, GB, FR). Default: DE',
          },
          channelId: {
            type: 'string',
            description: 'Channel ID to get programme for',
          },
        },
        required: ['channelId'],
      },
    });

    this.registerTool({
      name: 'get_current_programmes',
      description: 'Gets currently airing programmes for a country or specific channel',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country code (e.g., DE, US, GB, FR). Default: DE',
          },
          channelId: {
            type: 'string',
            description: 'Optional: Channel ID to filter by. If not provided, returns all current programmes',
          },
        },
      },
    });

    this.registerTool({
      name: 'search_programmes',
      description: 'Searches for programmes by title or description',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country code (e.g., DE, US, GB, FR). Default: DE',
          },
          query: {
            type: 'string',
            description: 'Search query to find programmes',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return. Default: 10',
          },
        },
        required: ['query'],
      },
    });
  }

  /**
   * Get available countries
   */
  private getAvailableCountries(): any {
    const countries = getAvailableCountries();
    return {
      countries,
      count: countries.length,
    };
  }

  /**
   * Get channels for a country
   */
  private async getChannels(countryCode: string): Promise<any> {
    try {
      const xmlData = await getEpgData(countryCode);
      const parsed = xmlParser.parse(xmlData);
      const tv = parsed.tv || {};
      const channels = Array.isArray(tv.channel) ? tv.channel : tv.channel ? [tv.channel] : [];

      return {
        country: countryCode.toUpperCase(),
        channels: channels.map((ch: any) => ({
          id: ch['@_id'],
          name: Array.isArray(ch['display-name']) ? ch['display-name'][0] : ch['display-name'],
          icon: ch.icon?.['@_src'],
        })),
        count: channels.length,
      };
    } catch (error) {
      throw new Error(`Failed to get channels: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get programme for a specific channel
   */
  private async getProgramme(countryCode: string, channelId: string): Promise<any> {
    if (!channelId) {
      throw new Error('channelId is required');
    }

    try {
      const xmlData = await getEpgData(countryCode);
      const parsed = xmlParser.parse(xmlData);
      const tv = parsed.tv || {};
      const programmes = Array.isArray(tv.programme) ? tv.programme : tv.programme ? [tv.programme] : [];

      const channelProgrammes = programmes
        .filter((prog: any) => prog['@_channel'] === channelId)
        .map((prog: any) => ({
          start: prog['@_start'],
          stop: prog['@_stop'],
          title: typeof prog.title === 'string' ? prog.title : prog.title?.['#text'] || prog.title?.[0]?.['#text'] || '',
          description: typeof prog.desc === 'string' ? prog.desc : prog.desc?.['#text'] || prog.desc?.[0]?.['#text'] || '',
          category: Array.isArray(prog.category) ? prog.category : prog.category ? [prog.category] : [],
        }))
        .sort((a: any, b: any) => a.start.localeCompare(b.start));

      return {
        country: countryCode.toUpperCase(),
        channelId,
        programmes: channelProgrammes,
        count: channelProgrammes.length,
      };
    } catch (error) {
      throw new Error(`Failed to get programme: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get currently airing programmes
   */
  private async getCurrentProgrammes(countryCode: string, channelId?: string): Promise<any> {
    try {
      const now = new Date();
      const nowStr = now.toISOString().replace(/[-:]/g, '').split('.')[0] + ' +0000';

      const xmlData = await getEpgData(countryCode);
      const parsed = xmlParser.parse(xmlData);
      const tv = parsed.tv || {};
      const programmes = Array.isArray(tv.programme) ? tv.programme : tv.programme ? [tv.programme] : [];

      const currentProgrammes = programmes
        .filter((prog: any) => {
          if (channelId && prog['@_channel'] !== channelId) return false;
          const start = prog['@_start'];
          const stop = prog['@_stop'];
          return start <= nowStr && stop >= nowStr;
        })
        .map((prog: any) => ({
          channel: prog['@_channel'],
          start: prog['@_start'],
          stop: prog['@_stop'],
          title: typeof prog.title === 'string' ? prog.title : prog.title?.['#text'] || prog.title?.[0]?.['#text'] || '',
          description: typeof prog.desc === 'string' ? prog.desc : prog.desc?.['#text'] || prog.desc?.[0]?.['#text'] || '',
          category: Array.isArray(prog.category) ? prog.category : prog.category ? [prog.category] : [],
        }));

      return {
        country: countryCode.toUpperCase(),
        channelId: channelId || 'all',
        currentProgrammes,
        count: currentProgrammes.length,
        timestamp: now.toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get current programmes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search programmes
   */
  private async searchProgrammes(countryCode: string, query: string, limit: number = 10): Promise<any> {
    if (!query) {
      throw new Error('query is required');
    }

    try {
      const searchQuery = query.toLowerCase();
      const xmlData = await getEpgData(countryCode);
      const parsed = xmlParser.parse(xmlData);
      const tv = parsed.tv || {};
      const programmes = Array.isArray(tv.programme) ? tv.programme : tv.programme ? [tv.programme] : [];

      const matchingProgrammes = programmes
        .filter((prog: any) => {
          const title = typeof prog.title === 'string' ? prog.title : prog.title?.['#text'] || prog.title?.[0]?.['#text'] || '';
          const desc = typeof prog.desc === 'string' ? prog.desc : prog.desc?.['#text'] || prog.desc?.[0]?.['#text'] || '';
          return title.toLowerCase().includes(searchQuery) || desc.toLowerCase().includes(searchQuery);
        })
        .slice(0, limit)
        .map((prog: any) => ({
          channel: prog['@_channel'],
          start: prog['@_start'],
          stop: prog['@_stop'],
          title: typeof prog.title === 'string' ? prog.title : prog.title?.['#text'] || prog.title?.[0]?.['#text'] || '',
          description: typeof prog.desc === 'string' ? prog.desc : prog.desc?.['#text'] || prog.desc?.[0]?.['#text'] || '',
          category: Array.isArray(prog.category) ? prog.category : prog.category ? [prog.category] : [],
        }));

      return {
        country: countryCode.toUpperCase(),
        query,
        programmes: matchingProgrammes,
        count: matchingProgrammes.length,
      };
    } catch (error) {
      throw new Error(`Failed to search programmes: ${error instanceof Error ? error.message : String(error)}`);
    }
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
