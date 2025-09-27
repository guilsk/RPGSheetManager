export interface SearchBarConfig<T> {
  placeholder: string;
  searchProperty: keyof T;
  displayProperty?: keyof T;
  debounceTime?: number;
  maxResults?: number;
  caseSensitive?: boolean;
}

export interface SearchResult<T> {
  item: T;
  highlightedText: string;
  matchScore: number;
}
