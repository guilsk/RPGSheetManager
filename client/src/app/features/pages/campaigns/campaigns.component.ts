import { Component, OnInit, inject } from '@angular/core';
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

@Component({
	selector: 'app-campaigns',
	standalone: true,
	imports: [CommonModule, SearchBarComponent],
	templateUrl: './campaigns.component.html',
	styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent implements OnInit {
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

	ngOnInit() {
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';
		this.loadSystems();
		this.loadCampaigns();
	}

	loadSystems() {
		this.systemService.getSavedSystems().subscribe(systems => {
			this.systems = systems.reduce((acc, system) => {
				if (system.id && system.name) {
					acc[system.id] = system.name;
				}
				return acc;
			}, {} as { [key: string]: string });
		});
	}

	loadCampaigns() {
		// Carregar campanhas como mestre
		this.campaignService.getCampaignsByMaster(this.currentUserId).subscribe((campaigns: Campaign[]) => {
			this.myCampaigns = campaigns;
			this.filteredMyCampaigns = [...campaigns];
		});

		// Carregar campanhas como jogador
		this.campaignService.getCampaignsByPlayer(this.currentUserId).subscribe((campaigns: Campaign[]) => {
			this.playerCampaigns = campaigns;
			this.filteredPlayerCampaigns = [...campaigns];
		});
	}

	onMySearchResults(filteredCampaigns: Campaign[]) {
		this.filteredMyCampaigns = filteredCampaigns;
	}

	onPlayerSearchResults(filteredCampaigns: Campaign[]) {
		this.filteredPlayerCampaigns = filteredCampaigns;
	}

	getSystemName(systemId?: string): string {
		return systemId ? this.systems[systemId] || 'Sistema Desconhecido' : 'Sem Sistema';
	}

	getMasterName(masterId?: string): string {
		return masterId ? this.users[masterId] || 'Mestre Desconhecido' : 'Sem Mestre';
	}

	createCampaign() {
		this.router.navigate(['/campaigns/edit/new']);
	}

	viewCampaign(campaign: Campaign) {
		this.router.navigate(['/campaigns/view', campaign.id]);
	}

	async startSession(campaign: Campaign) {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Iniciar Sessão',
			`Deseja iniciar uma nova sessão da campanha "${campaign.title}"?`,
			'Iniciar'
		);

		if (!confirmed) return;

		this.campaignService.startSession(campaign.id).subscribe((success: boolean) => {
			if (success) {
				campaign.activeSession = true;
				this.dialogService.success('Sessão Iniciada', 'A sessão foi iniciada com sucesso!');
			} else {
				this.dialogService.error('Erro', 'Erro ao iniciar sessão. Tente novamente.');
			}
		});
	}

	async endSession(campaign: Campaign) {
		if (!campaign.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Finalizar Sessão',
			`Deseja finalizar a sessão atual da campanha "${campaign.title}"?`,
			'Finalizar'
		);

		if (!confirmed) return;

		this.campaignService.endSession(campaign.id).subscribe((success: boolean) => {
			if (success) {
				campaign.activeSession = false;
				this.dialogService.success('Sessão Finalizada', 'A sessão foi finalizada com sucesso!');
			} else {
				this.dialogService.error('Erro', 'Erro ao finalizar sessão. Tente novamente.');
			}
		});
	}

	joinSession(campaign: Campaign) {
		// TODO: Implementar funcionalidade de entrar na sessão
		this.router.navigate(['/campaigns/session', campaign.id]);
	}
}
