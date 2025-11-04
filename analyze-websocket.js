const WebSocketReader = require('./websocket-reader');
const fs = require('fs');

// الرابط المطلوب تحليله
const wsUrl = 'wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4';

console.log('═══════════════════════════════════════════════════════════════');
console.log('           تحليل تفصيلي لرابط WebSocket');
console.log('═══════════════════════════════════════════════════════════════\n');

// تحليل الرابط
console.log('📋 معلومات الرابط:');
console.log('─────────────────────────────────────────────────────────────');
const url = new URL(wsUrl);
console.log(`البروتوكول: ${url.protocol} (اتصال مشفر آمن)`);
console.log(`العنوان (IP): ${url.hostname}`);
console.log(`المنفذ (Port): ${url.port}`);
console.log(`المسار (Path): ${url.pathname}`);
console.log(`معامل الاستعلام (Query): ${url.search}`);
console.log(`معرف الكائن (OID): ${url.searchParams.get('oid')}`);
console.log('');

// إحصائيات البيانات
let dataCount = 0;
let totalBytes = 0;
let binaryChunks = 0;
let textChunks = 0;
let jsonMessages = 0;
let firstDataReceived = false;
let connectionStartTime = null;
let dataTypes = new Set();

// إنشاء ملف لحفظ التحليل
const analysisFile = 'websocket-analysis.txt';
const sampleDataFile = 'sample-data.bin';

function writeToAnalysis(text) {
    fs.appendFileSync(analysisFile, text + '\n');
    console.log(text);
}

// مسح الملفات السابقة
if (fs.existsSync(analysisFile)) fs.unlinkSync(analysisFile);
if (fs.existsSync(sampleDataFile)) fs.unlinkSync(sampleDataFile);

writeToAnalysis('═══════════════════════════════════════════════════════════════');
writeToAnalysis('           تحليل محتوى WebSocket Stream');
writeToAnalysis('═══════════════════════════════════════════════════════════════\n');
writeToAnalysis(`الرابط: ${wsUrl}`);
writeToAnalysis(`وقت البدء: ${new Date().toLocaleString('ar-EG')}\n`);

// إنشاء قارئ WebSocket
const reader = new WebSocketReader(wsUrl, {
    autoReconnect: false,
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,

    onConnect: () => {
        connectionStartTime = Date.now();
        writeToAnalysis('✅ تم الاتصال بنجاح!');
        writeToAnalysis('⏳ جاري استقبال البيانات...\n');
        writeToAnalysis('─────────────────────────────────────────────────────────────');
    },

    onData: (data) => {
        dataCount++;
        
        if (!firstDataReceived) {
            firstDataReceived = true;
            const latency = Date.now() - connectionStartTime;
            writeToAnalysis(`\n⚡ أول بيانات استُقبلت بعد: ${latency}ms`);
            writeToAnalysis('─────────────────────────────────────────────────────────────\n');
        }

        // تحليل نوع البيانات
        if (Buffer.isBuffer(data)) {
            binaryChunks++;
            totalBytes += data.length;
            dataTypes.add('Binary');

            writeToAnalysis(`\n📦 حزمة بيانات ثنائية #${dataCount}:`);
            writeToAnalysis(`   الحجم: ${data.length} بايت (${(data.length / 1024).toFixed(2)} KB)`);
            
            // تحليل نوع الملف من البايتات الأولى
            const header = data.slice(0, 16);
            const headerHex = header.toString('hex');
            writeToAnalysis(`   البايتات الأولى (Hex): ${headerHex}`);
            
            // التعرف على نوع البيانات
            let dataType = 'غير معروف';
            if (headerHex.startsWith('000000')) {
                dataType = 'محتمل: MPEG-TS أو فيديو';
                dataTypes.add('Video Stream');
            } else if (headerHex.startsWith('fff1') || headerHex.startsWith('fff9')) {
                dataType = 'محتمل: AAC Audio';
                dataTypes.add('Audio Stream');
            } else if (headerHex.startsWith('1a45dfa3')) {
                dataType = 'محتمل: WebM/Matroska';
                dataTypes.add('WebM Video');
            } else if (headerHex.startsWith('47')) {
                dataType = 'محتمل: MPEG Transport Stream';
                dataTypes.add('MPEG-TS');
            }
            writeToAnalysis(`   نوع البيانات: ${dataType}`);

            // حفظ عينة من البيانات
            if (binaryChunks <= 3) {
                fs.appendFileSync(sampleDataFile, data);
                writeToAnalysis(`   ✓ تم حفظ عينة في: ${sampleDataFile}`);
            }

        } else {
            textChunks++;
            dataTypes.add('Text/JSON');
            
            writeToAnalysis(`\n📝 رسالة نصية #${dataCount}:`);
            
            // محاولة تحليل JSON
            try {
                const jsonData = JSON.parse(data);
                jsonMessages++;
                dataTypes.add('JSON');
                writeToAnalysis(`   نوع: JSON`);
                writeToAnalysis(`   المحتوى:\n${JSON.stringify(jsonData, null, 4)}`);
                
                // تحليل محتوى JSON
                if (jsonData.type) writeToAnalysis(`   نوع الرسالة: ${jsonData.type}`);
                if (jsonData.status) writeToAnalysis(`   الحالة: ${jsonData.status}`);
                if (jsonData.message) writeToAnalysis(`   الرسالة: ${jsonData.message}`);
                
            } catch (e) {
                writeToAnalysis(`   نوع: نص عادي`);
                writeToAnalysis(`   المحتوى: ${data.toString()}`);
            }
        }

        // إيقاف التحليل بعد 30 ثانية أو 100 حزمة
        if (dataCount >= 100 || (Date.now() - connectionStartTime) > 30000) {
            setTimeout(() => {
                printSummary();
                reader.disconnect();
                process.exit(0);
            }, 1000);
        }
    },

    onError: (error) => {
        writeToAnalysis(`\n❌ خطأ في الاتصال: ${error.message}`);
        if (error.code) writeToAnalysis(`   كود الخطأ: ${error.code}`);
    },

    onClose: (code, reason) => {
        writeToAnalysis(`\n🔌 تم إغلاق الاتصال`);
        writeToAnalysis(`   الكود: ${code}`);
        writeToAnalysis(`   السبب: ${reason || 'غير محدد'}`);
        
        if (!firstDataReceived) {
            writeToAnalysis('\n⚠️  لم يتم استقبال أي بيانات!');
            writeToAnalysis('   الأسباب المحتملة:');
            writeToAnalysis('   - الخادم غير متاح حالياً');
            writeToAnalysis('   - الرابط غير صحيح أو منتهي الصلاحية');
            writeToAnalysis('   - يتطلب مصادقة إضافية');
            writeToAnalysis('   - البث غير نشط حالياً');
        }
    }
});

function printSummary() {
    const duration = ((Date.now() - connectionStartTime) / 1000).toFixed(2);
    
    writeToAnalysis('\n\n═══════════════════════════════════════════════════════════════');
    writeToAnalysis('                    ملخص التحليل');
    writeToAnalysis('═══════════════════════════════════════════════════════════════\n');
    
    writeToAnalysis(`⏱️  مدة الاتصال: ${duration} ثانية`);
    writeToAnalysis(`📊 إجمالي الحزم المستقبلة: ${dataCount}`);
    writeToAnalysis(`💾 إجمالي البيانات: ${totalBytes} بايت (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
    writeToAnalysis(`📦 حزم ثنائية: ${binaryChunks}`);
    writeToAnalysis(`📝 رسائل نصية: ${textChunks}`);
    writeToAnalysis(`🔤 رسائل JSON: ${jsonMessages}`);
    
    if (totalBytes > 0) {
        const avgChunkSize = (totalBytes / binaryChunks).toFixed(2);
        const bitrate = ((totalBytes * 8) / duration / 1000).toFixed(2);
        writeToAnalysis(`📏 متوسط حجم الحزمة: ${avgChunkSize} بايت`);
        writeToAnalysis(`📡 معدل البث التقريبي: ${bitrate} Kbps`);
    }
    
    writeToAnalysis(`\n🏷️  أنواع البيانات المكتشفة:`);
    dataTypes.forEach(type => {
        writeToAnalysis(`   - ${type}`);
    });
    
    writeToAnalysis('\n📋 الاستنتاجات:');
    if (binaryChunks > 0) {
        writeToAnalysis('   ✓ هذا رابط بث مباشر (Live Stream)');
        writeToAnalysis('   ✓ يحتوي على بيانات فيديو/صوت ثنائية');
        writeToAnalysis('   ✓ يمكن استخدامه لبث IPTV أو محتوى مباشر');
    }
    if (jsonMessages > 0) {
        writeToAnalysis('   ✓ يستخدم رسائل JSON للتحكم/البيانات الوصفية');
    }
    
    writeToAnalysis('\n💡 الاستخدامات الممكنة:');
    writeToAnalysis('   - مشاهدة البث المباشر');
    writeToAnalysis('   - تسجيل البث إلى ملف');
    writeToAnalysis('   - إعادة بث المحتوى (Re-streaming)');
    writeToAnalysis('   - تحليل جودة البث');
    
    writeToAnalysis('\n📁 الملفات المُنشأة:');
    writeToAnalysis(`   - ${analysisFile} (تقرير التحليل الكامل)`);
    if (fs.existsSync(sampleDataFile)) {
        const sampleSize = fs.statSync(sampleDataFile).size;
        writeToAnalysis(`   - ${sampleDataFile} (عينة بيانات: ${sampleSize} بايت)`);
    }
    
    writeToAnalysis('\n═══════════════════════════════════════════════════════════════');
    writeToAnalysis(`وقت الانتهاء: ${new Date().toLocaleString('ar-EG')}`);
    writeToAnalysis('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`\n✅ تم حفظ التحليل الكامل في: ${analysisFile}`);
}

// بدء الاتصال
console.log('🔄 جاري الاتصال بالخادم...\n');
reader.connect();

// إيقاف تلقائي بعد 35 ثانية
setTimeout(() => {
    if (reader.isConnected()) {
        console.log('\n⏰ انتهى وقت التحليل');
        printSummary();
        reader.disconnect();
        process.exit(0);
    }
}, 35000);

// معالجة الإيقاف اليدوي
process.on('SIGINT', () => {
    console.log('\n\n⏹️  تم إيقاف التحليل يدوياً');
    if (firstDataReceived) {
        printSummary();
    }
    reader.disconnect();
    process.exit(0);
});
