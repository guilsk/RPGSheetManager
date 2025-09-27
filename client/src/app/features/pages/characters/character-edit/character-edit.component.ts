import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
	Character,
	CharacterData,
	ComponentType,
	RpgSystem
} from '../../../../shared/models/rpg-sheet-manager.model';
import { DynamicFieldComponent } from '../../../components/dynamic-field/dynamic-field.component';
import { CharacterService } from '../../../../shared/services/character.service';
import { SystemService } from '../../../../shared/services/system.service';
import { DiceRollResult } from '../../../../shared/services/dice.service';

@Component({
	selector: 'app-character-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, DynamicFieldComponent],
	templateUrl: './character-edit.component.html',
	styleUrl: './character-edit.component.scss'
})
export class CharacterEditComponent implements OnInit {
	private fb = inject(FormBuilder);
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private characterService = inject(CharacterService);
	private systemService = inject(SystemService);
	private cdr = inject(ChangeDetectorRef);

	public characterForm!: FormGroup;
	public character: Character = {};
	public characterData: CharacterData[] = [];
	public systems: RpgSystem[] = [];
	public currentSystem?: RpgSystem;
	public isEditMode = false;
	public characterId?: string;
	public loadingSystems = false;
	public loadingTemplate = false;
	public categorizedData: { [key: string]: CharacterData[] } = {};
	public categories: string[] = [];

	public ngOnInit() {
		this.initializeForm();
		this.loadData();
	}

	private initializeForm() {
		this.characterForm = this.fb.group({
			name: ['', Validators.required],
			systemId: [{ value: '', disabled: false }, Validators.required]
		});
	}

	private loadData() {
		this.characterId = this.route.snapshot.paramMap.get('id') || undefined;
		this.isEditMode = !!this.characterId;

		if (!this.isEditMode) {
			this.character = {};
		}

		this.loadSystems();

		if (this.isEditMode) {
			this.loadCharacter();
		}
	}

	private loadSystems() {
		this.loadingSystems = true;
		this.characterForm.get('systemId')?.disable();

		this.systemService.getSavedSystems().subscribe({
			next: (systems: RpgSystem[]) => {
				this.systems = systems;
				this.loadingSystems = false;

				if (this.isEditMode) {
					this.characterForm.get('systemId')?.disable();
				} else {
					this.characterForm.get('systemId')?.enable();

					if (systems.length === 1) {
						this.characterForm.get('systemId')?.setValue(systems[0].id);
						this.onSystemChange(systems[0].id || '');
					}
				}
			},
			error: (error) => {
				console.error('Erro ao carregar sistemas:', error);
				this.systems = [];
				this.loadingSystems = false;
				if (!this.isEditMode) {
					this.characterForm.get('systemId')?.enable();
				}
			}
		});
	}

	private loadCharacter() {
		if (!this.characterId) return;

		this.characterService.getCharacterById(this.characterId).subscribe((character: Character | undefined) => {
			if (character) {
				this.character = character;
				this.characterForm.patchValue({
					name: character.name,
					systemId: character.systemId
				});

				this.characterData = character.data || [];

				// Carregar o sistema para ter acesso ao categoryOrder
				if (character.systemId) {
					this.systemService.getSystemById(character.systemId).subscribe({
						next: (system: RpgSystem | undefined) => {
							this.currentSystem = system;
							this.organizeDataByCategory();
						},
						error: (error) => {
							console.error('Erro ao carregar sistema do personagem:', error);
							this.organizeDataByCategory(); // Organizar sem o sistema
						}
					});
				} else {
					this.organizeDataByCategory();
				}
			}
		});
	}

	public onSystemChange(systemId: string) {
		if (!systemId) {
			this.characterData = [];
			this.categorizedData = {};
			this.categories = [];
			return;
		}

		this.loadingTemplate = true;

		this.systemService.getSystemById(systemId).subscribe({
			next: (selectedSystem: RpgSystem | undefined) => {
				this.loadingTemplate = false;
				this.currentSystem = selectedSystem;

				if (selectedSystem?.template) {
					this.characterData = selectedSystem.template.map(field => ({
						...field,
						value: field.value || '',
						editable: field.editable !== false,
						visible: field.visible !== false,
						edited: false
					}));

					this.organizeDataByCategory();
				} else {
					this.characterData = [];
					this.categorizedData = {};
					this.categories = [];
				}
			},
			error: (error) => {
				console.error('Erro ao buscar sistema:', error);
				this.characterData = [];
				this.categorizedData = {};
				this.categories = [];
				this.loadingTemplate = false;
			}
		});
	}

	public onSystemSelectionChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		if (target) {
			this.onSystemChange(target.value);
		}
	}

	private organizeDataByCategory() {
		this.categorizedData = {};
		this.categories = [];

		if (!this.characterData || this.characterData.length === 0) {
			return;
		}

		// Filtrar apenas campos visíveis
		const visibleData = this.characterData.filter(data => data.visible !== false);

		// Usar categoryOrder do sistema se disponível
		let categoryOrder: string[] = [];
		if (this.currentSystem?.categoryOrder && this.currentSystem.categoryOrder.length > 0) {
			categoryOrder = this.currentSystem.categoryOrder;
		} else {
			const uniqueCategories = new Set<string>();
			visibleData.forEach(data => {
				uniqueCategories.add(data.category || 'Geral');
			});
			categoryOrder = Array.from(uniqueCategories).sort();
		}

		// Ordenar dados por categoria (usando categoryOrder) e depois por order dentro da categoria
		const sortedData = [...visibleData].sort((a, b) => {
			const categoryA = a.category || 'Geral';
			const categoryB = b.category || 'Geral';

			if (categoryA !== categoryB) {
				const indexA = categoryOrder.indexOf(categoryA);
				const indexB = categoryOrder.indexOf(categoryB);

				if (indexA === -1 && indexB === -1) {
					return categoryA.localeCompare(categoryB);
				}
				if (indexA === -1) return 1;
				if (indexB === -1) return -1;

				return indexA - indexB;
			}

			// Depois por order dentro da categoria
			return (a.order || 0) - (b.order || 0);
		});

		// Organizar por categoria seguindo a ordem definida
		categoryOrder.forEach(category => {
			const categoryData = sortedData.filter(data => (data.category || 'Geral') === category);
			if (categoryData.length > 0) {
				this.categorizedData[category] = categoryData;
				this.categories.push(category);
			}
		});

		// Adicionar categorias que não estão no categoryOrder mas existem nos dados
		const remainingData = sortedData.filter(data => {
			const category = data.category || 'Geral';
			return !this.categories.includes(category);
		});

		if (remainingData.length > 0) {
			const remainingCategories = new Set<string>();
			remainingData.forEach(data => {
				remainingCategories.add(data.category || 'Geral');
			});

			Array.from(remainingCategories).sort().forEach(category => {
				const categoryData = remainingData.filter(data => (data.category || 'Geral') === category);
				this.categorizedData[category] = categoryData;
				this.categories.push(category);
			});
		}
	}

	public onFieldValueChange(fieldName: string, value: any) {
		const field = this.characterData.find(f => f.name === fieldName);
		if (field) {
			field.value = value;
			field.edited = true;
			this.processExpressions();
		}
	}

	public getAllFieldValues(): { [key: string]: string } {
		return this.characterService.getAllFieldValues(this.characterData);
	}

	public onSubmit() {
		if (this.characterForm.valid) {
			const characterToSave: Character = {
				...this.character,
				name: this.characterForm.value.name,
				systemId: this.characterForm.value.systemId,
				data: this.characterData
			};

			if (!this.isEditMode) {
				delete characterToSave.id;
			}

			if (this.isEditMode) {
				this.updateCharacter(characterToSave);
			} else {
				this.createCharacter(characterToSave);
			}
		}
	}

	public onCancel() {
		this.router.navigate(['/characters']);
	}

	public get isFormValid(): boolean {
		return this.characterForm.valid;
	}

	public get isSubmitDisabled(): boolean {
		return !this.isFormValid;
	}

	private processExpressions() {
		const updatedData = this.characterService.calculateExpressions(this.characterData);

		const hasChanges = updatedData.some((field, index) =>
			field.value !== this.characterData[index]?.value
		);

		if (hasChanges) {
			this.characterData = updatedData;
			this.organizeDataByCategory();
			this.cdr.detectChanges();
		}
	}

	private createCharacter(character: Character) {
		this.characterService.createCharacter(character).subscribe({
			next: () => {
				this.router.navigate(['/characters']);
			},
			error: (error) => {
				console.error('Erro ao criar personagem:', error);
			}
		});
	}

	private updateCharacter(character: Character) {
		this.characterService.updateCharacter(character).subscribe({
			next: () => {
				this.router.navigate(['/characters']);
			},
			error: (error) => {
				console.error('Erro ao atualizar personagem:', error);
			}
		});
	}
}
