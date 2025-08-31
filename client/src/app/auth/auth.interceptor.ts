import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { mergeMap, catchError } from 'rxjs';
import { of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn
) => {
	const auth = inject(AuthService);

	// Verificar se a URL precisa de autenticação
	const needsAuth = req.url.includes('localhost:7111/api');
	
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
			}
			return next(req);
		}),
		catchError(error => {
			console.error('Erro no interceptor de autenticação:', error);
			return next(req);
		})
	);
};
