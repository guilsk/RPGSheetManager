# Build script para o Render
#!/bin/bash
set -o errexit

echo "🚀 Starting build process..."

# Build da aplicação Angular
echo "📦 Building Angular application..."
npm ci
npm run build

echo "✅ Build completed successfully!"
