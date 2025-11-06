import EventEmitter from 'events';

/**
 * WebSocket connection manager for broadcasting webhook events
 */

class WebSocketManager {
  /** @type {Set<WebSocket>} */
  clients;
  /** @type {EventEmitter} */
  emitter;

  constructor() {
    this.clients = new Set();
    this.emitter = new EventEmitter();
  }

  /**
   * Add a new WebSocket client
   * @param {WebSocket} ws - The WebSocket connection
   */
  addClient(ws) {
    this.clients.add(ws);
    console.log(
      'WebSocket client connected. Total clients:',
      this.clients.size
    );

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(
        'WebSocket client disconnected. Total clients:',
        this.clients.size
      );
    });

    // Handle client errors
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      this.clients.delete(ws);
    });

    ws.on('message', (data) => {
      data = JSON.parse(data);
      console.log('WebSocket client message:', data);
      this.emitter.emit('message', data);

      if (data?.name) {
        console.log('WebSocket client subscribed:', data.name);
        ws[Symbol.for('name')] = data.name;
      }
    });
  }

  /**
   * Broadcast a message to all connected clients
   * @param {Object} data - The data to broadcast
   */
  broadcast(data) {
    if (this.clients.size === 0) {
      console.log('No WebSocket clients connected, skipping broadcast');
      return;
    }

    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    });

    let broadcastCount = 0;

    for (let client of this.clients) {
      try {
        if (data.name && client[Symbol.for('name')] !== data.name)
          continue;

        if (client.readyState === client.OPEN) {
          client.send(message);
          broadcastCount++;
        } else {
          this.clients.delete(client);
        }
      } catch (error) {
        console.error('Error sending to WebSocket client:', error);
        this.clients.delete(client);
      }
    }

    console.log(
      `Broadcasted webhook to ${ broadcastCount } of ` +
      `${this.clients.size} clients`
    );
  }

  /**
   * Get the number of connected clients
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (let client of this.clients) {
      try {
        ws.close();
      } catch (error) {
        console.error('Error closing WebSocket client:', error);
      }
    }
    this.clients.clear();
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();
