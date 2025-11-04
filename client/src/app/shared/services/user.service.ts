import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/rpg-sheet-manager.model';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = `${environment.apiUrl}/user`;
	private http = inject(HttpClient);

	// Cache para usuários para evitar múltiplas requisições
	private userCache = new Map<string, { user: User, timestamp: number }>();
	private cacheExpiry = 10 * 60 * 1000; // 10 minutos

	constructor() { }

	public post(userInfo: User): Observable<User> {
		return this.http.post<User>(this.apiUrl, userInfo);
	}

	public getUserByAuthId(authId: string): Observable<User> {
		const now = Date.now();
		const cached = this.userCache.get(authId);

		// Retornar cache se válido
		if (cached && (now - cached.timestamp) < this.cacheExpiry) {
			return of(cached.user);
		}

		// Buscar novo usuário
		return this.http.get<User>(`${this.apiUrl}/${authId}`).pipe(
			map(user => {
				this.userCache.set(authId, { user, timestamp: now });
				return user;
			}),
			catchError(error => {
				console.error('Erro ao buscar usuário:', error);
				// Retornar cache antigo se houver erro
				if (cached) {
					return of(cached.user);
				}
				throw error;
			}),
			shareReplay(1)
		);
	}

	public updateProfile(user: User): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/profile`, user);
	}

	public getAllUsers(): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/all`);
	}

	public searchUsers(searchTerm: string): Observable<User[]> {
		const params = { search: searchTerm };
		return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
	}

	/**
	 * Limpa o cache de usuários
	 */
	public clearUserCache(): void {
		this.userCache.clear();
	}

	/**
	 * Remove um usuário específico do cache
	 */
	public clearUserFromCache(authId: string): void {
		this.userCache.delete(authId);
	}
}
