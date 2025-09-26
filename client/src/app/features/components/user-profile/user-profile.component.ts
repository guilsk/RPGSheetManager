import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from '../../services/user.service';
import { CurrentUserService } from '../../services/current-user.service';
import { User } from '../../../shared/models/rpg-sheet-manager.model';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
	selector: 'app-user-profile',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './user-profile.component.html',
	styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
	profileForm: FormGroup;
	isLoading = false;
	isSubmitting = false;
	error: string | null = null;
	success: string | null = null;
	currentUser: User | null = null;

	constructor(
		private fb: FormBuilder,
		private auth: AuthService,
		private userService: UserService,
		private currentUserService: CurrentUserService
	) {
		this.profileForm = this.fb.group({
			displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
			email: [{ value: '', disabled: true }] // Email só mostra, não edita
		});
	}

	ngOnInit(): void {
		this.loadUserProfile();
	}

	private loadUserProfile(): void {
		this.isLoading = true;
		this.error = null;

		this.auth.user$.pipe(
			switchMap(authUser => {
				if (authUser?.sub) {
					return this.userService.getUserByAuthId(authUser.sub);
				}
				return of(null);
			}),
			catchError(error => {
				console.error('Erro ao carregar perfil:', error);
				this.error = 'Erro ao carregar perfil do usuário';
				return of(null);
			})
		).subscribe(user => {
			this.isLoading = false;
			if (user) {
				this.currentUser = user;
				this.profileForm.patchValue({
					displayName: user.displayName || '',
					email: user.email || ''
				});
			}
		});
	}

	onSubmit(): void {
		if (this.profileForm.valid && !this.isSubmitting && this.currentUser) {
			this.isSubmitting = true;
			this.error = null;
			this.success = null;

			const updatedUser: User = {
				...this.currentUser,
				displayName: this.profileForm.get('displayName')?.value
			};

			console.log('Sending user update:', updatedUser);
			console.log('AuthId:', updatedUser.authId);

			this.userService.updateProfile(updatedUser).subscribe({
				next: (user) => {
					this.isSubmitting = false;
					this.success = 'Perfil atualizado com sucesso!';
					this.currentUser = user;

					// Atualizar o usuário atual no serviço para refletir no layout
					this.currentUserService.updateCurrentUser(user);

					// Limpar mensagem de sucesso após 3 segundos
					setTimeout(() => {
						this.success = null;
					}, 3000);
				},
				error: (error) => {
					this.isSubmitting = false;
					console.error('Erro ao atualizar perfil:', error);
					this.error = 'Erro ao atualizar perfil. Tente novamente.';
				}
			});
		}
	}

	// Getters para facilitar validação no template
	get displayName() { return this.profileForm.get('displayName'); }
	get email() { return this.profileForm.get('email'); }

	isFieldInvalid(fieldName: string): boolean {
		const field = this.profileForm.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	getFieldError(fieldName: string): string {
		const field = this.profileForm.get(fieldName);
		if (field && field.errors && (field.dirty || field.touched)) {
			if (field.errors['required']) return `${this.getFieldLabel(fieldName)} é obrigatório`;
			if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${field.errors['minlength'].requiredLength} caracteres`;
			if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} deve ter no máximo ${field.errors['maxlength'].requiredLength} caracteres`;
		}
		return '';
	}

	private getFieldLabel(fieldName: string): string {
		const labels: { [key: string]: string } = {
			displayName: 'Nome de exibição',
			email: 'Email'
		};
		return labels[fieldName] || fieldName;
	}
}
