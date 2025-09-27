import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/rpg-sheet-manager.model';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = 'https://localhost:7111/api/user';
	private http = inject(HttpClient);

	constructor() { }

	public post(userInfo: User): Observable<User> {
		return this.http.post<User>(this.apiUrl, userInfo);
	}

	public getUserByAuthId(authId: string): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/${authId}`);
	}

	public updateProfile(user: User): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/profile`, user);
	}

	public getCurrentUserId(): string {
		// Evitando dependência circular, vamos implementar diferente
		// Vamos usar o AuthService diretamente no component onde precisar
		return 'user-mock-id'; // Temporário - usar CurrentUserService nos components
	}
}
