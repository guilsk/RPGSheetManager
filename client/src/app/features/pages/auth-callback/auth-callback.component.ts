import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
	selector: 'app-auth-callback',
	standalone: true,
	template: `
		<div class="callback-container">
			<div class="loading-spinner"></div>
			<p>Processando autenticação...</p>
		</div>
	`,
	styles: [`
		.callback-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100vh;
			text-align: center;
		}
		
		.loading-spinner {
			width: 40px;
			height: 40px;
			border: 4px solid #f3f3f3;
			border-top: 4px solid #007bff;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin-bottom: 20px;
		}
		
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
	`]
})
export class AuthCallbackComponent implements OnInit {
	constructor(
		private auth: AuthService,
		private router: Router
	) {}

	ngOnInit() {
		// O Auth0 Angular SDK automaticamente processa o callback
		// Vamos aguardar a autenticação e redirecionar
		this.auth.isAuthenticated$.subscribe(isAuthenticated => {
			if (isAuthenticated) {
				// Redireciona para a página inicial após autenticação bem-sucedida
				this.router.navigate(['/characters']);
			}
		});

		this.auth.error$.subscribe(error => {
			if (error) {
				console.error('Erro de autenticação:', error);
				// Redireciona para login em caso de erro
				this.router.navigate(['/']);
			}
		});
	}
}
