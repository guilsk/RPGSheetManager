import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
	const auth = inject(AuthService);
	const router = inject(Router);

	return auth.isAuthenticated$.pipe(
		take(1),
		map(isAuthenticated => {
			if (isAuthenticated) {
				return true;
			} else {
				auth.loginWithRedirect({
					appState: { target: state.url }
				});
				return false;
			}
		})
	);
};
