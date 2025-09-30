import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Campaign } from '../../../../shared/models/rpg-sheet-manager.model';
import { RpgSystem } from '../../../../shared/models/rpg-sheet-manager.model';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { SystemService } from '../../../../shared/services/system.service';
import { UserService } from '../../../../shared/services/user.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../../shared/services/current-user.service';

@Component({
	selector: 'app-campaign-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './campaign-edit.component.html',
	styleUrl: './campaign-edit.component.scss'
})
export class CampaignEditComponent implements OnInit {
	private fb = inject(FormBuilder);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private campaignService = inject(CampaignService);
	private systemService = inject(SystemService);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);
	private currentUserService = inject(CurrentUserService);

	public campaignForm!: FormGroup;
	public systems: RpgSystem[] = [];
	public isEditing = false;
	public isLoading = false;
	public loadingSystems = false;
	public campaignId: string | null = null;
	public currentCampaign: Campaign | null = null;

	public ngOnInit(): void {
		this.campaignId = this.route.snapshot.paramMap.get('id');
		this.isEditing = this.campaignId !== null && this.campaignId !== 'new';

		this.initForm();
		this.loadSystems();

		if (this.isEditing && this.campaignId) {
			this.loadCampaign();
		}
	}

	private initForm(): void {
		this.campaignForm = this.fb.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			systemId: ['', Validators.required],
			description: ['']
		});
	}

	private loadSystems(): void {
		this.loadingSystems = true;
		this.campaignForm.get('systemId')?.disable();

		this.systemService.getSavedSystems().subscribe({
			next: (systems: RpgSystem[]) => {
				this.systems = systems;
				this.loadingSystems = false;
				this.campaignForm.get('systemId')?.enable();

				// Se só há um sistema, seleciona automaticamente
				if (systems.length === 1) {
					this.campaignForm.get('systemId')?.setValue(systems[0].id);
				}
			},
			error: (error) => {
				console.error('Erro ao carregar sistemas:', error);
				this.loadingSystems = false;
				this.campaignForm.get('systemId')?.enable();
			}
		});
	}

	private loadCampaign(): void {
		if (!this.campaignId) return;

		this.campaignService.getCampaignById(this.campaignId).subscribe(campaign => {
			if (campaign) {
				this.currentCampaign = campaign;
				this.campaignForm.patchValue({
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

	public saveCampaign(): void {
		if (this.campaignForm.invalid) return;

		this.isLoading = true;
		const formValue = this.campaignForm.value;

		const currentUser = this.currentUserService.getCurrentUser();
		if (!currentUser?.authId) {
			this.dialogService.error('Erro', 'Usuário não identificado. Faça login novamente.');
			return;
		}

		const campaignData: Campaign = {
			title: formValue.title,
			systemId: formValue.systemId,
			description: formValue.description,
			masterId: currentUser.authId,
			playerIds: [],
			characters: [],
			diceHistory: [],
			activeSession: false
		};

		if (this.isEditing && this.campaignId) {
			campaignData.id = this.campaignId;
			this.campaignService.updateCampaign(this.campaignId, campaignData).subscribe((success: boolean) => {
				this.isLoading = false;
				if (success) {
					this.dialogService.success('Sucesso', 'Campanha atualizada com sucesso!');
					this.router.navigate(['/campaigns']);
				} else {
					this.dialogService.error('Erro', 'Erro ao atualizar campanha. Tente novamente.');
				}
			});
		} else {
			this.campaignService.createCampaign(campaignData).subscribe(campaign => {
				this.isLoading = false;
				if (campaign) {
					this.dialogService.success('Sucesso', 'Campanha criada com sucesso!');
					this.router.navigate(['/campaigns']);
				} else {
					this.dialogService.error('Erro', 'Erro ao criar campanha. Tente novamente.');
				}
			});
		}
	}

	public cancel(): void {
		this.router.navigate(['/campaigns']);
	}

	public goBack(): void {
		this.router.navigate(['/campaigns']);
	}

	public toggleSession(): void {
		if (!this.currentCampaign || !this.campaignId) return;

		this.isLoading = true;
		const newActiveState = !this.currentCampaign.activeSession;

		if (newActiveState) {
			// Ativar sessão
			this.campaignService.startSession(this.campaignId).subscribe({
				next: (success: boolean) => {
					this.isLoading = false;
					if (success && this.currentCampaign) {
						this.currentCampaign.activeSession = true;
						this.dialogService.success('Sucesso', 'Sessão ativada com sucesso!');
					} else {
						this.dialogService.error('Erro', 'Erro ao ativar sessão. Tente novamente.');
					}
				},
				error: (error) => {
					this.isLoading = false;
					console.error('Erro ao ativar sessão:', error);
					this.dialogService.error('Erro', 'Erro ao ativar sessão. Tente novamente.');
				}
			});
		} else {
			// Pausar sessão
			this.campaignService.endSession(this.campaignId).subscribe({
				next: (success: boolean) => {
					this.isLoading = false;
					if (success && this.currentCampaign) {
						this.currentCampaign.activeSession = false;
						this.dialogService.success('Sucesso', 'Sessão pausada com sucesso!');
					} else {
						this.dialogService.error('Erro', 'Erro ao pausar sessão. Tente novamente.');
					}
				},
				error: (error) => {
					this.isLoading = false;
					console.error('Erro ao pausar sessão:', error);
					this.dialogService.error('Erro', 'Erro ao pausar sessão. Tente novamente.');
				}
			});
		}
	}
}
