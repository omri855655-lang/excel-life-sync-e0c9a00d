#!/bin/bash

# Excel Life Sync - Mac App Update Script
# סקריפט לעדכון אוטומטי של האפליקציה

echo "🔄 מתחיל עדכון של Excel Life Sync..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ שגיאה: הרץ את הסקריפט מתיקיית הפרויקט הראשית"
    echo "   cd /path/to/excel-life-sync"
    exit 1
fi

# Pull latest changes from GitHub
echo "📥 מושך שינויים מ-GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ שגיאה בעדכון מ-GitHub"
    exit 1
fi
echo "✅ השינויים הורדו בהצלחה"
echo ""

# Install/update dependencies
echo "📦 מעדכן חבילות..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ שגיאה בהתקנת חבילות"
    exit 1
fi
echo "✅ החבילות עודכנו"
echo ""

# Build the web app
echo "🔨 בונה את האפליקציה..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ שגיאה בבניית האפליקציה"
    exit 1
fi
echo "✅ הבנייה הושלמה"
echo ""

# Build the Mac app
echo "🍎 בונה את אפליקציית Mac..."
npx electron-builder --mac
if [ $? -ne 0 ]; then
    echo "❌ שגיאה בבניית אפליקציית Mac"
    exit 1
fi
echo "✅ אפליקציית Mac נבנתה בהצלחה!"
echo ""

# Open the dist folder
echo "📂 פותח את תיקיית ההתקנה..."
open electron-dist

echo ""
echo "🎉 העדכון הושלם!"
echo "   התקן את קובץ ה-DMG מתיקיית electron-dist"
echo ""
