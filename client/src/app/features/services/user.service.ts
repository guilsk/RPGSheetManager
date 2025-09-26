import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../shared/models/rpg-sheet-manager.model';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = 'https://localhost:7111/api/user';

	constructor(private http: HttpClient) { }

	public post(userInfo: User): Observable<User> {
		return this.http.post<User>(this.apiUrl, userInfo);
	}

	public getUserByAuthId(authId: string): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/${authId}`);
	}

	public updateProfile(user: User): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/profile`, user);
	}
}
