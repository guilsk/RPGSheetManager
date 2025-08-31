import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './features/services/user.service';
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
		public userService: UserService
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
				if (profile) {
					const user: User = {
						authId: profile.sub,
						displayName: profile.name,
						createdAt: profile.updated_at ? new Date(profile.updated_at) : new Date()
					};
					return this.userService.post(user);
				}
				return of(null);
			}),
			catchError(error => {
				console.error('Erro ao processar usuário:', error);
				return of(null);
			})
		).subscribe();
	}
}
