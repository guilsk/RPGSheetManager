import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SearchService } from '../../../shared/services/search.service';
import { SearchBarConfig, SearchResult } from '../../../shared/models/search-bar.model';

export interface MultiSelectItem<T> {
	item: T;
	displayText: string;
}

@Component({
	selector: 'app-multi-select-search',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './multi-select-search.component.html',
	styleUrls: ['./multi-select-search.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => MultiSelectSearchComponent),
			multi: true
		}
	]
})
export class MultiSelectSearchComponent<T> implements OnInit, OnDestroy, ControlValueAccessor {
	private searchService = inject(SearchService);
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	@Input({ required: true }) items: T[] = [];
	@Input({ required: true }) config!: SearchBarConfig<T>;
	@Input() placeholder = 'Buscar e selecionar...';
	@Input() noResultsText = 'Nenhum resultado encontrado';
	@Input() allowDuplicates = false;
	@Input() valueProperty?: keyof T; // Propriedade a ser usada como valor (ex: 'authId')
	@Output() selectionChanged = new EventEmitter<T[]>();

	public searchTerm = '';
	public selectedItems: MultiSelectItem<T>[] = [];
	public searchResultsData: SearchResult<T>[] = [];
	public showResults = false;
	public selectedIndex = -1;

	// ControlValueAccessor
	private onChange = (value: T[]) => {};
	private onTouched = () => {};

	public ngOnInit(): void {
		this.initializeSearch();
	}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	// ControlValueAccessor methods
	public writeValue(value: any[]): void {
		if (!value || !Array.isArray(value)) {
			this.selectedItems = [];
			return;
		}

		if (this.valueProperty) {
			// Se valueProperty foi definida, value contém IDs, precisa encontrar os objetos
			this.selectedItems = [];
			for (const id of value) {
				const item = this.items.find(item => (item as any)[this.valueProperty!] === id);
				if (item) {
					this.selectedItems.push(this.createMultiSelectItem(item));
				}
			}
		} else {
			// Comportamento anterior: value contém objetos completos
			this.selectedItems = value.map(item => this.createMultiSelectItem(item));
		}
	}

	public registerOnChange(fn: (value: T[]) => void): void {
		this.onChange = fn;
	}

	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	public setDisabledState(isDisabled: boolean): void {
		// Implementar se necessário
	}

	private initializeSearch(): void {
		const debounceMs = this.config.debounceTime ?? 300;

		this.searchSubject
			.pipe(
				debounceTime(debounceMs),
				distinctUntilChanged(),
				takeUntil(this.destroy$)
			)
			.subscribe(term => {
				this.performSearch(term);
			});
	}

	public onSearchInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		this.searchTerm = target.value;
		this.selectedIndex = -1;
		this.searchSubject.next(this.searchTerm);
		this.onTouched();
	}

	public onFocus(): void {
		this.showResults = true;
		if (this.searchTerm) {
			this.performSearch(this.searchTerm);
		}
	}

	public onBlur(): void {
		// Delay para permitir clique nos resultados
		setTimeout(() => {
			this.showResults = false;
		}, 150);
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (!this.showResults || this.searchResultsData.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				this.selectedIndex = Math.min(
					this.selectedIndex + 1,
					this.searchResultsData.length - 1
				);
				break;

			case 'ArrowUp':
				event.preventDefault();
				this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
				break;

			case 'Enter':
				event.preventDefault();
				if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResultsData.length) {
					this.selectResult(this.searchResultsData[this.selectedIndex]);
				}
				break;

			case 'Escape':
				this.showResults = false;
				this.selectedIndex = -1;
				break;
		}
	}

	private performSearch(term: string): void {
		if (!term.trim()) {
			this.searchResultsData = [];
			return;
		}

		const allResults = this.searchService.search(this.items, term, this.config);

		// Filtrar resultados já selecionados se não permitir duplicatas
		if (!this.allowDuplicates) {
			const selectedItemsSet = new Set(this.selectedItems.map(si => this.getItemKey(si.item)));
			this.searchResultsData = allResults.filter(result =>
				!selectedItemsSet.has(this.getItemKey(result.item))
			);
		} else {
			this.searchResultsData = allResults;
		}

		this.selectedIndex = -1;
	}

	public selectResult(result: SearchResult<T>): void {
		const multiSelectItem = this.createMultiSelectItem(result.item);

		// Verificar duplicatas
		if (!this.allowDuplicates && this.isItemAlreadySelected(result.item)) {
			return;
		}

		this.selectedItems.push(multiSelectItem);
		this.searchTerm = '';
		this.showResults = false;
		this.selectedIndex = -1;

		this.emitChange();
	}

	public removeItem(index: number): void {
		if (index >= 0 && index < this.selectedItems.length) {
			this.selectedItems.splice(index, 1);
			this.emitChange();
		}
	}

	public clearAll(): void {
		this.selectedItems = [];
		this.searchTerm = '';
		this.showResults = false;
		this.emitChange();
	}

	private createMultiSelectItem(item: T): MultiSelectItem<T> {
		const displayProperty = this.config.displayProperty || this.config.searchProperty;
		const displayText = String((item as any)[displayProperty] || '');

		return {
			item,
			displayText
		};
	}

	private isItemAlreadySelected(item: T): boolean {
		if (!item || !this.selectedItems.length) return false;

		const itemKey = this.getItemKey(item);
		if (!itemKey) return false;

		return this.selectedItems.some(si => {
			const selectedKey = this.getItemKey(si.item);
			return selectedKey && selectedKey === itemKey;
		});
	}

	private getItemKey(item: T): string {
		if (!item) return '';

		// Usar uma propriedade única como 'id' ou 'authId' se disponível
		const keyProperty = 'authId' in (item as any) ? 'authId' : 'id';
		const keyValue = (item as any)[keyProperty];

		if (keyValue) {
			return String(keyValue);
		}

		// Fallback para searchProperty
		const searchProperty = this.config?.searchProperty;
		if (searchProperty) {
			return String((item as any)[searchProperty] || '');
		}

		return '';
	}

	private emitChange(): void {
		let selectedValues: any[];

		if (this.valueProperty) {
			// Se valueProperty foi especificada, retorna apenas essa propriedade
			selectedValues = this.selectedItems.map(si => (si.item as any)[this.valueProperty!]);
		} else {
			// Senão, retorna o objeto completo (comportamento anterior)
			selectedValues = this.selectedItems.map(si => si.item);
		}

		this.onChange(selectedValues);
		this.selectionChanged.emit(selectedValues);
	}

	public trackByFn(index: number, result: SearchResult<T>): any {
		return index;
	}

	public trackBySelected(index: number, item: MultiSelectItem<T>): any {
		try {
			return this.getItemKey(item.item);
		} catch (error) {
			return index; // Fallback para index se der erro
		}
	}
}
