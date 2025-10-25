import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { DialogComponent } from '../../components/dialog/dialog.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { CampaignService } from '../../../shared/services/campaign.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';

@Component({
	selector: 'app-layout',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DialogComponent],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
	private router = inject(Router);
	private campaignService = inject(CampaignService);
	private notificationService = inject(NotificationService);
	private destroy$ = new Subject<void>();

	invitesCount = 0;

	constructor(
		public auth: AuthService,
		public currentUserService: CurrentUserService,
		public dialogService: DialogService
	) { }

	ngOnInit(): void {
		// Verificar convites a cada 30 segundos quando usuário estiver logado
		this.auth.isAuthenticated$.pipe(
			filter(isAuthenticated => isAuthenticated),
			switchMap(() => this.currentUserService.currentUser$),
			filter(user => !!user?.authId),
			switchMap(user =>
				interval(30000).pipe( // A cada 30 segundos
					switchMap(() => this.campaignService.getInvitesByPlayerId(user!.authId!))
				)
			),
			takeUntil(this.destroy$)
		).subscribe(invites => {
			this.invitesCount = invites.length;
		});

		// Carregar convites inicialmente
		this.currentUserService.currentUser$.pipe(
			filter(user => !!user?.authId),
			switchMap(user => this.campaignService.getInvitesByPlayerId(user!.authId!)),
			takeUntil(this.destroy$)
		).subscribe(invites => {
			this.invitesCount = invites.length;
		});

		// Ouvir notificações de atualização de convites
		this.notificationService.invitesUpdated.pipe(
			takeUntil(this.destroy$)
		).subscribe(() => {
			this.refreshInvitesCount();
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	goToInvites(): void {
		this.router.navigate(['/invites']);
	}

	public refreshInvitesCount(): void {
		const currentUser = this.currentUserService.getCurrentUser();
		if (currentUser?.authId) {
			this.campaignService.getInvitesByPlayerId(currentUser.authId).subscribe(invites => {
				this.invitesCount = invites.length;
			});
		}
	}

	onDialogConfirmed(result: boolean): void {
		this.dialogService.onDialogResult(result);
	}

	onDialogClosed(): void {
		this.dialogService.hideDialog();
	}
}
