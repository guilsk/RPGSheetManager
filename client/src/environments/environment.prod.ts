// Este arquivo será usado em PRODUÇÃO
// Quando você rodar 'ng build --prod', este arquivo substituirá o environment.ts

export const environment = {
  production: true,
  // URL da API em produção (Render ou outro provedor)
  apiUrl: 'https://rpg-sheet-api.onrender.com/api',
  
  auth0: {
    domain: 'dev-j4yhsqhd3jiqhal4.us.auth0.com',
    clientId: 'VYpgkGhW4JmH4980SiGBvWS891jqk55t',
    audience: 'https://rpg-sheetmanager/',
    // URL de callback em produção
    redirectUri: 'https://rpg-sheet-frontend.onrender.com/callback'
  }
};
