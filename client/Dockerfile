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

# Remover arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos buildados do Angular (está em /app/dist/client/browser/)
COPY --from=build /app/dist/client/browser /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
