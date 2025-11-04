import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Campaign } from '../../../shared/models/rpg-sheet-manager.model';
import { CampaignService } from '../../../shared/services/campaign.service';
import { SystemService } from '../../../shared/services/system.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-invites',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './invites.component.html',
	styleUrl: './invites.component.scss'
})
export class InvitesComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private router = inject(Router);
	private campaignService = inject(CampaignService);
	private systemService = inject(SystemService);
	private dialogService = inject(DialogService);
	private currentUserService = inject(CurrentUserService);
	private notificationService = inject(NotificationService);

	invites: Campaign[] = [];
	systems: { [key: string]: string } = {};
	currentUserId: string = '';
	isLoading = false;

	public ngOnInit(): void {
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';

		this.loadSystems();
		this.loadInvites();
	}

	private loadSystems(): void {
		this.systemService.getSavedSystems()
			.pipe(takeUntil(this.destroy$))
			.subscribe(systems => {
				this.systems = systems.reduce((acc, system) => {
					if (system.id && system.name) {
						acc[system.id] = system.name;
					}
					return acc;
				}, {} as { [key: string]: string });
			});
	}

	private loadInvites(): void {
		if (!this.currentUserId) return;

		this.isLoading = true;
		this.campaignService.getInvitesByPlayerId(this.currentUserId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (campaigns: Campaign[]) => {
					this.invites = campaigns;
					this.isLoading = false;
				},
				error: (error) => {
					console.error('Erro ao carregar convites:', error);
					this.isLoading = false;
					this.dialogService.error('Erro', 'Erro ao carregar convites. Tente novamente.');
				}
			});
	}

	public getSystemName(systemId?: string): string {
		return systemId ? this.systems[systemId] || 'Sistema Desconhecido' : 'Sem Sistema';
	}

	public async acceptInvite(campaign: Campaign): Promise<void> {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Aceitar Convite',
			`Deseja aceitar o convite para participar da campanha "${campaign.title}"?`,
			'Aceitar'
		);

		if (!confirmed) return;

		this.campaignService.acceptInvite(campaign.id, this.currentUserId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (success: boolean) => {
					if (success) {
						this.dialogService.success('Convite Aceito!', `Você agora faz parte da campanha "${campaign.title}".`);
						// Remove o convite da lista
						this.invites = this.invites.filter(invite => invite.id !== campaign.id);
						// Notifica que os convites foram atualizados
						this.notificationService.notifyInvitesUpdated();
					} else {
						this.dialogService.error('Erro', 'Não foi possível aceitar o convite. Tente novamente.');
					}
				},
				error: (error) => {
					console.error('Erro ao aceitar convite:', error);
					this.dialogService.error('Erro', 'Erro ao aceitar convite. Tente novamente.');
				}
			});
	}

	public async declineInvite(campaign: Campaign): Promise<void> {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Recusar Convite',
			`Tem certeza que deseja recusar o convite da campanha "${campaign.title}"?`,
			'Recusar'
		);

		if (!confirmed) return;

		this.campaignService.declineInvite(campaign.id, this.currentUserId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (success: boolean) => {
					if (success) {
						this.dialogService.success('Convite Recusado', `O convite da campanha "${campaign.title}" foi recusado.`);
						// Remove o convite da lista
						this.invites = this.invites.filter(invite => invite.id !== campaign.id);
						// Notifica que os convites foram atualizados
						this.notificationService.notifyInvitesUpdated();
					} else {
						this.dialogService.error('Erro', 'Não foi possível recusar o convite. Tente novamente.');
					}
				},
				error: (error) => {
					console.error('Erro ao recusar convite:', error);
					this.dialogService.error('Erro', 'Erro ao recusar convite. Tente novamente.');
				}
			});
	}

	public viewCampaign(campaign: Campaign): void {
		this.router.navigate(['/campaigns/view', campaign.id]);
	}

	public goToCampaigns(): void {
		this.router.navigate(['/campaigns']);
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
