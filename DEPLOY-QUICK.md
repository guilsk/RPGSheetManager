# 🚀 Deploy Rápido - Passo a Passo

## ⚡ **Deploy em 5 minutos!**

### 🔥 **PRIMEIRO**: Configurar Auth0
📖 **Siga exatamente**: `AUTH0-CONFIG.md`

### 🔥 **SEGUNDO**: Commit e Push
```bash
git add .
git commit -m "feat: configure for render deployment"
git push origin develop
```

### 🔥 **TERCEIRO**: Render Backend (API)
1. **Render.com** → **New** → **Web Service**
2. **Connect GitHub** → Seu repositório
3. **Configurações**:
   - **Name**: `rpg-sm-api`
   - **Branch**: `develop`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./server/RPGSheetManager/Dockerfile`
   - **Docker Context**: `./server/RPGSheetManager`

4. **Environment Variables** (copiar exato):
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

5. **Deploy** → Aguardar build (5-10min)

### 🔥 **QUARTO**: Render Frontend
1. **New** → **Web Service**
2. **Connect GitHub** → Mesmo repositório
3. **Configurações**:
   - **Name**: `rpg-sheet-manager`
   - **Branch**: `develop`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./client/Dockerfile`
   - **Docker Context**: `./client`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   ```

5. **Deploy** → Aguardar build (5-10min)

## ✅ **Pronto!**

### 🎯 **Suas URLs**:
- **Frontend**: `https://rpg-sheet-manager.onrender.com`
- **API**: `https://rpg-sm-api.onrender.com`

### 🧪 **Testar**:
1. Abrir frontend
2. Fazer login
3. Testar funcionalidades

## 🚨 **Se der erro**:
1. **Auth0**: Revisar `AUTH0-CONFIG.md`
2. **Build**: Ver logs no Render Dashboard
3. **CORS**: Verificar environment variables

## 📞 **Suporte**:
- Render logs: Dashboard → Service → Logs
- Auth0 logs: Dashboard → Monitoring → Logs
- Browser: F12 → Console → Network

---
## 🔄 **Atualizações futuras**:
```bash
git add .
git commit -m "sua alteração"
git push origin develop
# Deploy automático! 🎉
```
