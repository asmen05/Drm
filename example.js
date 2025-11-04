const WebSocketReader = require('./websocket-reader');

// Your WebSocket URL
const wsUrl = 'wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4';

// Create reader with custom options
const reader = new WebSocketReader(wsUrl, {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 3000,

    // Custom data handler
    onData: (data) => {
        console.log('=== Data Received ===');

        // Handle binary data (video/audio stream)
        if (Buffer.isBuffer(data)) {
            console.log(`Binary stream data: ${data.length} bytes`);

            // You can save to file, process, or forward the stream
            // Example: Save to file
            // const fs = require('fs');
            // fs.appendFileSync('stream.bin', data);

        } else {
            // Handle text/JSON data
            try {
                const jsonData = JSON.parse(data);
                console.log('JSON Data:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('Text Data:', data.toString());
            }
        }
    },

    // Custom error handler
    onError: (error) => {
        console.error('Connection Error:', error.message);
    },

    // Custom connect handler
    onConnect: () => {
        console.log('✓ Successfully connected to stream!');
        console.log('Listening for data...\n');
    },

    // Custom close handler
    onClose: (code, reason) => {
        console.log(`Connection closed: ${code} - ${reason || 'Unknown reason'}`);
    }
});

// Connect to the stream
reader.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    reader.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    reader.disconnect();
    process.exit(0);
});

// Keep the process running
console.log('WebSocket Reader started. Press Ctrl+C to stop.\n');
