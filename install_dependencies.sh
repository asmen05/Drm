#!/bin/bash
# سكريبت لتثبيت المكتبات المطلوبة

echo "🔄 جاري تثبيت المكتبات المطلوبة..."

# محاولة تثبيت باستخدام pip
if command -v pip &> /dev/null; then
    echo "✅ تم العثور على pip"
    pip install websocket-client
elif command -v pip3 &> /dev/null; then
    echo "✅ تم العثور على pip3"
    pip3 install websocket-client
elif command -v python3 -m pip &> /dev/null; then
    echo "✅ استخدام python3 -m pip"
    python3 -m pip install websocket-client
else
    echo "❌ لم يتم العثور على pip"
    echo "يرجى تثبيت pip أولاً أو تثبيت المكتبة يدوياً:"
    echo "  sudo apt-get install python3-pip"
    echo "  أو"
    echo "  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py"
    echo "  python3 get-pip.py"
    exit 1
fi

echo "✅ تم التثبيت بنجاح!"
