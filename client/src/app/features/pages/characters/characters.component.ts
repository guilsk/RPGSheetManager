import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Character, CharacterData } from '../../../shared/models/rpg-sheet-manager.model';
import { CharacterService } from '../../../shared/services/character.service';
import { SystemService } from '../../../shared/services/system.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { SearchBarConfig } from '../../../shared/models/search-bar.model';

@Component({
	selector: 'app-characters',
	standalone: true,
	imports: [CommonModule, RouterModule, SearchBarComponent],
	templateUrl: './characters.component.html',
	styleUrl: './characters.component.scss'
})
export class CharactersComponent implements OnInit {
	private characterService = inject(CharacterService);
	private systemService = inject(SystemService);
	private dialogService = inject(DialogService);

	characters: Character[] = [];
	filteredCharacters: Character[] = [];
	systems: { [key: string]: string } = {};

	searchConfig: SearchBarConfig<Character> = {
		placeholder: 'Buscar personagens...',
		searchProperty: 'name',
		debounceTime: 300,
		maxResults: 10,
		caseSensitive: false
	};

	public ngOnInit(): void {
		this.loadCharacters();
		this.loadSystems();
	}

	private loadCharacters(): void {
		this.characterService.getCharacters().subscribe((characters: Character[]) => {
			this.characters = characters;
			this.filteredCharacters = [...characters];
		});
	}

	public onSearchResults(filteredCharacters: Character[]): void {
		this.filteredCharacters = filteredCharacters;
	}

	private loadSystems(): void {
		this.systemService.getSystems().subscribe((systems: any[]) => {
			systems.forEach((system: any) => {
				if (system.id && system.name) {
					this.systems[system.id] = system.name;
				}
			});
		});
	}

	public getCharacterLevel(character: Character): string {
		const levelField = character.data?.find(d => d.name?.toLowerCase().includes('nível') || d.name?.toLowerCase().includes('nivel'));
		if (levelField?.value) {
			return `Nível ${levelField.value}`;
		}

		const classField = character.data?.find(d =>
			d.name?.toLowerCase().includes('classe') ||
			d.name?.toLowerCase().includes('ocupação') ||
			d.name?.toLowerCase().includes('ocupacao')
		);
		return classField?.value || 'Personagem';
	}

	public getSystemName(systemId?: string): string {
		return systemId ? this.systems[systemId] || 'Sistema Desconhecido' : 'Sem Sistema';
	}

	public getMainStats(character: Character): CharacterData[] {
		// Não mostrar atributos específicos nos cards - apenas informações básicas
		return [];
	}

	public async deleteCharacter(character: Character): Promise<void> {
		if (!character.id) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Excluir Personagem',
			`Você está prestes a apagar o personagem "${character.name}". Esta decisão é definitiva... nem mesmo a magia pode trazê-lo de volta no tempo para salvá-lo. Deseja realmente prosseguir?`,
			'Excluir Personagem'
		);

		if (!confirmed) return;

		this.characterService.deleteCharacter(character.id).subscribe({
			next: (success) => {
				if (success) {
					// Remover da lista principal
					this.characters = this.characters.filter(c => c.id !== character.id);
					// Remover também da lista filtrada para atualização imediata na tela
					this.filteredCharacters = this.filteredCharacters.filter(c => c.id !== character.id);
				} else {
					this.dialogService.error('Erro', 'Erro ao excluir personagem. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao excluir personagem:', error);
				this.dialogService.error('Erro', 'Erro ao excluir personagem. Tente novamente.');
			}
		});
	}
}
