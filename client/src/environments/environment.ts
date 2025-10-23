// Este arquivo será usado em DESENVOLVIMENTO
// Durante o build de produção, este arquivo será substituído pelo environment.prod.ts

export const environment = {
  production: false,
  // URL da API - pode ser local ou Docker
  apiUrl: 'http://localhost:5555/api', // Docker API na porta 5555
  // Para desenvolvimento sem Docker, use: 'https://localhost:7111/api'
  
  auth0: {
    domain: 'dev-j4yhsqhd3jiqhal4.us.auth0.com',
    clientId: 'VYpgkGhW4JmH4980SiGBvWS891jqk55t',
    audience: 'https://rpg-sheetmanager/',
    redirectUri: 'http://localhost:4200/callback'
  }
};
