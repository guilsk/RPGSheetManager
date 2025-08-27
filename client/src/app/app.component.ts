import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './entities/user/user.service';
import { User } from './entities/user/user.model';
import { LayoutComponent } from './shared/ui/layout/layout.component';

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
				const user: User = {
					authId: profile.sub,
					displayName: profile.name
				};
				this.userService.post(user).subscribe();
			}
		});
	}
}
