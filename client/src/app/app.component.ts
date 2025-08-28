import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './features/services/user.service';
import { LayoutComponent } from './features/pages/layout/layout.component';
import { IUser } from './shared/models/rpg-sheet-manager.model';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, LayoutComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
	constructor(
		public auth: AuthService,
		public userService: UserService
	) { }

	public async ngOnInit(): Promise<void> {
		this.auth.user$.subscribe(profile => {
			if (profile) {
				const user: IUser = {
					authId: profile.sub,
					displayName: profile.name,
					createdAt: profile.updated_at ? new Date(profile.updated_at) : new Date()
				};
				this.userService.post(user).subscribe();
			}
		});
	}
}
