import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(withInterceptors([authInterceptor])),
		provideAuth0({
			domain: environment.auth0.domain,
			clientId: environment.auth0.clientId,
			authorizationParams: {
				redirect_uri: environment.auth0.redirectUri,
				audience: environment.auth0.audience
			},
			useRefreshTokens: true,
			cacheLocation: 'localstorage',
			skipRedirectCallback: false,
			httpInterceptor: {
				allowedList: [
					{
						uri: `${environment.apiUrl}/*`,
						tokenOptions: {
							authorizationParams: { audience: environment.auth0.audience }
						}
					}
				]
			}
		})
	]
};
