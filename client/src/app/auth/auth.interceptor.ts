import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { mergeMap, catchError } from 'rxjs';
import { of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn
) => {
	const auth = inject(AuthService);

	// Verificar se a URL precisa de autenticação
	const needsAuth = req.url.includes(environment.apiUrl.replace('https://', '').replace('http://', ''));

	if (!needsAuth) {
		return next(req);
	}

	return auth.getAccessTokenSilently().pipe(
		mergeMap(token => {
			if (token) {
				const clonedReq = req.clone({
					headers: req.headers.set('Authorization', `Bearer ${token}`)
				});
				return next(clonedReq);
			} else {
				return throwError(() => new HttpErrorResponse({
					error: 'Token de autenticação não disponível',
					status: 401,
					statusText: 'Unauthorized'
				}));
			}
		}),
		catchError(authError => {
			// Se o erro já tem status HTTP (veio do servidor), apenas repassa
			if (authError.status) {
				return throwError(() => authError);
			}

			// Se é um erro interno de obtenção do token, retorna erro de auth
			return throwError(() => new HttpErrorResponse({
				error: 'Falha na autenticação - não foi possível obter token',
				status: 401,
				statusText: 'Authentication Failed'
			}));
		})
	);
};
