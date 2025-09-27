import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SearchService } from '../../../shared/services/search.service';
import { SearchBarConfig, SearchResult } from '../../../shared/models/search-bar.model';

@Component({
	selector: 'app-search-bar',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './search-bar.component.html',
	styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent<T> implements OnInit, OnDestroy {
	private searchService = inject(SearchService);
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	@Input({ required: true }) items: T[] = [];
	@Input({ required: true }) config!: SearchBarConfig<T>;
	@Output() searchResultsEmit = new EventEmitter<T[]>();
	@Output() resultSelected = new EventEmitter<T>();
	@Output() searchTermChanged = new EventEmitter<string>();

	searchTerm = '';
	filteredItems: T[] = [];
	searchResultsData: SearchResult<T>[] = [];
	showResults = false;
	selectedIndex = -1;

	get searchResults(): SearchResult<T>[] {
		return this.searchResultsData;
	}

	ngOnInit() {
		this.initializeSearch();
		this.filteredItems = [...this.items];
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeSearch() {
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

	onSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		this.searchTerm = target.value;
		this.selectedIndex = -1;
		this.searchSubject.next(this.searchTerm);
		this.searchTermChanged.emit(this.searchTerm);
	}

	onFocus() {
		this.showResults = true;
		if (this.searchTerm) {
			this.performSearch(this.searchTerm);
		}
	}

	onBlur() {
		// Delay para permitir clique nos resultados
		setTimeout(() => {
			this.showResults = false;
		}, 150);
	}

	onKeyDown(event: KeyboardEvent) {
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

	private performSearch(term: string) {
		this.searchResultsData = this.searchService.search(this.items, term, this.config);
		this.filteredItems = this.searchResultsData.map(result => result.item);
		this.searchResultsEmit.emit(this.filteredItems);
		this.selectedIndex = -1;
	}

	selectResult(result: SearchResult<T>) {
		this.resultSelected.emit(result.item);
		this.showResults = false;
		this.selectedIndex = -1;
	}

	clearSearch() {
		this.searchTerm = '';
		this.searchSubject.next('');
		this.filteredItems = [...this.items];
		this.searchResultsEmit.emit(this.filteredItems);
		this.searchTermChanged.emit('');
		this.showResults = false;
	}

	trackByFn(index: number, result: SearchResult<T>): any {
		return index;
	}
}
