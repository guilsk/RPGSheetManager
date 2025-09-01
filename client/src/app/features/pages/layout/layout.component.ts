import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
	selector: 'app-layout',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss'
})
export class LayoutComponent {
	constructor(public auth: AuthService) { }
}
