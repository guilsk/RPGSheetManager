import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://localhost:7111/api/user';

    constructor(private http: HttpClient) {}

    public post(userInfo: User): any {
        return this.http.post<User>(this.apiUrl, userInfo);
    }
}
