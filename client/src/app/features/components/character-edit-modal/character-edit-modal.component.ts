import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterData, DynamicField } from '../../../shared/models/rpg-sheet-manager.model';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { CampaignService } from '../../../shared/services/campaign.service';

@Component({
	selector: 'app-character-edit-modal',
	standalone: true,
	imports: [CommonModule, DynamicFieldComponent],
	templateUrl: './character-edit-modal.component.html',
	styleUrl: './character-edit-modal.component.scss'
})
export class CharacterEditModalComponent implements OnInit, OnChanges {
	@Input() isVisible = false;
	@Input() character: Character | null = null;
	@Input() campaignId: string = '';
	@Input() campaignData: DynamicField[] = []; // Dados de sessão da campanha
	@Input() campaignActive: boolean = false;
	@Input() currentUserId: string = '';
	@Input() ownerId: string = '';
	@Output() closed = new EventEmitter<void>();
	@Output() saved = new EventEmitter<DynamicField[]>();

	private dialogService = inject(DialogService);
	private campaignService = inject(CampaignService);

	editableFields: CharacterData[] = [];
	fieldValues: { [key: string]: string } = {};
	allFieldValues: { [key: string]: string } = {};
	isSaving = false;

	get canEdit(): boolean {
		// Remover validação de sessão ativa temporariamente para debug
		return this.currentUserId === this.ownerId;
	}

	public ngOnInit(): void {
		if (this.character) {
			this.processCharacterData();
		}
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (changes['character'] && this.character) {
			this.processCharacterData();
		}
	}

	private processCharacterData(): void {
		if (!this.character?.data) {
			this.editableFields = [];
			return;
		}

		// Filtrar apenas campos sessionEditable
		this.editableFields = this.character.data.filter(field => field.sessionEditable);

		// Inicializar valores dos campos editáveis com overrides de campanha (se houver)
		this.fieldValues = {};
		this.editableFields.forEach(field => {
			if (!field.name) return;

			const campaignOverride = this.campaignData.find(
				campaignField => campaignField.name === field.name
			);

			if (campaignOverride) {
				this.fieldValues[field.name] = campaignOverride.value || '';
			} else {
				this.fieldValues[field.name] = field.value || '';
			}
		});

		// Mapa de todos os valores para cálculos de expressões
		this.allFieldValues = {};
		this.character.data.forEach(field => {
			if (!field.name) return;

			const campaignOverride = this.campaignData.find(
				campaignField => campaignField.name === field.name
			);
			this.allFieldValues[field.name] = campaignOverride?.value || field.value || '';
		});
	}

	public getFieldsByCategory(category: string): CharacterData[] {
		return this.editableFields.filter(field => field.category === category);
	}

	public getAvailableCategories(): string[] {
		const categories = [...new Set(this.editableFields.map(field => field.category).filter(Boolean))] as string[];
		return categories.length > 0 ? categories : ['Geral'];
	}

	public onFieldValueChange(fieldName: string, value: any): void {
		this.fieldValues[fieldName] = value;
		this.allFieldValues[fieldName] = value;
	}

	public close(): void {
		this.closed.emit();
	}

	public onBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.close();
		}
	}

	public async save(): Promise<void> {
		if (!this.canEdit) {
			this.dialogService.error('Erro', 'Você não tem permissão para editar este personagem.');
			return;
		}

		if (!this.character?.id) {
			this.dialogService.error('Erro', 'Personagem não encontrado.');
			return;
		}

		// Montar lista de DynamicFields apenas com campos que foram modificados
		const dynamicData: DynamicField[] = [];

		this.editableFields.forEach(field => {
			if (!field.name) return;

			const currentValue = this.fieldValues[field.name];
			const originalValue = field.value || '';

			// Adicionar ao dynamicData se o valor foi alterado OU se já existia override
			const hasOverride = this.campaignData.some(cf => cf.name === field.name);

			if (currentValue !== originalValue || hasOverride) {
				dynamicData.push({
					name: field.name,
					value: String(currentValue || '')
				});
			}
		});

		this.isSaving = true;

		this.campaignService.saveCampaignCharacterData(
			this.campaignId,
			this.character.id,
			this.currentUserId,
			dynamicData
		).subscribe({
			next: (success) => {
				this.isSaving = false;
				if (success) {
					this.dialogService.success('Sucesso', 'Dados do personagem atualizados com sucesso!');
					this.saved.emit(dynamicData);
					this.close();
				} else {
					this.dialogService.error('Erro', 'Não foi possível salvar os dados. Verifique se a sessão está ativa.');
				}
			},
			error: (error) => {
				this.isSaving = false;
				console.error('Erro ao salvar dados:', error);

				let errorMessage = 'Ocorreu um erro ao salvar os dados.';
				if (error.error?.errors) {
					// Validation errors do ASP.NET Core
					const validationErrors = Object.entries(error.error.errors)
						.map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
						.join('\n');
					errorMessage = `Erros de validação:\n${validationErrors}`;
				} else if (error.error?.message) {
					errorMessage = error.error.message;
				} else if (typeof error.error === 'string') {
					errorMessage = error.error;
				}

				this.dialogService.error('Erro', errorMessage);
			}
		});
	}

	public getFieldWithValue(field: CharacterData): CharacterData {
		if (!field.name) return field;

		return {
			...field,
			value: this.fieldValues[field.name] || field.value
		};
	}
}
