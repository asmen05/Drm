const WebSocket = require('ws');

/**
 * WebSocket Link Reader
 * Connects to and reads data from WebSocket streams
 */
class WebSocketReader {
    constructor(url, options = {}) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.reconnectDelay = options.reconnectDelay || 3000;
        this.autoReconnect = options.autoReconnect !== false;
        this.onDataCallback = options.onData || this.defaultDataHandler;
        this.onErrorCallback = options.onError || this.defaultErrorHandler;
        this.onConnectCallback = options.onConnect || this.defaultConnectHandler;
        this.onCloseCallback = options.onClose || this.defaultCloseHandler;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            console.log(`[WebSocketReader] Connecting to: ${this.url}`);

            // Create WebSocket connection with options
            this.ws = new WebSocket(this.url, {
                rejectUnauthorized: false, // For self-signed certificates
                handshakeTimeout: 10000
            });

            // Connection opened
            this.ws.on('open', () => {
                this.reconnectAttempts = 0;
                this.onConnectCallback();
            });

            // Listen for messages
            this.ws.on('message', (data) => {
                this.onDataCallback(data);
            });

            // Handle errors
            this.ws.on('error', (error) => {
                this.onErrorCallback(error);
            });

            // Connection closed
            this.ws.on('close', (code, reason) => {
                this.onCloseCallback(code, reason);

                // Auto reconnect logic
                if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[WebSocketReader] Reconnecting in ${this.reconnectDelay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectDelay);
                }
            });

        } catch (error) {
            console.error('[WebSocketReader] Connection error:', error);
            this.onErrorCallback(error);
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.autoReconnect = false;
        if (this.ws) {
            console.log('[WebSocketReader] Disconnecting...');
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Send data to WebSocket server
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            console.error('[WebSocketReader] Cannot send data: WebSocket is not connected');
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Default handlers
    defaultDataHandler(data) {
        console.log('[WebSocketReader] Received data:', data);

        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(data);
            console.log('[WebSocketReader] Parsed JSON:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            // Check if it's binary data
            if (Buffer.isBuffer(data)) {
                console.log('[WebSocketReader] Binary data received:', data.length, 'bytes');
                console.log('[WebSocketReader] First 100 bytes (hex):', data.slice(0, 100).toString('hex'));
            } else {
                console.log('[WebSocketReader] Text data:', data.toString());
            }
        }
    }

    defaultErrorHandler(error) {
        console.error('[WebSocketReader] Error:', error.message);
    }

    defaultConnectHandler() {
        console.log('[WebSocketReader] Connected successfully!');
    }

    defaultCloseHandler(code, reason) {
        console.log(`[WebSocketReader] Connection closed (Code: ${code}, Reason: ${reason || 'No reason provided'})`);
    }
}

module.exports = WebSocketReader;
