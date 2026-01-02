import { NextRequest, NextResponse } from 'next/server';
import { MCPServer, MCPRequest, MCPResponse } from '@/lib/mcp-server';

const mcpServer = new MCPServer();

// Initialize server on module load
mcpServer.initialize().catch(console.error);

/**
 * MCP HTTP API Route Handler
 * 
 * Supports both regular JSON-RPC requests and Server-Sent Events (SSE) streaming
 * 
 * POST /api/mcp
 * - Body: JSON-RPC 2.0 request
 * - Returns: JSON-RPC 2.0 response
 * 
 * GET /api/mcp?stream=true
 * - Returns: Server-Sent Events stream
 * 
 * Query Parameters:
 * - stream: Enable SSE streaming mode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate JSON-RPC 2.0 format
    if (body.jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: body.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0"',
          },
        },
        { status: 400 }
      );
    }

    const mcpRequest: MCPRequest = body;
    const response = await mcpServer.handleRequest(mcpRequest);

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 }
    );
  }
}

/**
 * GET handler for streaming mode and CORS preflight
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get('stream') === 'true';

  if (stream) {
    // Return SSE stream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n'));

        // Send server info
        const serverInfo = {
          jsonrpc: '2.0',
          id: null,
          result: {
            type: 'server_info',
            tools: mcpServer.getTools(),
            resources: mcpServer.getResources(),
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(serverInfo)}\n\n`));

        // Keep connection alive with periodic pings
        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: {"type":"ping","timestamp":${Date.now()}}\n\n`));
          } catch (e) {
            clearInterval(interval);
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Return server information
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: null,
      result: {
        server: 'MCP HTTP Server',
        version: '1.0.0',
        endpoints: {
          post: '/api/mcp',
          stream: '/api/mcp?stream=true',
        },
        tools: mcpServer.getTools(),
        resources: mcpServer.getResources(),
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
