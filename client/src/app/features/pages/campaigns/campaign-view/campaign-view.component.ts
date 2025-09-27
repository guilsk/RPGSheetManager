import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Campaign } from '../../../../shared/models/rpg-sheet-manager.model';
import { RpgSystem } from '../../../../shared/models/rpg-sheet-manager.model';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { SystemService } from '../../../../shared/services/system.service';
import { UserService } from '../../../../shared/services/user.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../../shared/services/current-user.service';

@Component({
	selector: 'app-campaign-view',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
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

	campaign: Campaign | null = null;
	systems: RpgSystem[] = [];
	editForm!: FormGroup;
	editMode = false;
	isLoading = false;
	isOwner = false;
	campaignId: string | null = null;
	currentUserId: string = '';

	ngOnInit() {
		this.campaignId = this.route.snapshot.paramMap.get('id');
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';

		this.initEditForm();
		this.loadSystems();

		if (this.campaignId) {
			this.loadCampaign();
		}
	}	initEditForm() {
		this.editForm = this.fb.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			systemId: ['', Validators.required],
			description: ['']
		});
	}

	loadSystems() {
		this.systemService.getSavedSystems().subscribe(systems => {
			this.systems = systems;
		});
	}

	loadCampaign() {
		if (!this.campaignId) return;

		this.campaignService.getCampaignById(this.campaignId).subscribe(campaign => {
			if (campaign) {
				this.campaign = campaign;
				this.isOwner = campaign.masterId === this.currentUserId;

				// Preencher formulário de edição
				this.editForm.patchValue({
					title: campaign.title,
					systemId: campaign.systemId,
					description: campaign.description || ''
				});
			} else {
				this.dialogService.error('Erro', 'Campanha não encontrada');
				this.router.navigate(['/campaigns']);
			}
		});
	}

	getSystemName(systemId?: string): string {
		if (!systemId || !this.systems.length) return 'Sistema Desconhecido';
		const system = this.systems.find(s => s.id === systemId);
		return system?.name || 'Sistema Desconhecido';
	}

	getMasterName(masterId?: string): string {
		// TODO: Implementar busca de nome do mestre
		return masterId === this.currentUserId ? 'Você' : 'Mestre';
	}

	toggleEditMode() {
		this.editMode = !this.editMode;
		if (!this.editMode && this.campaign) {
			// Reset form quando cancelar edição
			this.editForm.patchValue({
				title: this.campaign.title,
				systemId: this.campaign.systemId,
				description: this.campaign.description || ''
			});
		}
	}

	cancelEdit() {
		this.toggleEditMode();
	}

	saveChanges() {
		if (!this.campaign || !this.campaignId || this.editForm.invalid) return;

		this.isLoading = true;
		const formValue = this.editForm.value;

		const updatedCampaign: Campaign = {
			...this.campaign,
			title: formValue.title,
			systemId: formValue.systemId,
			description: formValue.description
		};

		this.campaignService.updateCampaign(this.campaignId, updatedCampaign).subscribe((success: boolean) => {
			this.isLoading = false;
			if (success) {
				this.campaign = updatedCampaign;
				this.editMode = false;
				this.dialogService.success('Sucesso', 'Campanha atualizada com sucesso!');
			} else {
				this.dialogService.error('Erro', 'Erro ao atualizar campanha. Tente novamente.');
			}
		});
	}

	async startSession() {
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

	async endSession() {
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

	async deleteCampaign() {
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
}
