import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(withInterceptors([authInterceptor])),
		provideAuth0({
			domain: 'dev-j4yhsqhd3jiqhal4.us.auth0.com',
			clientId: 'VYpgkGhW4JmH4980SiGBvWS891jqk55t',
			authorizationParams: {
				redirect_uri: `${window.location.origin}/callback`,
				audience: 'https://rpg-sheetmanager/'
			},
			useRefreshTokens: true,
			cacheLocation: 'localstorage',
			httpInterceptor: {
				allowedList: [
					{
						uri: 'https://localhost:7111/api/*',
						tokenOptions: {
							authorizationParams: { audience: 'https://rpg-sheetmanager/' }
						}
					}
				]
			}
		})
	]
};
