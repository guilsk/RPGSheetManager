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

	campaignForm!: FormGroup;
	systems: RpgSystem[] = [];
	isEditing = false;
	isLoading = false;
	loadingSystems = false;
	campaignId: string | null = null;

	ngOnInit() {
		this.campaignId = this.route.snapshot.paramMap.get('id');
		this.isEditing = this.campaignId !== null && this.campaignId !== 'new';

		this.initForm();
		this.loadSystems();

		if (this.isEditing && this.campaignId) {
			this.loadCampaign();
		}
	}

	initForm() {
		this.campaignForm = this.fb.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			systemId: ['', Validators.required],
			description: ['']
		});
	}

	loadSystems() {
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

	loadCampaign() {
		if (!this.campaignId) return;

		this.campaignService.getCampaignById(this.campaignId).subscribe(campaign => {
			if (campaign) {
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

	saveCampaign() {
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

	cancel() {
		this.router.navigate(['/campaigns']);
	}
}
