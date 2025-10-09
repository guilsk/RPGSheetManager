import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/rpg-sheet-manager.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = `${environment.apiUrl}/user`;
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

	public getAllUsers(): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/all`);
	}

	public searchUsers(searchTerm: string): Observable<User[]> {
		const params = { search: searchTerm };
		return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
	}
}
