# Multi-stage build para Angular
FROM node:18-alpine AS build

WORKDIR /app

# Como o context é a raiz, copiar apenas a pasta client
COPY client/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte do client
COPY client/ .

# Build da aplicação para produção
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar os arquivos buildados para a pasta que o nginx espera
# O Angular gera os arquivos em /app/dist/client (conforme angular.json)
COPY --from=build /app/dist/client /usr/share/nginx/html

# DEBUG: Verificar o que foi copiado
RUN echo "=== CONTEUDO DE /usr/share/nginx/html ===" && ls -la /usr/share/nginx/html && echo "=== FIM DEBUG ==="

# Copiar configuração customizada do nginx
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
