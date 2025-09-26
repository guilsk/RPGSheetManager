import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { CurrentUserService } from '../../services/current-user.service';
import { DialogComponent } from '../../components/dialog/dialog.component';
import { DialogService } from '../../services/dialog.service';

@Component({
	selector: 'app-layout',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DialogComponent],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss'
})
export class LayoutComponent {
	constructor(
		public auth: AuthService,
		public currentUserService: CurrentUserService,
		public dialogService: DialogService
	) { }

	onDialogConfirmed(result: boolean): void {
		this.dialogService.onDialogResult(result);
	}

	onDialogClosed(): void {
		this.dialogService.hideDialog();
	}
}
