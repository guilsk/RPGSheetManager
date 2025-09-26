import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Character, CharacterData } from '../../../shared/models/rpg-sheet-manager.model';
import { CharacterService } from '../../services/character.service';
import { SystemService } from '../../services/system.service';
import { DialogService } from '../../services/dialog.service';

@Component({
	selector: 'app-characters',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './characters.component.html',
	styleUrl: './characters.component.scss'
})
export class CharactersComponent implements OnInit {
	private characterService = inject(CharacterService);
	private systemService = inject(SystemService);
	private dialogService = inject(DialogService);

	characters: Character[] = [];
	systems: { [key: string]: string } = {};

	ngOnInit() {
		this.loadCharacters();
		this.loadSystems();
	}

	private loadCharacters() {
		this.characterService.getCharacters().subscribe((characters: Character[]) => {
			this.characters = characters;
		});
	}

	private loadSystems() {
		this.systemService.getSystems().subscribe((systems: any[]) => {
			systems.forEach((system: any) => {
				if (system.id && system.name) {
					this.systems[system.id] = system.name;
				}
			});
		});
	}

	getCharacterLevel(character: Character): string {
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

	getSystemName(systemId?: string): string {
		return systemId ? this.systems[systemId] || 'Sistema Desconhecido' : 'Sem Sistema';
	}

	getMainStats(character: Character): CharacterData[] {
		if (!character.data) return [];

		// Pegar os primeiros 3 atributos numéricos visíveis
		return character.data
			.filter(d => d.visible && d.component?.includes('numeric'))
			.sort((a, b) => (a.order || 0) - (b.order || 0))
			.slice(0, 3);
	}

	public async deleteCharacter(character: Character) {
		if (!character.id) return;
		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Excluir Personagem',
			`Você está prestes a apagar o personagem "${character.name}". Esta decisão é definitiva... nem mesmo a magia pode trazê-lo de volta no tempo para salvá-lo. Deseja realmente prosseguir?`,
			'Excluir Personagem'
		);
		if (!confirmed) return;
		this.characterService.deleteCharacter(character.id).subscribe(success => {
			if (success) {
				this.characters = this.characters.filter(c => c.id !== character.id);
				this.dialogService.success('Sucesso', 'Personagem excluído com sucesso.');
			} else {
				this.dialogService.error('Erro', 'Erro ao excluir personagem. Tente novamente.');
			}
		});
	}
}
