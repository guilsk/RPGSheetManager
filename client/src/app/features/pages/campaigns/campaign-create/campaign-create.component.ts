import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Campaign, RpgSystem, User } from '../../../../shared/models/rpg-sheet-manager.model';
import { SearchBarConfig } from '../../../../shared/models/search-bar.model';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { SystemService } from '../../../../shared/services/system.service';
import { UserService } from '../../../../shared/services/user.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CurrentUserService } from '../../../../shared/services/current-user.service';
import { MultiSelectSearchComponent } from '../../../components/multi-select-search/multi-select-search.component';

@Component({
	selector: 'app-campaign-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, MultiSelectSearchComponent],
	templateUrl: './campaign-create.component.html',
	styleUrl: './campaign-create.component.scss'
})
export class CampaignCreateComponent implements OnInit {
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
	public users: User[] = [];
	public userSearchConfig!: SearchBarConfig<User>;
	public isLoading = false;
	public loadingSystems = false;
	public loadingUsers = false;

	public ngOnInit(): void {
		this.initForm();
		this.setupUserSearchConfig();
		this.loadSystems();
		this.loadUsers();
	}

	private initForm(): void {
		this.campaignForm = this.fb.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			systemId: ['', Validators.required],
			description: [''],
			invitedPlayerIds: [[]]
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
				// Filtrar o usuário atual para que não apareça na busca
				const currentUser = this.currentUserService.getCurrentUser();
				if (currentUser?.authId) {
					this.users = users.filter(user => user.authId !== currentUser.authId);
				} else {
					this.users = users;
				}
				this.loadingUsers = false;
			},
			error: (error) => {
				console.error('Erro ao carregar usuários:', error);
				this.loadingUsers = false;
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
			invitedPlayerIds: formValue.invitedPlayerIds || [],
			characters: [],
			diceHistory: [],
			activeSession: false
		};

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

	public cancel(): void {
		this.router.navigate(['/campaigns']);
	}

	public goBack(): void {
		this.router.navigate(['/campaigns']);
	}
}
