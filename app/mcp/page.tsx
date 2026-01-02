'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, StopIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface ServerInfo {
  server: string;
  version: string;
  endpoints: {
    post: string;
    stream: string;
  };
  tools: MCPTool[];
  resources: MCPResource[];
}

export default function MCPInterfacePage() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState<string[]>([]);
  const [requestBody, setRequestBody] = useState(`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}`);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadServerInfo();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const loadServerInfo = async () => {
    try {
      const res = await fetch('/api/mcp');
      const data = await res.json();
      if (data.result) {
        setServerInfo(data.result);
      }
    } catch (err) {
      console.error('Failed to load server info:', err);
    }
  };

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const body = JSON.parse(requestBody);
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleStream = () => {
    if (streaming) {
      // Stop streaming
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStreaming(false);
      return;
    }

    // Start streaming
    setStreaming(true);
    setStreamMessages([]);
    const eventSource = new EventSource('/api/mcp?stream=true');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStreamMessages((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ${JSON.stringify(data, null, 2)}`,
        ]);
      } catch {
        setStreamMessages((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ${event.data}`,
        ]);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      eventSourceRef.current = null;
      setStreaming(false);
    };
  };

  const insertExampleRequest = (method: string) => {
    const examples: Record<string, string> = {
      initialize: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}`,
      'tools/list': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}`,
      'tools/call': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "Hello, MCP!"
    }
  }
}`,
      'resources/list': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list"
}`,
      ping: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "ping"
}`,
      'get_available_countries': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_available_countries",
    "arguments": {}
  }
}`,
      'get_channels': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_channels",
    "arguments": {
      "country": "DE"
    }
  }
}`,
      'get_current_programmes': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_current_programmes",
    "arguments": {
      "country": "DE"
    }
  }
}`,
      'search_programmes': `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_programmes",
    "arguments": {
      "country": "DE",
      "query": "Nachrichten",
      "limit": 10
    }
  }
}`,
    };

    if (examples[method]) {
      setRequestBody(examples[method]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            MCP HTTP Stream Interface
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Model Context Protocol Server mit HTTP Streaming Support
          </p>
        </div>

        {/* Server Info Card */}
        {serverInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Server Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Server</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {serverInfo.server}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {serverInfo.version}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">POST Endpoint</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {serverInfo.endpoints.post}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stream Endpoint</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {serverInfo.endpoints.stream}
                </code>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              JSON-RPC Request
            </h2>

            {/* Quick Examples */}
            <div className="mb-4">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Basic Examples:</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['initialize', 'tools/list', 'tools/call', 'resources/list', 'ping'].map(
                  (method) => (
                    <button
                      key={method}
                      onClick={() => insertExampleRequest(method)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      {method}
                    </button>
                  )
                )}
              </div>
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">TV Programme Examples:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['get_available_countries', 'get_channels', 'get_current_programmes', 'search_programmes'].map(
                  (method) => (
                    <button
                      key={method}
                      onClick={() => insertExampleRequest(method)}
                      className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      {method}
                    </button>
                  )
                )}
              </div>
            </div>

            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter JSON-RPC 2.0 request..."
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleRequest}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-5 w-5" />
                {loading ? 'Sending...' : 'Send Request'}
              </button>
              <button
                onClick={loadServerInfo}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Refresh Info
              </button>
            </div>
          </div>

          {/* Response Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Response
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            )}

            {response && (
              <pre className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}

            {!error && !response && (
              <div className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500">
                  Response will appear here...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Streaming Panel */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Server-Sent Events Stream
            </h2>
            <button
              onClick={handleStream}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                streaming
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {streaming ? (
                <>
                  <StopIcon className="h-5 w-5" />
                  Stop Stream
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  Start Stream
                </>
              )}
            </button>
          </div>

          <div className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm overflow-auto">
            {streamMessages.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500">
                Stream messages will appear here...
              </p>
            ) : (
              streamMessages.map((msg, idx) => (
                <div key={idx} className="mb-2 text-gray-900 dark:text-gray-100">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tools & Resources */}
        {serverInfo && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tools */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Available Tools ({serverInfo.tools.length})
              </h2>
              <div className="space-y-3">
                {serverInfo.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Available Resources ({serverInfo.resources.length})
              </h2>
              <div className="space-y-3">
                {serverInfo.resources.map((resource) => (
                  <div
                    key={resource.uri}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {resource.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      {resource.uri}
                    </p>
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
