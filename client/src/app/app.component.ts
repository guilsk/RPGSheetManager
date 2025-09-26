import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './features/services/user.service';
import { CurrentUserService } from './features/services/current-user.service';
import { LayoutComponent } from './features/pages/layout/layout.component';
import { User } from './shared/models/rpg-sheet-manager.model';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, LayoutComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
	constructor(
		public auth: AuthService,
		public userService: UserService,
		private currentUserService: CurrentUserService
	) { }

	public async ngOnInit(): Promise<void> {
		// Tratar erros de autenticação
		this.auth.error$.subscribe(error => {
			if (error) {
				console.error('Erro de autenticação Auth0:', error);
			}
		});

		// Processar usuário autenticado
		this.auth.user$.pipe(
			switchMap(profile => {
				if (profile?.sub) {
					// Primeiro, verificar se o usuário já existe
					return this.userService.getUserByAuthId(profile.sub).pipe(
						switchMap(existingUser => {
							if (existingUser) {
								// Usuário já existe, apenas atualizar email se necessário
								if (profile.email && existingUser.email !== profile.email) {
									const updatedUser: User = {
										...existingUser,
										email: profile.email
									};
									return this.userService.post(updatedUser);
								}
								// Usuário existe e email é o mesmo, não fazer nada
								return of(existingUser);
							} else {
								// Usuário não existe, criar novo
								const newUser: User = {
									authId: profile.sub,
									displayName: profile.name || profile.email || 'Usuário',
									email: profile.email,
									createdAt: new Date()
								};
								return this.userService.post(newUser);
							}
						}),
						catchError(() => {
							// Se deu 404, o usuário não existe, criar novo
							const newUser: User = {
								authId: profile.sub,
								displayName: profile.name || profile.email || 'Usuário',
								email: profile.email,
								createdAt: new Date()
							};
							return this.userService.post(newUser);
						})
					);
				}
				return of(null);
			}),
			catchError(error => {
				console.error('Erro ao processar usuário:', error);
				return of(null);
			})
		).subscribe(user => {
			// Notificar o CurrentUserService sempre que o usuário for processado
			if (user) {
				this.currentUserService.updateCurrentUser(user);
			}
		});
	}
}
