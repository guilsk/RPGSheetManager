import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './auth/user.service';
import { firstValueFrom } from 'rxjs';
import { User } from './models/user.model';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	constructor(
		public auth: AuthService,
		public userService: UserService
	) { }

	public async ngOnInit(): Promise<void> {
		const token = await firstValueFrom(this.auth.getAccessTokenSilently({
			authorizationParams: { audience: 'https://rpg-sheetmanager/' }
		}));

		this.auth.user$.subscribe(profile => {
			if (profile) {
				const user: User = {
					authId: profile.sub,
					displayName: profile.name
				};
				this.userService.post(user).subscribe();
			}
		});
	}
}
