# 🚀 Guia de Deploy - RPG Sheet Manager

## 🎯 **URLs do Projeto**
- **Frontend**: `https://rpg-sheet-manager.onrender.com`
- **API**: `https://rpg-sm-api.onrender.com`
- **Branch**: `develop`
- **Domínio futuro**: `rpgsheetmanager.com`

## 📋 Pré-requisitos

1. **Conta no Render.com** (gratuita)
2. **Repositório no GitHub** com código na branch `develop`
3. **Conta no Auth0** (já configurada)
4. **MongoDB Atlas** (gratuito) - sua connection string atual

## 🔧 Configuração do Auth0

### 1. **Adicionar URLs de Produção**

No seu dashboard do Auth0:

#### Applications → Sua App → Settings:
- **Allowed Callback URLs**:
  ```
  http://localhost:4200/callback,
  https://rpg-sheet-manager.onrender.com/callback,
  https://rpgsheetmanager.com/callback
  ```

- **Allowed Logout URLs**:
  ```
  http://localhost:4200,
  https://rpg-sheet-manager.onrender.com,
  https://rpgsheetmanager.com
  ```

- **Allowed Web Origins**:
  ```
  http://localhost:4200,
  https://rpg-sheet-manager.onrender.com,
  https://rpgsheetmanager.com
  ```

#### APIs → Sua API → Settings:
- **Identifier**: `https://rpg-sheetmanager/` (manter o mesmo)

### 2. **CORS Settings**
No dashboard do Auth0, vá em Applications → Sua App → Settings → Advanced Settings → Grant Types e certifique-se que estão marcados:
- ✅ Authorization Code
- ✅ Refresh Token

## 🐳 Deploy no Render

### 1. **Preparar o Repositório**

```bash
# Adicionar arquivos ao git
git add .
git commit -m "feat: add docker configuration for render deploy"
git push origin develop
```

### 2. **Configurar Backend (API)**

No Render.com:

1. **New → Web Service**
2. **Connect GitHub** → Selecione seu repositório
3. **Configurações**:
   - **Name**: `rpg-sm-api`
   - **Environment**: `Docker`
   - **Branch**: `develop`
   - **Dockerfile Path**: `./server/RPGSheetManager/Dockerfile`
   - **Docker Context**: `./server/RPGSheetManager`
   - **Plan**: Free
   - **Region**: Oregon

4. **Environment Variables**:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://+:10000
   MongoDb__ConnectionString=mongodb+srv://Guil:Shippuden77@cluster0.vll6gmm.mongodb.net/
   MongoDb__DatabaseName=RPGSheetManager
   Auth0__Domain=dev-j4yhsqhd3jiqhal4.us.auth0.com
   Auth0__ClientId=VYpgkGhW4JmH4980SiGBvWS891jqk55t
   Auth0__Audience=https://rpg-sheetmanager/
   AllowedCors__0=https://rpg-sheet-manager.onrender.com
   AllowedCors__1=https://rpgsheetmanager.com
   AllowedCors__2=http://localhost:4200
   ```

### 3. **Configurar Frontend**

1. **New → Web Service**
2. **Connect GitHub** → Mesmo repositório
3. **Configurações**:
   - **Name**: `rpg-sheet-manager`
   - **Environment**: `Docker`
   - **Branch**: `develop`
   - **Dockerfile Path**: `./client/Dockerfile`
   - **Docker Context**: `./client`
   - **Plan**: Free

### 4. **URLs já configuradas! ✅**

As URLs já estão configuradas nos arquivos:

#### `client/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://rpg-sm-api.onrender.com/api',

  auth0: {
    domain: 'dev-j4yhsqhd3jiqhal4.us.auth0.com',
    clientId: 'VYpgkGhW4JmH4980SiGBvWS891jqk55t',
    audience: 'https://rpg-sheetmanager/',
    redirectUri: 'https://rpg-sheet-manager.onrender.com/callback'
  }
};
```

## 🔄 Processo de Deploy

### 1. **Primeira vez**:
```bash
# 1. ✅ URLs já configuradas nos arquivos
# 2. Configure Auth0 seguindo o arquivo AUTH0-CONFIG.md
# 3. Commit e push
git add .
git commit -m "feat: configure for render deployment"
git push origin develop

# 4. Deploy automático será acionado no Render
```

### 2. **Atualizações futuras**:
```bash
git add .
git commit -m "sua mensagem"
git push origin develop
# Deploy automático! 🎉
```

## 🐛 Troubleshooting

### Problemas comuns:

1. **CORS Error**:
   - Verifique URLs no Auth0
   - Confirme variáveis de ambiente no backend

2. **Build Error no Frontend**:
   - Verifique se as URLs estão corretas no environment.prod.ts
   - Certifique-se que não há erros de TypeScript

3. **API não responde**:
   - Verifique variáveis de ambiente no Render
   - Confirme que MongoDB está acessível

4. **Auth0 não funciona**:
   - Verifique callback URLs no Auth0
   - Confirme client ID e domain

## 📊 Monitoramento

- **Render Dashboard**: Para logs e status dos serviços
- **Auth0 Dashboard**: Para monitorar autenticações
- **MongoDB Atlas**: Para monitorar database (se usando Atlas)

## 🔐 Segurança

### Variáveis de Ambiente Sensíveis:
- ✅ MongoDB connection string
- ✅ Auth0 client secret (se usar)
- ✅ Qualquer API key externa

### Não commitar:
- ❌ `.env` files com dados reais
- ❌ Certificates ou keys privadas
- ❌ Senhas em texto claro

## 📈 Otimizações Futuras

1. **CDN**: Usar Cloudflare para cache
2. **Database**: Otimizar queries MongoDB
3. **Images**: Comprimir assets do frontend
4. **Monitoring**: Adicionar Application Insights
5. **Custom Domain**: Configurar domínio próprio
