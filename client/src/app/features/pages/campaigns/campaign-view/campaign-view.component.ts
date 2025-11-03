import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Campaign, RpgSystem, User, Character, DynamicField } from '../../../../shared/models/rpg-sheet-manager.model';
import { SearchBarConfig } from '../../../../shared/models/search-bar.model';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { SystemService } from '../../../../shared/services/system.service';
import { UserService } from '../../../../shared/services/user.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../../shared/services/current-user.service';
import { CharacterService } from '../../../../shared/services/character.service';
import { MultiSelectSearchComponent } from '../../../components/multi-select-search/multi-select-search.component';
import { CharacterSelectorComponent } from '../../../components/character-selector/character-selector.component';
import { CharacterViewModalComponent } from '../../../components/character-view-modal/character-view-modal.component';
import { CharacterEditModalComponent } from '../../../components/character-edit-modal/character-edit-modal.component';

@Component({
	selector: 'app-campaign-view',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, MultiSelectSearchComponent, CharacterSelectorComponent, CharacterViewModalComponent, CharacterEditModalComponent],
	templateUrl: './campaign-view.component.html',
	styleUrl: './campaign-view.component.scss'
})
export class CampaignViewComponent implements OnInit {
	private fb = inject(FormBuilder);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private campaignService = inject(CampaignService);
	private systemService = inject(SystemService);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);
	private currentUserService = inject(CurrentUserService);
	private characterService = inject(CharacterService);

	campaign: Campaign | null = null;
	systems: RpgSystem[] = [];
	editForm!: FormGroup;
	editMode = false;
	isLoading = false;
	isOwner = false;
	campaignId: string | null = null;
	currentUserId: string = '';
	activePlayers: User[] = [];
	playerCharacters: { [playerId: string]: any } = {};
	invitedPlayers: User[] = [];
	users: User[] = [];
	userSearchConfig!: any;
	loadingUsers = false;
	masterName: string = 'Carregando...';

	// Character Management
	showCharacterSelector = false;
	campaignCharacters: { [playerId: string]: Character } = {};
	selectedPlayerForCharacter = '';

	// Character View Modal
	showCharacterViewModal = false;
	selectedCharacterToView: Character | null = null;
	selectedCharacterCampaignData: DynamicField[] = [];

	// Character Edit Modal
	showCharacterEditModal = false;
	selectedCharacterToEdit: Character | null = null;
	selectedCharacterEditCampaignData: DynamicField[] = [];
	selectedCharacterOwnerId = '';

	public ngOnInit(): void {
		this.campaignId = this.route.snapshot.paramMap.get('id');
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';

		// Check if we should start in edit mode based on the route
		const currentRoute = this.router.url;
		if (currentRoute.includes('/campaigns/edit/')) {
			this.editMode = true;
		}

		this.initEditForm();
		this.setupUserSearchConfig();
		this.loadSystems();
		this.loadUsers();

		if (this.campaignId) {
			this.loadCampaign();
		}
	}

	private initEditForm(): void {
		this.editForm = this.fb.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			systemId: ['', Validators.required],
			description: [''],
			invitedPlayerIds: [[]]
		});
	}

	private setupUserSearchConfig(): void {
		this.userSearchConfig = {
			placeholder: 'Buscar jogadores para convidar...',
			searchProperty: 'displayName',
			displayProperty: 'displayName',
			debounceTime: 300,
			maxResults: 10,
			caseSensitive: false
		};
	}

	private loadUsers(): void {
		this.loadingUsers = true;

		this.userService.getAllUsers().subscribe({
			next: (users: User[]) => {
				// Filtrar usuário atual, jogadores ativos e jogadores convidados
				this.users = users.filter(user => {
					// Verificar se user.authId existe
					if (!user.authId) return false;

					// Não mostrar o próprio usuário
					if (user.authId === this.currentUserId) return false;

					// Não mostrar jogadores que já estão ativos na campanha
					if (this.campaign?.playerIds?.includes(user.authId)) return false;

					// Não mostrar jogadores que já foram convidados
					if (this.campaign?.invitedPlayerIds?.includes(user.authId)) return false;

					return true;
				});

				this.loadingUsers = false;
			},
			error: (error) => {
				console.error('Erro ao carregar usuários:', error);
				this.loadingUsers = false;
			}
		});
	}

	private loadSystems(): void {
		this.systemService.getSavedSystems().subscribe(systems => {
			this.systems = systems;
		});
	}

	private loadCampaign(): void {
		if (!this.campaignId) return;

		this.campaignService.getCampaignById(this.campaignId).subscribe(campaign => {
			if (campaign) {
				this.campaign = campaign;
				this.isOwner = campaign.masterId === this.currentUserId;

				// Preencher formulário de edição
				this.editForm.patchValue({
					title: campaign.title,
					systemId: campaign.systemId,
					description: campaign.description || '',
					invitedPlayerIds: campaign.invitedPlayerIds || []
				});

				// Carregar jogadores ativos e convidados
				this.loadActivePlayers();
				this.loadInvitedPlayers();

				// Carregar personagens da campanha
				this.loadCampaignCharacters();

				// Recarregar usuários disponíveis para aplicar filtros corretos
				this.loadUsers();
			} else {
				this.dialogService.error('Erro', 'Campanha não encontrada');
				this.router.navigate(['/campaigns']);
			}
		});
	}

	public getSystemName(systemId?: string): string {
		if (!systemId || !this.systems.length) return 'Sistema Desconhecido';
		const system = this.systems.find(s => s.id === systemId);
		return system?.name || 'Sistema Desconhecido';
	}

	public getMasterName(masterId?: string): string {
		if (!masterId) return 'Sem Mestre';
		if (masterId === this.currentUserId) return 'Você';
		if (masterId === 'system-admin') return 'Sistema';

		// Busca o nome do mestre na lista de usuários já carregados
		const masterUser = this.users.find(user => user.authId === masterId);
		if (masterUser) {
			return masterUser.displayName || masterUser.email || 'Mestre';
		}

		// Se não encontrou, busca dinamicamente
		this.loadMasterName(masterId);
		return this.masterName;
	}

	private loadMasterName(masterId: string): void {
		this.userService.getUserByAuthId(masterId).subscribe({
			next: (user) => {
				this.masterName = user?.displayName || user?.email || 'Mestre';
			},
			error: () => {
				this.masterName = 'Mestre Desconhecido';
			}
		});
	}

	private loadActivePlayers(): void {
		if (!this.campaign?.playerIds?.length) {
			this.activePlayers = [];
			return;
		}

		// Carregar dados dos jogadores ativos
		this.activePlayers = [];
		for (const playerId of this.campaign.playerIds) {
			this.userService.getUserByAuthId(playerId).subscribe(user => {
				if (user) {
					this.activePlayers.push(user);
				}
			});
		}

		// TODO: Carregar personagens dos jogadores quando implementarmos
		// this.loadPlayerCharacters();
	}

	private loadInvitedPlayers(): void {
		if (!this.campaign?.invitedPlayerIds?.length) {
			this.invitedPlayers = [];
			return;
		}

		// Carregar dados dos jogadores convidados
		this.invitedPlayers = [];
		for (const playerId of this.campaign.invitedPlayerIds) {
			this.userService.getUserByAuthId(playerId).subscribe(user => {
				if (user) {
					this.invitedPlayers.push(user);
				}
			});
		}
	}

	public trackByPlayer(index: number, player: User): string {
		return player.authId || index.toString();
	}

	public toggleEditMode(): void {
		this.editMode = !this.editMode;
		if (!this.editMode && this.campaign) {
			// Reset form quando cancelar edição
			this.editForm.patchValue({
				title: this.campaign.title,
				systemId: this.campaign.systemId,
				description: this.campaign.description || '',
				invitedPlayerIds: this.campaign.invitedPlayerIds || []
			});
			// Recarregar dados dos jogadores convidados
			this.loadInvitedPlayers();
		}
	}

	public cancelEdit(): void {
		this.toggleEditMode();
	}

	public saveChanges(): void {
		if (!this.campaign || !this.campaignId || this.editForm.invalid) return;

		this.isLoading = true;
		const formValue = this.editForm.value;

		const updatedCampaign: Campaign = {
			...this.campaign,
			title: formValue.title,
			systemId: formValue.systemId,
			description: formValue.description,
			invitedPlayerIds: formValue.invitedPlayerIds || []
		};

		this.campaignService.updateCampaign(this.campaignId, updatedCampaign).subscribe((success: boolean) => {
			this.isLoading = false;
			if (success) {
				this.campaign = updatedCampaign;
				this.editMode = false;
				// Recarregar dados dos jogadores convidados e usuários disponíveis
				this.loadInvitedPlayers();
				this.loadUsers(); // Atualizar lista de usuários disponíveis
				this.dialogService.success('Sucesso', 'Campanha atualizada com sucesso!');
			} else {
				this.dialogService.error('Erro', 'Erro ao atualizar campanha. Tente novamente.');
			}
		});
	}

	public async startSession(): Promise<void> {
		if (!this.campaign?.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Iniciar Aventura',
			`Deseja iniciar uma nova sessão da campanha "${this.campaign.title}"? Todos os jogadores serão notificados!`,
			'Iniciar Aventura'
		);

		if (!confirmed) return;

		this.campaignService.startSession(this.campaign.id).subscribe((success: boolean) => {
			if (success && this.campaign) {
				this.campaign.activeSession = true;
				this.dialogService.success('Aventura Iniciada', 'A sessão foi iniciada com sucesso! Os jogadores já podem participar.');
			} else {
				this.dialogService.error('Erro', 'Erro ao iniciar sessão. Tente novamente.');
			}
		});
	}

	public async endSession(): Promise<void> {
		if (!this.campaign?.id) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Encerrar Aventura',
			`Deseja encerrar a sessão atual da campanha "${this.campaign.title}"? Os jogadores serão desconectados.`,
			'Encerrar Aventura'
		);

		if (!confirmed) return;

		this.campaignService.endSession(this.campaign.id).subscribe((success: boolean) => {
			if (success && this.campaign) {
				this.campaign.activeSession = false;
				this.dialogService.success('Aventura Encerrada', 'A sessão foi encerrada com sucesso!');
			} else {
				this.dialogService.error('Erro', 'Erro ao encerrar sessão. Tente novamente.');
			}
		});
	}

	public async deleteCampaign(): Promise<void> {
		if (!this.campaign?.id) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Encerrar Campanha',
			`Você está prestes a encerrar permanentemente a campanha "${this.campaign.title}". Todos os dados, personagens e histórico serão perdidos para sempre. Esta ação não pode ser desfeita.`,
			'Encerrar Definitivamente'
		);

		if (!confirmed) return;

		this.campaignService.deleteCampaign(this.campaign.id).subscribe((success: boolean) => {
			if (success) {
				this.dialogService.success('Campanha Encerrada', 'A campanha foi encerrada com sucesso.');
				this.router.navigate(['/campaigns']);
			} else {
				this.dialogService.error('Erro', 'Erro ao encerrar campanha. Tente novamente.');
			}
		});
	}

	public async removePlayer(player: User): Promise<void> {
		if (!this.campaign?.id || !player.authId) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Remover Jogador',
			`Tem certeza que deseja remover ${player.displayName} da campanha "${this.campaign.title}"? O jogador será notificado sobre a remoção.`,
			'Remover'
		);

		if (!confirmed) return;

		// Atualizar localmente primeiro para feedback visual imediato
		const updatedPlayerIds = this.campaign.playerIds?.filter(id => id !== player.authId) || [];

		const updatedCampaign: Campaign = {
			...this.campaign,
			playerIds: updatedPlayerIds
		};

		this.campaignService.updateCampaign(this.campaign.id, updatedCampaign).subscribe((success: boolean) => {
			if (success) {
				// Atualizar o objeto campaign local
				this.campaign = updatedCampaign;

				// Remover da lista de jogadores ativos
				this.activePlayers = this.activePlayers.filter(p => p.authId !== player.authId);

				// Recarregar usuários disponíveis para que o jogador removido apareça novamente na busca
				this.loadUsers();

				this.dialogService.success('Jogador Removido', `${player.displayName} foi removido da campanha com sucesso.`);
			} else {
				this.dialogService.error('Erro', 'Erro ao remover jogador. Tente novamente.');
			}
		});
	}

	public async removeInvite(player: User): Promise<void> {
		if (!this.campaign?.id || !player.authId) return;

		const confirmed = await this.dialogService.showConfirmation(
			'Cancelar Convite',
			`Tem certeza que deseja cancelar o convite para ${player.displayName}? O jogador não será mais notificado sobre esta campanha.`,
			'Cancelar Convite'
		);

		if (!confirmed) return;

		// Atualizar localmente primeiro para feedback visual imediato
		const updatedInvitedPlayerIds = this.campaign.invitedPlayerIds?.filter(id => id !== player.authId) || [];

		const updatedCampaign: Campaign = {
			...this.campaign,
			invitedPlayerIds: updatedInvitedPlayerIds
		};

		this.campaignService.updateCampaign(this.campaign.id, updatedCampaign).subscribe((success: boolean) => {
			if (success) {
				// Atualizar o objeto campaign local
				this.campaign = updatedCampaign;

				// Remover da lista de jogadores convidados
				this.invitedPlayers = this.invitedPlayers.filter(p => p.authId !== player.authId);

				// Atualizar o form control para refletir a mudança
				this.editForm.patchValue({
					invitedPlayerIds: updatedInvitedPlayerIds
				});

				// Recarregar usuários disponíveis para que o jogador possa ser convidado novamente
				this.loadUsers();

				this.dialogService.success('Convite Cancelado', `O convite para ${player.displayName} foi cancelado com sucesso.`);
			} else {
				this.dialogService.error('Erro', 'Erro ao cancelar convite. Tente novamente.');
			}
		});
	}

	// Character Management Methods
	private loadCampaignCharacters(): void {
		if (!this.campaign?.characters) return;

		// Para cada personagem da campanha, buscar os dados completos
		this.campaign.characters.forEach(campaignChar => {
			if (campaignChar.characterId && campaignChar.playerId) {
				this.characterService.getCharacterById(campaignChar.characterId).subscribe({
					next: (character: Character | undefined) => {
						if (character) {
							this.campaignCharacters[campaignChar.playerId] = character;
						}
					},
					error: (error: any) => {
						console.error('Error loading character:', campaignChar.characterId, error);
					}
				});
			}
		});
	}

	public openCharacterSelector(playerId: string): void {
		this.selectedPlayerForCharacter = playerId;
		this.showCharacterSelector = true;
	}

	public closeCharacterSelector(): void {
		this.showCharacterSelector = false;
		this.selectedPlayerForCharacter = '';
	}

	public closeCharacterViewModal(): void {
		this.showCharacterViewModal = false;
		this.selectedCharacterToView = null;
		this.selectedCharacterCampaignData = [];
	}

	public closeCharacterEditModal(): void {
		this.showCharacterEditModal = false;
		this.selectedCharacterToEdit = null;
		this.selectedCharacterEditCampaignData = [];
		this.selectedCharacterOwnerId = '';
	}

	public onCharacterSelected(character: Character): void {
		if (!this.campaign?.id || !this.selectedPlayerForCharacter) {
			return;
		}

		this.campaignService.associateCharacter(this.campaign.id, character.id!, this.selectedPlayerForCharacter).subscribe({
			next: (response) => {
				this.campaignCharacters[this.selectedPlayerForCharacter] = character;
				this.dialogService.success('Sucesso', `Personagem ${character.name} foi associado à campanha!`);
				this.closeCharacterSelector();
				// Recarregar a campanha para atualizar a lista de personagens
				this.loadCampaign();
			},
			error: (error) => {
				this.dialogService.error('Erro', 'Não foi possível associar o personagem à campanha.');
			}
		});
	}

	public viewCharacter(character: Character): void {
		if (!this.campaign?.id || !character.id) return;

		// Buscar dados da campanha para este personagem
		this.campaignService.getCampaignCharacterData(this.campaign.id, character.id).subscribe({
			next: (campaignData) => {
				this.selectedCharacterToView = character;
				this.selectedCharacterCampaignData = campaignData?.dynamicData || [];
				this.showCharacterViewModal = true;
			},
			error: (error) => {
				console.error('Error loading campaign character data:', error);
				// Mostrar modal mesmo sem dados de campanha
				this.selectedCharacterToView = character;
				this.selectedCharacterCampaignData = [];
				this.showCharacterViewModal = true;
			}
		});
	}

	public editCharacter(character: Character): void {
		// Não usar navegação - abrir modal de edição
		if (!this.campaign?.id || !character.id) return;

		// Buscar dados da campanha para este personagem
		this.campaignService.getCampaignCharacterData(this.campaign.id, character.id).subscribe({
			next: (campaignData) => {
				// Buscar o dono do personagem no campaign.characters
				const campaignChar = this.campaign?.characters?.find(cc => cc.characterId === character.id);

				this.selectedCharacterToEdit = character;
				this.selectedCharacterEditCampaignData = campaignData?.dynamicData || [];
				this.selectedCharacterOwnerId = campaignChar?.playerId || '';
				this.showCharacterEditModal = true;
			},
			error: (error) => {
				console.error('Error loading campaign character data:', error);
				// Mostrar modal mesmo sem dados de campanha
				const campaignChar = this.campaign?.characters?.find(cc => cc.characterId === character.id);

				this.selectedCharacterToEdit = character;
				this.selectedCharacterEditCampaignData = [];
				this.selectedCharacterOwnerId = campaignChar?.playerId || '';
				this.showCharacterEditModal = true;
			}
		});
	}

	public onCharacterDataSaved(dynamicData: DynamicField[]): void {
		// Recarregar dados do personagem após salvar
		if (this.selectedCharacterToEdit?.id && this.campaign?.id) {
			this.campaignService.getCampaignCharacterData(this.campaign.id, this.selectedCharacterToEdit.id).subscribe({
				next: (campaignData) => {
					// Atualizar os dados de campanha localmente se necessário
					this.selectedCharacterEditCampaignData = campaignData?.dynamicData || [];

					// Recarregar a campanha completa para refletir mudanças
					this.loadCampaign();
				},
				error: (error) => {
					console.error('Error reloading campaign character data:', error);
				}
			});
		}
	}

	public async removeCharacter(playerId: string): Promise<void> {
		const character = this.campaignCharacters[playerId];
		if (!character || !this.campaign?.id) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Remover Personagem',
			`Tem certeza que deseja remover o personagem ${character.name} desta campanha?`
		);

		if (confirmed) {
			this.campaignService.disassociateCharacter(this.campaign.id, character.id!, playerId).subscribe({
				next: () => {
					delete this.campaignCharacters[playerId];
					this.dialogService.success('Sucesso', `Personagem ${character.name} foi removido da campanha.`);
				},
				error: (error) => {
					console.error('Erro ao remover personagem:', error);
					this.dialogService.error('Erro', 'Não foi possível remover o personagem da campanha.');
				}
			});
		}
	}

	public canManageCharacter(playerId: string): boolean {
		// Apenas jogadores podem gerenciar seus próprios personagens
		// Mestres NÃO podem associar personagens para jogadores
		return playerId === this.currentUserId;
	}

	public canEditCharacter(playerId: string): boolean {
		// Apenas jogadores podem editar seus próprios personagens (não o mestre)
		return !this.isOwner && playerId === this.currentUserId;
	}

	public getCharacterLevel(character: Character): string | null {
		// Procura por campo que pode representar nível
		const levelField = character.data?.find(field =>
			field.name?.toLowerCase().includes('nivel') ||
			field.name?.toLowerCase().includes('level') ||
			field.name?.toLowerCase().includes('lvl')
		);
		return levelField?.value || null;
	}

	public getCharacterClass(character: Character): string | null {
		// Procura por campo que pode representar classe
		const classField = character.data?.find(field =>
			field.name?.toLowerCase().includes('classe') ||
			field.name?.toLowerCase().includes('class') ||
			field.name?.toLowerCase().includes('profissao') ||
			field.name?.toLowerCase().includes('profession')
		);
		return classField?.value || null;
	}

	public isPlayerInCampaign(): boolean {
		if (!this.campaign) return false;
		return this.campaign.playerIds?.includes(this.currentUserId) || false;
	}

	public async leaveCampaign(): Promise<void> {
		if (!this.campaign?.id || !this.currentUserId) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Sair da Campanha',
			`Tem certeza que deseja sair da campanha "${this.campaign.title}"?\n\nSeu personagem será removido da campanha e você perderá acesso a todas as informações da campanha.`,
			'Sair da Campanha'
		);

		if (confirmed) {
			this.campaignService.removePlayerFromCampaign(this.campaign.id, this.currentUserId).subscribe({
				next: () => {
					this.dialogService.success('Sucesso', `Você saiu da campanha "${this.campaign?.title}".`);
					this.router.navigate(['/campaigns']);
				},
				error: (error) => {
					console.error('Erro ao sair da campanha:', error);
					this.dialogService.error('Erro', 'Não foi possível sair da campanha. Tente novamente.');
				}
			});
		}
	}
}
