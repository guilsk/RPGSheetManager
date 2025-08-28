import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser } from '../../shared/models/rpg-sheet-manager.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://localhost:7111/api/user';

    constructor(private http: HttpClient) {}

    public post(userInfo: IUser): any {
        return this.http.post<IUser>(this.apiUrl, userInfo);
    }
}
