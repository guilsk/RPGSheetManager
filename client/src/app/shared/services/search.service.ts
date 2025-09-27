import { Injectable } from '@angular/core';
import { SearchResult, SearchBarConfig } from '../models/search-bar.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  /**
   * Filtra e ordena itens baseado no termo de busca
   */
  search<T>(items: T[], searchTerm: string, config: SearchBarConfig<T>): SearchResult<T>[] {
    if (!searchTerm.trim()) {
      return items.map(item => ({
        item,
        highlightedText: this.getDisplayText(item, config),
        matchScore: 0
      }));
    }

    const results: SearchResult<T>[] = [];
    const term = config.caseSensitive ? searchTerm : searchTerm.toLowerCase();

    for (const item of items) {
      const text = this.getSearchText(item, config);
      const displayText = this.getDisplayText(item, config);

      const matchResult = this.findMatches(text, term, config.caseSensitive);

      if (matchResult.found) {
        const highlightedText = this.highlightMatches(displayText, matchResult.positions, term.length);

        results.push({
          item,
          highlightedText,
          matchScore: matchResult.score
        });
      }
    }

    // Ordena por score (maior score = melhor match)
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Limita resultados se configurado
    if (config.maxResults && config.maxResults > 0) {
      return results.slice(0, config.maxResults);
    }

    return results;
  }

  /**
   * Encontra todas as posições onde o termo aparece no texto
   */
  private findMatches(text: string, term: string, caseSensitive: boolean = false): { found: boolean; positions: number[]; score: number } {
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchTerm = caseSensitive ? term : term.toLowerCase();

    const positions: number[] = [];
    let startIndex = 0;
    let totalScore = 0;

    while (startIndex < searchText.length) {
      const index = searchText.indexOf(searchTerm, startIndex);
      if (index === -1) break;

      positions.push(index);

      // Calcula score baseado na posição
      // Início da palavra = score mais alto
      const positionScore = index === 0 ? 100 : Math.max(10, 50 - index);
      totalScore += positionScore;

      startIndex = index + 1;
    }

    // Bonus para matches exatos
    if (searchText === searchTerm) {
      totalScore += 200;
    }

    // Bonus para matches que começam com o termo
    if (searchText.startsWith(searchTerm)) {
      totalScore += 150;
    }

    return {
      found: positions.length > 0,
      positions,
      score: totalScore
    };
  }

  /**
   * Adiciona destaque (bold) nas partes que fazem match
   */
  private highlightMatches(text: string, positions: number[], termLength: number): string {
    if (positions.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    // Ordena posições para processar em ordem
    const sortedPositions = [...positions].sort((a, b) => a - b);

    for (const position of sortedPositions) {
      // Adiciona texto antes do match
      result += text.slice(lastIndex, position);

      // Adiciona o match com destaque
      const matchText = text.slice(position, position + termLength);
      result += `<strong class="search-highlight">${matchText}</strong>`;

      lastIndex = position + termLength;
    }

    // Adiciona o resto do texto
    result += text.slice(lastIndex);

    return result;
  }

  /**
   * Extrai o texto para busca do item
   */
  private getSearchText<T>(item: T, config: SearchBarConfig<T>): string {
    const value = item[config.searchProperty];
    return typeof value === 'string' ? value : String(value || '');
  }

  /**
   * Extrai o texto para exibição do item
   */
  private getDisplayText<T>(item: T, config: SearchBarConfig<T>): string {
    const property = config.displayProperty || config.searchProperty;
    const value = item[property];
    return typeof value === 'string' ? value : String(value || '');
  }
}
