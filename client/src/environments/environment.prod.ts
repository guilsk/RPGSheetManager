// Este arquivo será usado em PRODUÇÃO
// Quando você rodar 'ng build --prod', este arquivo substituirá o environment.ts

export const environment = {
  production: true,
  apiUrl: 'https://sua-api-producao.com/api', // URL da sua API em produção
  auth0: {
    domain: 'dev-j4yhsqhd3jiqhal4.us.auth0.com', // Pode ser o mesmo ou diferente para produção
    clientId: 'VYpgkGhW4JmH4980SiGBvWS891jqk55t', // Pode ser diferente para produção
    audience: 'https://rpg-sheetmanager/',
    redirectUri: 'https://seu-site-producao.com/callback'
  }
};
