import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
	RpgSystem,
	CharacterData,
	ComponentType
} from '../../../../shared/models/rpg-sheet-manager.model';
import { DynamicFieldComponent } from '../../../components/dynamic-field/dynamic-field.component';
import { SystemService } from '../../../../shared/services/system.service';
import { UserService } from '../../../../shared/services/user.service';

@Component({
	selector: 'app-system-view',
	standalone: true,
	imports: [CommonModule, DynamicFieldComponent],
	templateUrl: './system-view.component.html',
	styleUrl: './system-view.component.scss'
})
export class SystemViewComponent implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private systemService = inject(SystemService);
	private userService = inject(UserService);

	public system?: RpgSystem;
	public systemData: CharacterData[] = [];
	public systemId?: string;
	public loading = false;
	public categorizedData: { [key: string]: CharacterData[] } = {};
	public categories: string[] = [];
	public ownerName: string = 'Carregando...'; // Cache para o nome do usuário

	public ngOnInit() {
		this.loadData();
	}

	private loadData() {
		this.systemId = this.route.snapshot.paramMap.get('id') || undefined;

		if (this.systemId) {
			this.loadSystem();
		}
	}

	private loadSystem() {
		if (!this.systemId) return;

		this.loading = true;

		this.systemService.getSystemById(this.systemId).subscribe({
			next: (system: RpgSystem | undefined) => {
				this.loading = false;
				if (system) {
					this.system = system;

					// Carregar o nome do dono do sistema
					if (system.ownerId && system.ownerId !== 'system-admin') {
						this.loadOwnerName(system.ownerId);
					}

					if (system.template) {
						// Criar dados do sistema com valores padrão para visualização
						this.systemData = system.template.map(field => ({
							...field,
							value: field.value || this.getDefaultValueForField(field),
							editable: false, // Sempre false para visualização
							visible: field.visible !== false
						}));

						this.organizeDataByCategory();
					}
				} else {
					this.router.navigate(['/systems']);
				}
			},
			error: (error) => {
				console.error('Erro ao carregar sistema:', error);
				this.loading = false;
				this.router.navigate(['/systems']);
			}
		});
	}

	private loadOwnerName(ownerId: string) {
		this.userService.getUserByAuthId(ownerId).subscribe({
			next: (user) => {
				this.ownerName = user.displayName || 'Usuário desconhecido';
			},
			error: () => {
				this.ownerName = 'Usuário desconhecido';
			}
		});
	}

	private getDefaultValueForField(field: CharacterData): string {
		switch (field.component) {
			case ComponentType.NUMERIC:
				return field.value || '0';
			case ComponentType.CHECKBOX:
				return field.value || 'false';
			case ComponentType.SELECT:
				// Para SELECT em modo preview, sempre retornar vazio para mostrar o placeholder
				return '';
			case ComponentType.TEXTAREA:
				return field.value || 'Este é um exemplo de texto longo para demonstração do campo.';
			case ComponentType.TEXT:
			default:
				return field.value || 'Exemplo';
		}
	}

	private organizeDataByCategory() {
		this.categorizedData = {};
		this.categories = [];

		if (!this.systemData || this.systemData.length === 0) {
			return;
		}

		const visibleData = this.systemData.filter(data => data.visible !== false);

		let categoryOrder: string[] = [];
		if (this.system?.categoryOrder && this.system.categoryOrder.length > 0) {
			categoryOrder = this.system.categoryOrder;
		} else {
			const uniqueCategories = new Set<string>();
			visibleData.forEach(data => {
				uniqueCategories.add(data.category || 'Geral');
			});
			categoryOrder = Array.from(uniqueCategories).sort();
		}

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

			return (a.order || 0) - (b.order || 0);
		});

		categoryOrder.forEach(category => {
			const categoryData = sortedData.filter(data => (data.category || 'Geral') === category);
			if (categoryData.length > 0) {
				this.categorizedData[category] = categoryData;
				this.categories.push(category);
			}
		});

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

	public getAllFieldValues(): { [key: string]: string } {
		const values: { [key: string]: string } = {};
		this.systemData.forEach(field => {
			if (field.name) {
				values[field.name] = field.value || '';
			}
		});
		return values;
	}

	public goBack() {
		this.router.navigate(['/systems']);
	}

	public getSystemFieldsCount(): number {
		return this.system?.template?.length || 0;
	}

	public getSystemCategoriesCount(): number {
		const categories = new Set(this.system?.template?.map(field => field.category).filter(Boolean));
		return categories.size;
	}

	public getOwnerDisplayName(): string {
		if (this.system?.ownerId === 'system-admin') {
			return 'Sistema';
		}
		return this.ownerName;
	}

	public isSelectField(field: CharacterData): boolean {
		return field.component === ComponentType.SELECT;
	}
}
