import { WebSocketMessage } from '@/types';
import { AuthUtils } from '@/utils/auth';
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('New WebSocket connection attempt');

      // Authenticate the connection
      this.authenticateConnection(ws, request)
        .then(() => {
          console.log(`User ${ws.userId} connected via WebSocket`);
          this.addClient(ws);
          this.setupClientHandlers(ws);
        })
        .catch(error => {
          console.error('WebSocket authentication failed:', error);
          ws.close(1008, 'Authentication failed');
        });
    });
  }

  private async authenticateConnection(
    ws: AuthenticatedWebSocket,
    request: any
  ): Promise<void> {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const payload = AuthUtils.verifyAccessToken(token);
      ws.userId = payload.userId;
      ws.isAlive = true;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private addClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;

    if (!this.clients.has(ws.userId)) {
      this.clients.set(ws.userId, new Set());
    }

    this.clients.get(ws.userId)!.add(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;

    const userClients = this.clients.get(ws.userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  private setupClientHandlers(ws: AuthenticatedWebSocket): void {
    ws.on('message', data => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            message: 'Invalid message format',
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      console.log(`User ${ws.userId} disconnected from WebSocket`);
      this.removeClient(ws);
    });

    ws.on('error', error => {
      console.error(`WebSocket error for user ${ws.userId}:`, error);
      this.removeClient(ws);
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
      })
    );
  }

  private handleMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): void {
    switch (message.type) {
      case 'SESSION_START':
        this.broadcastToUser(ws.userId!, {
          type: 'SESSION_START',
          userId: ws.userId!,
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'SESSION_END':
        this.broadcastToUser(ws.userId!, {
          type: 'SESSION_END',
          userId: ws.userId!,
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'SESSION_PAUSE':
        this.broadcastToUser(ws.userId!, {
          type: 'SESSION_PAUSE',
          userId: ws.userId!,
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'SESSION_RESUME':
        this.broadcastToUser(ws.userId!, {
          type: 'SESSION_RESUME',
          userId: ws.userId!,
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'TIMER_SYNC':
        this.broadcastToUser(ws.userId!, {
          type: 'TIMER_SYNC',
          userId: ws.userId!,
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            message: 'Unknown message type',
            timestamp: new Date().toISOString(),
          })
        );
    }
  }

  /**
   * Broadcast message to all clients of a specific user
   */
  public broadcastToUser(userId: string, message: WebSocketMessage): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const messageStr = JSON.stringify(message);
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcastToAll(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(userClients => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    });
  }

  /**
   * Send message to a specific client
   */
  public sendToClient(userId: string, message: WebSocketMessage): boolean {
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      const ws = Array.from(userClients)[0]; // Send to first client
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.clients.size;
  }

  /**
   * Get total connections count
   */
  public getTotalConnectionsCount(): number {
    let total = 0;
    this.clients.forEach(userClients => {
      total += userClients.size;
    });
    return total;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    const userClients = this.clients.get(userId);
    return userClients ? userClients.size > 0 : false;
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(userClients => {
        userClients.forEach(ws => {
          if (!ws.isAlive) {
            ws.terminate();
            userClients.delete(ws);
            return;
          }

          ws.isAlive = false;
          ws.ping();
        });
      });
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Close all connections
   */
  public closeAllConnections(): void {
    this.clients.forEach(userClients => {
      userClients.forEach(ws => {
        ws.close(1001, 'Server shutting down');
      });
    });
    this.clients.clear();
  }

  /**
   * Get WebSocket server instance
   */
  public getServer(): WebSocketServer {
    return this.wss;
  }
}
