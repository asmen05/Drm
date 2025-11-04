# WebSocket Link Reader

أداة لقراءة والاتصال بروابط WebSocket للبث المباشر (IPTV).

## المميزات

- الاتصال بروابط WebSocket (ws:// و wss://)
- إعادة الاتصال التلقائي عند انقطاع الاتصال
- معالجة البيانات النصية والثنائية
- دعم البث المباشر (Live Streaming)
- سهل الاستخدام والتخصيص

## التثبيت

```bash
npm install
```

## الاستخدام

### الطريقة الأولى: استخدام المثال الجاهز

```bash
npm start
```

### الطريقة الثانية: استخدام مخصص

```javascript
const WebSocketReader = require('./websocket-reader');

// رابط WebSocket الخاص بك
const wsUrl = 'wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4';

// إنشاء قارئ جديد
const reader = new WebSocketReader(wsUrl, {
    onData: (data) => {
        console.log('تم استقبال البيانات:', data);
    },
    onConnect: () => {
        console.log('تم الاتصال بنجاح!');
    },
    onError: (error) => {
        console.error('خطأ:', error.message);
    }
});

// بدء الاتصال
reader.connect();
```

## الخيارات المتاحة

- `autoReconnect` (boolean): إعادة الاتصال التلقائي (افتراضي: true)
- `maxReconnectAttempts` (number): عدد محاولات إعادة الاتصال (افتراضي: 5)
- `reconnectDelay` (number): الوقت بين المحاولات بالميلي ثانية (افتراضي: 3000)
- `onData` (function): دالة معالجة البيانات المستقبلة
- `onError` (function): دالة معالجة الأخطاء
- `onConnect` (function): دالة تنفذ عند الاتصال
- `onClose` (function): دالة تنفذ عند إغلاق الاتصال

## الدوال المتاحة

- `connect()`: الاتصال بالخادم
- `disconnect()`: قطع الاتصال
- `send(data)`: إرسال بيانات إلى الخادم
- `isConnected()`: التحقق من حالة الاتصال

## أمثلة

### حفظ البث إلى ملف

```javascript
const fs = require('fs');
const WebSocketReader = require('./websocket-reader');

const reader = new WebSocketReader(wsUrl, {
    onData: (data) => {
        if (Buffer.isBuffer(data)) {
            fs.appendFileSync('stream.bin', data);
        }
    }
});

reader.connect();
```

### إرسال البيانات

```javascript
reader.send(JSON.stringify({
    action: 'subscribe',
    channel: 'live'
}));
```

## الملفات

- `websocket-reader.js` - الكلاس الرئيسي للقارئ
- `example.js` - مثال للاستخدام
- `package.json` - معلومات المشروع والاعتماديات

## ملاحظات

- يدعم الاتصالات المشفرة (wss://)
- يتعامل مع الشهادات الذاتية التوقيع
- يدعم معالجة البيانات الثنائية (Binary) والنصية (Text)

