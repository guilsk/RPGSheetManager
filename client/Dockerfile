# Multi-stage build para Angular
FROM node:18-alpine AS build

WORKDIR /app

# Como o context é a raiz, copiar apenas a pasta client
COPY client/package*.json ./

# Limpar cache do npm e instalar dependências
RUN npm cache clean --force && npm install

# Copiar código fonte do client
COPY client/ .

# Build da aplicação para produção
RUN npm run build

# Debug: verificar o que foi gerado
RUN ls -la dist/

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar arquivos buildados (verificar se o build gerou arquivos)
COPY --from=build /app/dist/client /usr/share/nginx/html

# Copiar configuração customizada do nginx (caminho correto)
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
