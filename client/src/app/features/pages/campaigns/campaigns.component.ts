import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Campaign } from '../../../shared/models/rpg-sheet-manager.model';
import { CampaignService } from '../../../shared/services/campaign.service';
import { SystemService } from '../../../shared/services/system.service';
import { UserService } from '../../../shared/services/user.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { SearchBarConfig } from '../../../shared/models/search-bar.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-campaigns',
	standalone: true,
	imports: [CommonModule, SearchBarComponent],
	templateUrl: './campaigns.component.html',
	styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private router = inject(Router);
	private campaignService = inject(CampaignService);
	private systemService = inject(SystemService);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);
	private currentUserService = inject(CurrentUserService);

	myCampaigns: Campaign[] = [];
	playerCampaigns: Campaign[] = [];
	filteredMyCampaigns: Campaign[] = [];
	filteredPlayerCampaigns: Campaign[] = [];
	systems: { [key: string]: string } = {};
	users: { [key: string]: string } = {};
	currentUserId: string = '';

	mySearchConfig: SearchBarConfig<Campaign> = {
		placeholder: 'Buscar minhas campanhas...',
		searchProperty: 'title',
		debounceTime: 300,
		maxResults: 10,
		caseSensitive: false
	};

	playerSearchConfig: SearchBarConfig<Campaign> = {
		placeholder: 'Buscar campanhas como jogador...',
		searchProperty: 'title',
		debounceTime: 300,
		maxResults: 10,
		caseSensitive: false
	};

	public ngOnInit(): void {
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';
		this.loadSystems();
		this.loadCampaigns();
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

	private loadCampaigns(): void {
		// Carregar campanhas como mestre
		this.campaignService.getCampaignsByMaster(this.currentUserId)
			.pipe(takeUntil(this.destroy$))
			.subscribe((campaigns: Campaign[]) => {
				this.myCampaigns = campaigns;
				this.filteredMyCampaigns = [...campaigns];
			});

		// Carregar campanhas como jogador
		this.campaignService.getCampaignsByPlayer(this.currentUserId)
			.pipe(takeUntil(this.destroy$))
			.subscribe((campaigns: Campaign[]) => {
				this.playerCampaigns = campaigns;
				this.filteredPlayerCampaigns = [...campaigns];
			});
	}

	public onMySearchResults(filteredCampaigns: Campaign[]): void {
		this.filteredMyCampaigns = filteredCampaigns;
	}

	public onPlayerSearchResults(filteredCampaigns: Campaign[]): void {
		this.filteredPlayerCampaigns = filteredCampaigns;
	}

	public getSystemName(systemId?: string): string {
		return systemId ? this.systems[systemId] || 'Sistema Desconhecido' : 'Sem Sistema';
	}

	public getMasterName(masterId?: string): string {
		if (!masterId) return 'Sem Mestre';
		if (masterId === this.currentUserId) return 'Você';
		if (masterId === 'system-admin') return 'Sistema';

		// Tenta buscar no cache primeiro
		const cachedName = this.users[masterId];
		if (cachedName) return cachedName;

		// Se não encontrou, busca dinamicamente e atualiza o cache
		this.userService.getUserByAuthId(masterId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (user) => {
					this.users[masterId] = user?.displayName || user?.email || 'Mestre';
				},
				error: () => {
					this.users[masterId] = 'Mestre';
				}
			});

		return 'Carregando...';
	}

	public createCampaign(): void {
		this.router.navigate(['/campaigns/new']);
	}

	public viewCampaign(campaign: Campaign): void {
		this.router.navigate(['/campaigns/view', campaign.id]);
	}

	public async startSession(campaign: Campaign): Promise<void> {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Iniciar Sessão',
			`Deseja iniciar uma nova sessão da campanha "${campaign.title}"?`,
			'Iniciar'
		);

		if (!confirmed) return;

		this.campaignService.startSession(campaign.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe((success: boolean) => {
				if (success) {
					campaign.activeSession = true;
					this.dialogService.success('Sessão Iniciada', 'A sessão foi iniciada com sucesso!');
				} else {
					this.dialogService.error('Erro', 'Erro ao iniciar sessão. Tente novamente.');
				}
			});
	}

	public async endSession(campaign: Campaign): Promise<void> {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Finalizar Sessão',
			`Deseja finalizar a sessão atual da campanha "${campaign.title}"?`,
			'Finalizar'
		);

		if (!confirmed) return;

		this.campaignService.endSession(campaign.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe((success: boolean) => {
				if (success) {
					campaign.activeSession = false;
					this.dialogService.success('Sessão Finalizada', 'A sessão foi finalizada com sucesso!');
				} else {
					this.dialogService.error('Erro', 'Erro ao finalizar sessão. Tente novamente.');
				}
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
