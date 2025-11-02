import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterData, DynamicField, CampaignCharacter } from '../../../shared/models/rpg-sheet-manager.model';
import { DialogService } from '../../../shared/services/dialog.service';
import { DiceService } from '../../../shared/services/dice.service';

@Component({
	selector: 'app-character-view-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './character-view-modal.component.html',
	styleUrl: './character-view-modal.component.scss'
})
export class CharacterViewModalComponent implements OnInit {
	@Input() isVisible = false;
	@Input() character: Character | null = null;
	@Input() campaignData: DynamicField[] = []; // Dados de sessão da campanha
	@Output() closed = new EventEmitter<void>();

	private dialogService = inject(DialogService);
	private diceService = inject(DiceService);

	displayData: CharacterData[] = [];

	public ngOnInit(): void {
		if (this.character) {
			this.processCharacterData();
		}
	}

	public ngOnChanges(): void {
		if (this.character) {
			this.processCharacterData();
		}
	}

	private processCharacterData(): void {
		if (!this.character?.data) {
			this.displayData = [];
			return;
		}

		// Processar dados: combinar dados base com overrides de campanha
		this.displayData = this.character.data.map(baseField => {
			// Verificar se há override nos dados de campanha
			const campaignOverride = this.campaignData.find(
				campaignField => campaignField.name === baseField.name
			);

			if (campaignOverride) {
				// Usar dados da campanha (sessão) com indicação visual
				return {
					...baseField,
					value: campaignOverride.value,
					sessionModified: true // Flag para indicar modificação de sessão
				} as CharacterData & { sessionModified: boolean };
			}

			// Usar dados originais
			return {
				...baseField,
				sessionModified: false
			} as CharacterData & { sessionModified: boolean };
		});
	}

	public getCharacterLevel(): string | null {
		const levelField = this.displayData.find(field =>
			field.name?.toLowerCase().includes('nivel') ||
			field.name?.toLowerCase().includes('level') ||
			field.name?.toLowerCase().includes('lvl')
		);
		return levelField?.value || null;
	}

	public getCharacterClass(): string | null {
		const classField = this.displayData.find(field =>
			field.name?.toLowerCase().includes('classe') ||
			field.name?.toLowerCase().includes('class') ||
			field.name?.toLowerCase().includes('profissao') ||
			field.name?.toLowerCase().includes('profession')
		);
		return classField?.value || null;
	}

	public getFieldsByCategory(category: string): (CharacterData & { sessionModified: boolean })[] {
		return this.displayData.filter(field => field.category === category) as (CharacterData & { sessionModified: boolean })[];
	}

	public getAvailableCategories(): string[] {
		const categories = [...new Set(this.displayData.map(field => field.category).filter(Boolean))] as string[];
		return categories.length > 0 ? categories : ['Geral'];
	}

	public close(): void {
		this.closed.emit();
	}

	public onBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.close();
		}
	}

	public rollDice(field: CharacterData): void {
		if (!field.rollable?.enabled || !field.rollable.formula) {
			return;
		}

		try {
			// Criar mapa de valores de campos para substituição
			const fieldValues: { [key: string]: string } = {};
			this.displayData.forEach(f => {
				if (f.name) {
					fieldValues[f.name] = f.value || '0';
				}
			});

			// Usar o DiceService para rolar os dados
			const result = this.diceService.rollDice(field.rollable.formula, fieldValues);

			this.dialogService.success(
				`🎲 ${field.name}`,
				`${result.breakdown} = ${result.result}`
			);

		} catch (error) {
			console.error('Erro ao rolar dado:', error);
			this.dialogService.error('Erro', 'Não foi possível realizar a rolagem.');
		}
	}
}
