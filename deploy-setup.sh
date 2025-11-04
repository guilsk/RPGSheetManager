#!/bin/bash

echo "🚀 RPG Sheet Manager - Deploy Setup"
echo "=================================="
echo ""

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

echo "📋 Verificando arquivos necessários..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.example..."
    cp .env.example .env
    echo "✏️  Por favor, edite o arquivo .env com suas configurações antes de continuar."
    echo "📝 Execute: code .env"
    exit 1
fi

echo "🔧 Construindo imagens Docker..."

# Build do backend
echo "🏗️  Building backend..."
docker build -t rpg-sheet-api ./server/RPGSheetManager/

# Build do frontend
echo "🏗️  Building frontend..."
docker build -t rpg-sheet-frontend ./client/

echo "✅ Build concluído!"
echo ""
echo "🚀 Para rodar localmente:"
echo "   docker-compose up -d"
echo ""
echo "📤 Para deploy no Render:"
echo "   1. Faça push do código para o GitHub"
echo "   2. Configure o Render conforme o guia"
echo "   3. Configure as variáveis de ambiente no Render"
