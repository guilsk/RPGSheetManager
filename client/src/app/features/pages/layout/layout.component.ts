import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { environment } from '../../../../environments/environment';
import { DialogComponent } from '../../components/dialog/dialog.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { CampaignService } from '../../../shared/services/campaign.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Subject, interval, fromEvent, merge } from 'rxjs';
import { takeUntil, switchMap, filter, startWith, debounceTime } from 'rxjs/operators';

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
		// Carregar convites inicialmente
		this.currentUserService.currentUser$.pipe(
			filter(user => !!user?.authId),
			switchMap(user => this.campaignService.getInvitesByPlayerId(user!.authId!)),
			takeUntil(this.destroy$)
		).subscribe(invites => {
			this.invitesCount = invites.length;
		});

		// Polling otimizado - apenas quando a página está visível e ativa
		const pageVisibilityChange$ = fromEvent(document, 'visibilitychange');
		const pageInteraction$ = merge(
			fromEvent(document, 'click'),
			fromEvent(document, 'keydown'),
			fromEvent(window, 'focus')
		).pipe(debounceTime(1000));

		this.auth.isAuthenticated$.pipe(
			filter(isAuthenticated => isAuthenticated),
			switchMap(() => this.currentUserService.currentUser$),
			filter(user => !!user?.authId),
			switchMap(user =>
				merge(
					pageVisibilityChange$.pipe(startWith(null)),
					pageInteraction$.pipe(startWith(null))
				).pipe(
					filter(() => !document.hidden), // Apenas quando a página está visível
					switchMap(() => interval(60000).pipe( // Reduzido para 60 segundos
						switchMap(() => this.campaignService.getInvitesByPlayerId(user!.authId!))
					))
				)
			),
			takeUntil(this.destroy$)
		).subscribe(invites => {
			this.invitesCount = invites.length;
		});

		// Ouvir notificações de atualização de convites (mais eficiente)
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
			this.campaignService.getInvitesByPlayerId(currentUser.authId)
				.pipe(takeUntil(this.destroy$))
				.subscribe(invites => {
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

	logout(): void {
		this.auth.logout({
			logoutParams: {
				returnTo: environment.auth0.logoutUri
			}
		});
	}
}
