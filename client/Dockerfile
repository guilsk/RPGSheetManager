# Multi-stage build para Angular
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json primeiro para otimizar cache
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build --prod

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=build /app/dist/client /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]