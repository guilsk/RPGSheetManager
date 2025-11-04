# 🔐 Configuração Auth0 - RPG Sheet Manager

## 📋 URLs do Projeto

- **Frontend**: `https://rpg-sheet-manager.onrender.com`
- **API**: `https://rpg-sm-api.onrender.com`
- **Domínio futuro**: `https://rpgsheetmanager.com` (quando configurar)

## 🔧 Configurações no Dashboard Auth0

### 1. **Applications → Sua Aplicação → Settings**

#### ✅ **Application URIs**

**Allowed Callback URLs** (separar por vírgula):
```
http://localhost:4200/callback,
https://rpg-sheet-manager.onrender.com/callback,
https://rpgsheetmanager.com/callback
```

**Allowed Logout URLs**:
```
http://localhost:4200,
https://rpg-sheet-manager.onrender.com,
https://rpgsheetmanager.com
```

**Allowed Web Origins**:
```
http://localhost:4200,
https://rpg-sheet-manager.onrender.com,
https://rpgsheetmanager.com
```

**Allowed Origins (CORS)**:
```
http://localhost:4200,
https://rpg-sheet-manager.onrender.com,
https://rpgsheetmanager.com
```

#### ✅ **Application Properties**
- **Application Type**: `Single Page Application`
- **Token Endpoint Authentication Method**: `None`

#### ✅ **Advanced Settings**
Vá em **Advanced Settings → Grant Types** e marque:
- ✅ `Authorization Code`
- ✅ `Refresh Token`

### 2. **APIs → Sua API → Settings**

#### ✅ **Configurações da API**
- **Name**: `RPG Sheet Manager API`
- **Identifier**: `https://rpg-sheetmanager/` ⚠️ **NÃO MUDE ISSO**
- **Signing Algorithm**: `RS256`

#### ✅ **CORS Settings**
Em **APIs → Sua API → Settings → CORS**:
```
http://localhost:4200,
https://rpg-sheet-manager.onrender.com,
https://rpgsheetmanager.com
```

### 3. **Verificar Informações Importantes**

#### 📝 **Dados que você já tem (não mude):**
- **Domain**: `dev-j4yhsqhd3jiqhal4.us.auth0.com`
- **Client ID**: `VYpgkGhW4JmH4980SiGBvWS891jqk55t`
- **Audience**: `https://rpg-sheetmanager/`

## 🚨 **IMPORTANTE - Ordem de Configuração**

### 1. **PRIMEIRO**: Configure o Auth0 com as URLs
### 2. **DEPOIS**: Faça o deploy no Render

⚠️ **Se fizer na ordem errada, pode dar erro de CORS/redirect**

## 🧪 **Testar Configurações**

### ✅ **Desenvolvimento** (deve funcionar):
- `http://localhost:4200` → Auth0 → callback

### ✅ **Produção** (após deploy):
- `https://rpg-sheet-manager.onrender.com` → Auth0 → callback

## 🔍 **Troubleshooting Auth0**

### ❌ **Erro: "callback URL mismatch"**
**Solução**: Verificar se a URL de callback está exatamente igual no Auth0

### ❌ **Erro: "CORS blocked"**
**Solução**:
1. Verificar Allowed Origins no Auth0
2. Verificar AllowedCors no backend (appsettings.json)

### ❌ **Erro: "audience invalid"**
**Solução**: Confirmar que o audience está igual em:
- Auth0 API settings
- Frontend (environment.ts)
- Backend (appsettings.json)

### ❌ **Erro: "unauthorized"**
**Solução**: Verificar se:
1. Token está sendo enviado corretamente
2. API está validando o token
3. Scopes estão corretos

## 📞 **Suporte**

Se algo não funcionar:
1. Verifique logs no Render Dashboard
2. Verifique logs no Auth0 Dashboard → Monitoring → Logs
3. Use DevTools do navegador para ver erros de CORS/Auth

## 🎯 **Checklist Final**

- [ ] URLs configuradas no Auth0
- [ ] Grant Types marcados
- [ ] CORS configurado na API e Auth0
- [ ] Deploy feito no Render
- [ ] Teste de login funcionando
- [ ] Teste de logout funcionando
- [ ] API protegida funcionando
