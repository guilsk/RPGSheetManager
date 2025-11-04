import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Character } from '../../../shared/models/rpg-sheet-manager.model';
import { CharacterService } from '../../../shared/services/character.service';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SearchBarConfig } from '../../../shared/models/search-bar.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-character-selector',
	standalone: true,
	imports: [CommonModule, SearchBarComponent],
	templateUrl: './character-selector.component.html',
	styleUrl: './character-selector.component.scss'
})
export class CharacterSelectorComponent implements OnInit, OnChanges, OnDestroy {
	@Input() isVisible = false;
	@Input() systemId: string = '';
	@Output() characterSelected = new EventEmitter<Character>();
	@Output() closed = new EventEmitter<void>();

	private router = inject(Router);
	private characterService = inject(CharacterService);
	private currentUserService = inject(CurrentUserService);
	private destroy$ = new Subject<void>();

	availableCharacters: Character[] = [];
	filteredCharacters: Character[] = [];
	isLoading = false;
	currentUserId = '';

	searchConfig: SearchBarConfig<Character> = {
		placeholder: 'Buscar personagens...',
		searchProperty: 'name',
		debounceTime: 300,
		maxResults: 50,
		caseSensitive: false
	};

	public ngOnInit(): void {
		const currentUser = this.currentUserService.getCurrentUser();
		this.currentUserId = currentUser?.authId || '';

		if (this.isVisible) {
			this.loadCharacters();
		}
	}

	public ngOnChanges(): void {
		if (this.isVisible) {
			this.loadCharacters();
		}
	}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadCharacters(): void {
		if (!this.currentUserId) return;

		this.isLoading = true;
		this.characterService.getCharacters()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (characters: Character[]) => {
					// Filtrar apenas personagens do mesmo sistema
					this.availableCharacters = characters.filter(char => char.systemId === this.systemId);
					this.filteredCharacters = [...this.availableCharacters];
					this.isLoading = false;
				},
				error: (error) => {
					console.error('Erro ao carregar personagens:', error);
					this.isLoading = false;
				}
			});
	}

	public onSearchResults(filteredCharacters: Character[]): void {
		this.filteredCharacters = filteredCharacters;
	}

	public selectCharacter(character: Character): void {
		this.characterSelected.emit(character);
		this.close();
	}

	public createNewCharacter(): void {
		// Redirecionar para criação de personagem com sistema pré-definido
		this.router.navigate(['/characters/new'], {
			queryParams: { systemId: this.systemId }
		});
		this.close();
	}

	public getCharacterLevel(character: Character): string | null {
		// Procura por campo que pode representar nível
		const levelField = character.data?.find(field =>
			field.name?.toLowerCase().includes('nivel') ||
			field.name?.toLowerCase().includes('level') ||
			field.name?.toLowerCase().includes('lvl')
		);
		return levelField?.value || null;
	}

	public getCharacterClass(character: Character): string | null {
		// Procura por campo que pode representar classe
		const classField = character.data?.find(field =>
			field.name?.toLowerCase().includes('classe') ||
			field.name?.toLowerCase().includes('class') ||
			field.name?.toLowerCase().includes('profissao') ||
			field.name?.toLowerCase().includes('profession')
		);
		return classField?.value || null;
	}

	public close(): void {
		this.closed.emit();
	}

	public onBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.close();
		}
	}
}
