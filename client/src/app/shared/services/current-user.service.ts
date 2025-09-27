import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './user.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { User } from '../models/rpg-sheet-manager.model';

@Injectable({
	providedIn: 'root'
})
export class CurrentUserService {
	private currentUserSubject = new BehaviorSubject<User | null>(null);
	public currentUser$ = this.currentUserSubject.asObservable();

	constructor(
		private auth: AuthService,
		private userService: UserService
	) {
		// Não inicializar automaticamente, o AppComponent vai gerenciar isso
	}

	private initializeCurrentUser(): void {
		this.auth.user$.pipe(
			switchMap(authUser => {
				if (authUser?.sub) {
					return this.userService.getUserByAuthId(authUser.sub).pipe(
						catchError(() => of(null))
					);
				}
				return of(null);
			})
		).subscribe(user => {
			this.currentUserSubject.next(user);
		});
	}

	public refreshCurrentUser(): void {
		this.auth.user$.pipe(
			switchMap(authUser => {
				if (authUser?.sub) {
					return this.userService.getUserByAuthId(authUser.sub).pipe(
						catchError(() => of(null))
					);
				}
				return of(null);
			})
		).subscribe(user => {
			this.currentUserSubject.next(user);
		});
	}

	public updateCurrentUser(user: User): void {
		this.currentUserSubject.next(user);
	}

	public getCurrentUser(): User | null {
		return this.currentUserSubject.value;
	}

	public getCurrentDisplayName(): string {
		const user = this.getCurrentUser();
		if (user?.displayName) {
			return user.displayName;
		}
		return 'Carregando...';
	}
}
