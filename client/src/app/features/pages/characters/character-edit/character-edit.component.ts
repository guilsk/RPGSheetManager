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
import { CharacterService } from '../../../services/character.service';
import { SystemService } from '../../../services/system.service';
import { DiceRollResult } from '../../../services/dice.service';

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

	characterForm!: FormGroup;
	character: Character = {};
	characterData: CharacterData[] = [];
	systems: RpgSystem[] = [];
	currentSystem?: RpgSystem;
	isEditMode = false;
	characterId?: string;

	// Estados de loading
	loadingSystems = false;
	loadingTemplate = false;

	// Categorias organizadas
	categorizedData: { [key: string]: CharacterData[] } = {};
	categories: string[] = [];

	ngOnInit() {
		this.initializeForm();
		this.loadData();
	}

	private initializeForm() {
		this.characterForm = this.fb.group({
			name: ['', Validators.required],
			systemId: [{value: '', disabled: false}, Validators.required]
		});
	}

	private loadData() {
		// Verificar se é modo de edição
		this.characterId = this.route.snapshot.paramMap.get('id') || undefined;
		this.isEditMode = !!this.characterId;

		// Carregar sistemas disponíveis
		this.loadSystems();

		if (this.isEditMode) {
			this.loadCharacter();
		}
	}

	private loadSystems() {
		console.log('Carregando sistemas disponíveis...');
		this.loadingSystems = true;

		this.characterForm.get('systemId')?.disable();

		this.systemService.getSystems().subscribe({
			next: (systems: RpgSystem[]) => {
				console.log('Sistemas carregados:', systems);
				this.systems = systems;
				this.loadingSystems = false;

				this.characterForm.get('systemId')?.enable();

				if (systems.length === 0) {
					console.warn('Nenhum sistema encontrado no banco de dados');
				}
			},
			error: (error) => {
				console.error('Erro ao carregar sistemas:', error);
				this.systems = [];
				this.loadingSystems = false;

				this.characterForm.get('systemId')?.enable();
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

	onSystemChange(systemId: string) {
		if (!systemId) {
			console.log('Sistema desmarcado, limpando dados');
			this.characterData = [];
			this.categorizedData = {};
			this.categories = [];
			return;
		}

		console.log('Sistema selecionado:', systemId);
		this.loadingTemplate = true;

		this.systemService.getSystemById(systemId).subscribe({
			next: (selectedSystem: RpgSystem | undefined) => {
				this.loadingTemplate = false;
				this.currentSystem = selectedSystem; // Armazenar o sistema atual

				if (selectedSystem?.template) {
					console.log('Template do sistema carregado:', selectedSystem.template);

					// Criar uma cópia profunda do template para evitar mutações
					this.characterData = selectedSystem.template.map(field => ({
						...field,
						// Garantir que todos os campos tenham valores padrão
						value: field.value || '',
						editable: field.editable !== false, // padrão true
						visible: field.visible !== false, // padrão true
						edited: false // sempre iniciar como não editado
					}));

					this.organizeDataByCategory();
					console.log('Dados organizados por categoria:', this.categorizedData);
				} else {
					console.warn('Sistema encontrado mas sem template:', selectedSystem);
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

	onSystemSelectionChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		if (target) {
			this.onSystemChange(target.value);
		}
	}

	private organizeDataByCategory() {
		this.categorizedData = {};
		this.categories = [];

		if (!this.characterData || this.characterData.length === 0) {
			console.log('Nenhum dado de personagem para organizar');
			return;
		}

		// Filtrar apenas campos visíveis
		const visibleData = this.characterData.filter(data => data.visible !== false);

		// Usar categoryOrder do sistema se disponível
		let categoryOrder: string[] = [];
		if (this.currentSystem?.categoryOrder && this.currentSystem.categoryOrder.length > 0) {
			categoryOrder = this.currentSystem.categoryOrder;
			console.log('Usando ordem de categorias do sistema:', categoryOrder);
		} else {
			// Fallback: coletar categorias únicas dos dados e ordenar alfabeticamente
			const uniqueCategories = new Set<string>();
			visibleData.forEach(data => {
				uniqueCategories.add(data.category || 'Geral');
			});
			categoryOrder = Array.from(uniqueCategories).sort();
			console.log('Usando ordem alfabética das categorias:', categoryOrder);
		}

		// Ordenar dados por categoria (usando categoryOrder) e depois por order dentro da categoria
		const sortedData = [...visibleData].sort((a, b) => {
			const categoryA = a.category || 'Geral';
			const categoryB = b.category || 'Geral';

			if (categoryA !== categoryB) {
				// Usar a ordem definida no categoryOrder
				const indexA = categoryOrder.indexOf(categoryA);
				const indexB = categoryOrder.indexOf(categoryB);

				// Se uma categoria não está no categoryOrder, colocar no final
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

		console.log('Categorias organizadas:', this.categories);
		console.log('Dados categorizados:', this.categorizedData);
	} onFieldValueChange(fieldName: string, value: any) {
		const field = this.characterData.find(f => f.name === fieldName);
		if (field) {
			field.value = value;
			field.edited = true; // Marcar como editado (alinhado com backend)

			// Processar expressões se existirem
			this.processExpressions();
		}
	}

	private processExpressions() {
		console.log('Processando expressões...');
		const updatedData = this.characterService.calculateExpressions(this.characterData);
		
		// Verificar se houve mudanças
		const hasChanges = updatedData.some((field, index) => 
			field.value !== this.characterData[index]?.value
		);
		
		if (hasChanges) {
			console.log('Detectadas mudanças nos valores, atualizando interface...');
			this.characterData = updatedData;
			this.organizeDataByCategory();
			this.cdr.detectChanges(); // Forçar detecção de mudanças
		} else {
			console.log('Nenhuma mudança detectada nos valores');
		}
	}

	onSubmit() {
		if (this.characterForm.valid) {
			const characterToSave: Character = {
				...this.character,
				name: this.characterForm.value.name,
				systemId: this.characterForm.value.systemId,
				data: this.characterData
			};

			if (this.isEditMode) {
				this.updateCharacter(characterToSave);
			} else {
				this.createCharacter(characterToSave);
			}
		}
	}

	private createCharacter(character: Character) {
		this.characterService.createCharacter(character).subscribe({
			next: (createdCharacter) => {
				console.log('Personagem criado:', createdCharacter);
				this.router.navigate(['/characters']);
			},
			error: (error) => {
				console.error('Erro ao criar personagem:', error);
				// TODO: Implementar tratamento de erro
			}
		});
	}

	private updateCharacter(character: Character) {
		this.characterService.updateCharacter(character).subscribe({
			next: (updatedCharacter) => {
				console.log('Personagem atualizado:', updatedCharacter);
				this.router.navigate(['/characters']);
			},
			error: (error) => {
				console.error('Erro ao atualizar personagem:', error);
				// TODO: Implementar tratamento de erro
			}
		});
	}

	onCancel() {
		this.router.navigate(['/characters']);
	}

	getAllFieldValues(): { [key: string]: string } {
		const values: { [key: string]: string } = {};
		this.characterData.forEach(field => {
			if (field.name && field.value) {
				values[field.name] = field.value;
			}
		});
		return values;
	}

	onDiceRoll(result: DiceRollResult) {
		// TODO: Implementar histórico de rolagens ou mostrar resultado em um toast
		console.log('🎲 Resultado da rolagem:', result);
	}

	get isFormValid(): boolean {
		return this.characterForm.valid;
	}

	get isSubmitDisabled(): boolean {
		return !this.isFormValid;
	}
}
