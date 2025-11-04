#!/usr/bin/env python3
"""
WebSocket IPTV Stream Reader
قارئ بث IPTV عبر WebSocket
"""

import websocket
import sys
import time
import argparse
from datetime import datetime

class WebSocketStreamReader:
    def __init__(self, url, output_file=None, verbose=False):
        self.url = url
        self.output_file = output_file
        self.verbose = verbose
        self.bytes_received = 0
        self.file_handle = None
        
    def on_message(self, ws, message):
        """معالجة الرسائل المستقبلة"""
        self.bytes_received += len(message)
        
        if self.verbose:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] تم استقبال: {len(message)} بايت | الإجمالي: {self.bytes_received} بايت")
        
        # حفظ البيانات في ملف إذا تم تحديد اسم الملف
        if self.file_handle:
            self.file_handle.write(message)
            self.file_handle.flush()
    
    def on_error(self, ws, error):
        """معالجة الأخطاء"""
        print(f"❌ خطأ: {error}", file=sys.stderr)
    
    def on_close(self, ws, close_status_code, close_msg):
        """عند إغلاق الاتصال"""
        print(f"\n🔌 تم إغلاق الاتصال")
        print(f"📊 إجمالي البيانات المستقبلة: {self.bytes_received} بايت ({self.bytes_received / 1024 / 1024:.2f} ميجابايت)")
        
        if self.file_handle:
            self.file_handle.close()
            print(f"💾 تم حفظ البيانات في: {self.output_file}")
    
    def on_open(self, ws):
        """عند فتح الاتصال"""
        print(f"✅ تم الاتصال بنجاح بـ: {self.url}")
        if self.output_file:
            print(f"💾 سيتم حفظ البيانات في: {self.output_file}")
    
    def connect(self):
        """الاتصال بـ WebSocket"""
        # فتح ملف الإخراج إذا تم تحديده
        if self.output_file:
            self.file_handle = open(self.output_file, 'wb')
        
        # إعداد WebSocket
        ws = websocket.WebSocketApp(
            self.url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        
        print(f"🔄 جاري الاتصال بـ: {self.url}")
        
        try:
            # بدء الاتصال
            ws.run_forever()
        except KeyboardInterrupt:
            print("\n⚠️  تم إيقاف الاتصال بواسطة المستخدم")
            ws.close()
        except Exception as e:
            print(f"❌ خطأ غير متوقع: {e}", file=sys.stderr)
        finally:
            if self.file_handle:
                self.file_handle.close()

def main():
    parser = argparse.ArgumentParser(
        description='قارئ بث IPTV عبر WebSocket',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
أمثلة الاستخدام:
  # قراءة البيانات فقط
  python websocket_reader.py wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4
  
  # قراءة وحفظ البيانات في ملف
  python websocket_reader.py wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4 -o stream.ts
  
  # قراءة مع عرض معلومات مفصلة
  python websocket_reader.py wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4 -v
        """
    )
    
    parser.add_argument(
        'url',
        nargs='?',
        default='wss://103.237.103.54:60000/live?oid=2lanhaif80b44fbzbuxhpg495m7znkv4',
        help='رابط WebSocket (افتراضي: الرابط المحدد)'
    )
    
    parser.add_argument(
        '-o', '--output',
        dest='output_file',
        help='ملف الإخراج لحفظ البيانات المستقبلة'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='عرض معلومات مفصلة عن البيانات المستقبلة'
    )
    
    args = parser.parse_args()
    
    # إنشاء قارئ WebSocket
    reader = WebSocketStreamReader(
        url=args.url,
        output_file=args.output_file,
        verbose=args.verbose
    )
    
    # بدء الاتصال
    reader.connect()

if __name__ == "__main__":
    main()
