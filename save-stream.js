const fs = require('fs');
const WebSocketReader = require('./websocket-reader');

// Your WebSocket URL
const wsUrl = 'wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4';

// Output file
const outputFile = 'stream-output.bin';

// Remove old file if exists
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
    console.log(`Removed old file: ${outputFile}`);
}

let bytesReceived = 0;
let startTime = Date.now();

// Create reader with file saving
const reader = new WebSocketReader(wsUrl, {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 3000,

    onData: (data) => {
        if (Buffer.isBuffer(data)) {
            // Save binary data to file
            fs.appendFileSync(outputFile, data);
            bytesReceived += data.length;

            // Calculate statistics
            const elapsed = (Date.now() - startTime) / 1000;
            const mbReceived = (bytesReceived / (1024 * 1024)).toFixed(2);
            const speed = (bytesReceived / 1024 / elapsed).toFixed(2);

            // Update console
            process.stdout.write(`\r📊 Received: ${mbReceived} MB | Speed: ${speed} KB/s | Time: ${elapsed.toFixed(0)}s`);
        } else {
            // Handle text/JSON messages
            console.log('\n📨 Message:', data.toString());
        }
    },

    onConnect: () => {
        console.log('✓ Connected to stream');
        console.log(`💾 Saving to: ${outputFile}`);
        console.log('Recording started...\n');
        startTime = Date.now();
    },

    onError: (error) => {
        console.error('\n❌ Error:', error.message);
    },

    onClose: (code, reason) => {
        console.log(`\n\n🔌 Connection closed: ${code}`);
        console.log(`📁 Total saved: ${(bytesReceived / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`💾 File: ${outputFile}`);
    }
});

// Connect
reader.connect();

// Handle shutdown
let isShuttingDown = false;

const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('\n\n⏹️  Stopping...');
    reader.disconnect();

    console.log(`\n✓ Stream saved to: ${outputFile}`);
    console.log(`📊 Total size: ${(bytesReceived / (1024 * 1024)).toFixed(2)} MB`);

    setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('🎥 WebSocket Stream Recorder');
console.log('Press Ctrl+C to stop recording\n');
