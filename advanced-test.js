const WebSocketReader = require('./websocket-reader');

const wsUrl = 'wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4';

console.log('═══════════════════════════════════════════════════════════════');
console.log('        اختبار متقدم لرابط WebSocket مع محاولات متعددة');
console.log('═══════════════════════════════════════════════════════════════\n');

let dataReceived = false;
let testPhase = 1;

const reader = new WebSocketReader(wsUrl, {
    autoReconnect: false,
    
    onConnect: () => {
        console.log('✅ الاتصال ناجح!\n');
        
        // المرحلة 1: الانتظار لاستقبال البيانات تلقائياً
        console.log('📡 المرحلة 1: الانتظار لاستقبال البيانات التلقائية...');
        
        setTimeout(() => {
            if (!dataReceived) {
                console.log('⏱️  لم يتم استقبال بيانات تلقائية\n');
                
                // المرحلة 2: محاولة إرسال طلبات مختلفة
                console.log('📡 المرحلة 2: إرسال طلبات تفعيل مختلفة...\n');
                testPhase = 2;
                sendActivationRequests();
            }
        }, 5000);
    },
    
    onData: (data) => {
        dataReceived = true;
        
        console.log('\n🎉 تم استقبال بيانات!');
        console.log('─────────────────────────────────────────────────────────────');
        
        if (Buffer.isBuffer(data)) {
            console.log(`📦 نوع البيانات: ثنائية (Binary)`);
            console.log(`📏 الحجم: ${data.length} بايت`);
            console.log(`🔢 البايتات الأولى (Hex): ${data.slice(0, 32).toString('hex')}`);
            
            // تحليل نوع الملف
            const header = data.slice(0, 4).toString('hex');
            let fileType = 'غير معروف';
            
            if (header.startsWith('47')) {
                fileType = 'MPEG Transport Stream (.ts)';
            } else if (header.startsWith('000001')) {
                fileType = 'MPEG Video';
            } else if (header.startsWith('fff1') || header.startsWith('fff9')) {
                fileType = 'AAC Audio';
            } else if (header.startsWith('1a45dfa3')) {
                fileType = 'WebM/Matroska';
            } else if (header.startsWith('66747970')) {
                fileType = 'MP4';
            }
            
            console.log(`🎬 نوع الملف المحتمل: ${fileType}`);
            
        } else {
            console.log(`📝 نوع البيانات: نصية`);
            
            try {
                const jsonData = JSON.parse(data);
                console.log(`📋 JSON Data:`);
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log(`📄 النص: ${data.toString()}`);
            }
        }
        
        console.log('─────────────────────────────────────────────────────────────\n');
    },
    
    onError: (error) => {
        console.error(`❌ خطأ: ${error.message}`);
    },
    
    onClose: (code, reason) => {
        console.log(`\n🔌 تم إغلاق الاتصال`);
        console.log(`   الكود: ${code}`);
        console.log(`   السبب: ${reason || 'غير محدد'}`);
        
        if (!dataReceived) {
            console.log('\n📊 النتيجة النهائية:');
            console.log('─────────────────────────────────────────────────────────────');
            console.log('⚠️  لم يتم استقبال أي بيانات من الخادم');
            console.log('\n🔍 التحليل:');
            console.log('   1. الخادم يقبل الاتصالات (الاتصال نجح)');
            console.log('   2. لكن لا يرسل بيانات (البث غير نشط أو يتطلب مصادقة)');
            console.log('\n💡 الاحتمالات:');
            console.log('   • البث متوقف حالياً');
            console.log('   • يتطلب token أو مفتاح API إضافي');
            console.log('   • الرابط منتهي الصلاحية');
            console.log('   • يتطلب headers معينة في الاتصال');
            console.log('   • يحتاج إلى رسالة تفعيل خاصة');
            console.log('─────────────────────────────────────────────────────────────\n');
        }
    }
});

function sendActivationRequests() {
    const requests = [
        // طلب 1: طلب بدء بسيط
        { action: 'start' },
        
        // طلب 2: طلب تشغيل
        { action: 'play' },
        
        // طلب 3: طلب بث مباشر
        { action: 'subscribe', type: 'live' },
        
        // طلب 4: طلب القناة
        { action: 'join', channel: 'live' },
        
        // طلب 5: طلب البيانات
        { action: 'getData', oid: '2lanhaif80b44fbzbuxhpg495m7znkv4' },
        
        // طلب 6: ping
        { type: 'ping' },
        
        // طلب 7: hello
        { type: 'hello', version: '1.0' }
    ];
    
    requests.forEach((request, index) => {
        setTimeout(() => {
            console.log(`   ${index + 1}. إرسال: ${JSON.stringify(request)}`);
            reader.send(JSON.stringify(request));
            
            // بعد آخر طلب، انتظر ثم أغلق
            if (index === requests.length - 1) {
                setTimeout(() => {
                    if (!dataReceived) {
                        console.log('\n⏱️  لم يتم استقبال رد على أي من الطلبات');
                        console.log('🔄 إغلاق الاتصال...\n');
                        reader.disconnect();
                    }
                }, 5000);
            }
        }, index * 1000);
    });
}

// بدء الاختبار
console.log('🔄 بدء الاختبار المتقدم...\n');
reader.connect();

// إيقاف تلقائي بعد 20 ثانية
setTimeout(() => {
    if (reader.isConnected()) {
        console.log('\n⏰ انتهى وقت الاختبار');
        reader.disconnect();
        process.exit(0);
    }
}, 20000);

// معالجة الإيقاف اليدوي
process.on('SIGINT', () => {
    console.log('\n\n⏹️  تم إيقاف الاختبار');
    reader.disconnect();
    process.exit(0);
});
