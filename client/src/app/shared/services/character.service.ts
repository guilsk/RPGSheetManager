import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, of, switchMap, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '@auth0/auth0-angular';
import { Character, CharacterData } from '../models/rpg-sheet-manager.model';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class CharacterService {
	private apiUrl = `${environment.apiUrl}/character`;
	private charactersSubject = new BehaviorSubject<Character[]>([]);
	public characters$ = this.charactersSubject.asObservable();

	constructor(private http: HttpClient, private auth: AuthService) {
		this.loadCharacters();
	}

	public getCharacters(): Observable<Character[]> {
		return this.http.get<Character[]>(this.apiUrl).pipe(
			catchError(error => {
				console.error('Erro ao buscar personagens:', error);
				return of([]);
			})
		);
	}

	public getCharacterById(id: string): Observable<Character | undefined> {
		return this.http.get<Character>(`${this.apiUrl}/${id}`).pipe(
			catchError(error => {
				console.error('Erro ao buscar personagem:', error);
				return of(undefined);
			})
		);
	}

	public createCharacter(character: Character): Observable<Character> {
		return this.auth.user$.pipe(
			switchMap(user => {
				const characterWithUser = {
					...character,
					userId: user?.sub || ''
				};

				const characterToCreate = this.prepareCharacterForApi(characterWithUser);

				return this.http.post<Character>(this.apiUrl, characterToCreate).pipe(
					tap(createdCharacter => {
						const currentCharacters = this.charactersSubject.value;
						this.charactersSubject.next([...currentCharacters, createdCharacter]);
					})
				);
			})
		);
	}

	public updateCharacter(character: Character): Observable<Character> {
		return this.auth.user$.pipe(
			take(1),
			switchMap((user: User | null | undefined) => {
				const characterWithUser = {
					...character,
					userId: user?.sub || character.userId || ''
				};

				const characterToUpdate = this.prepareCharacterForApi(characterWithUser);

				return this.http.put<Character>(`${this.apiUrl}/${character.id}`, characterToUpdate).pipe(
					tap(() => {
						const currentCharacters = this.charactersSubject.value;
						const index = currentCharacters.findIndex((c: Character) => c.id === character.id);
						if (index !== -1) {
							currentCharacters[index] = characterWithUser;
							this.charactersSubject.next([...currentCharacters]);
						}
					}),
					map(() => characterWithUser),
					catchError(error => {
						console.error('Erro ao atualizar personagem:', error);
						if (error.error?.errors) {
							console.error('Erros de validação:', error.error.errors);
						}
						throw error;
					})
				);
			})
		);
	}

	public deleteCharacter(id: string): Observable<boolean> {
		return this.http.delete(`${this.apiUrl}/${id}`).pipe(
			tap(() => {
				const currentCharacters = this.charactersSubject.value;
				const filteredCharacters = currentCharacters.filter((c: Character) => c.id !== id);
				this.charactersSubject.next(filteredCharacters);
			}),
			map(() => true),
			catchError(error => {
				console.error('Erro ao deletar personagem:', error);
				return of(false);
			})
		);
	}

	public calculateExpressions(data: CharacterData[]): CharacterData[] {
		const processedData = data.map(field => ({ ...field }));
		let hasChanges = true;
		let iterations = 0;
		const maxIterations = 10;

		while (hasChanges && iterations < maxIterations) {
			hasChanges = false;
			iterations++;

			processedData.forEach(field => {
				if (field.expression && field.editable !== true) {
					let expression = field.expression;
					const originalValue = field.value;

					processedData.forEach(otherField => {
						if (otherField.name && otherField.value !== undefined && otherField.value !== '') {
							const regex = new RegExp(`{${otherField.name}}`, 'g');
							expression = expression.replace(regex, otherField.value);
						}
					});

					if (!expression.includes('{')) {
						try {
							const result = this.evaluateSimpleExpression(expression);
							const newValue = result.toString();

							if (newValue !== originalValue) {
								field.value = newValue;
								hasChanges = true;
							}
						} catch (e) {
							console.warn('Erro ao processar expressão:', expression, e);
						}
					}
				}
			});
		}

		return processedData;
	}

	public getAllFieldValues(data: CharacterData[]): { [key: string]: string } {
		const fieldValues: { [key: string]: string } = {};
		data.forEach(field => {
			if (field.name) {
				fieldValues[field.name] = field.value || '';
			}
		});
		return fieldValues;
	}

	public processFieldFormula(formula: string, fieldValues: { [key: string]: string }): string {
		let processedFormula = formula;

		Object.entries(fieldValues).forEach(([fieldName, fieldValue]) => {
			const regex = new RegExp(`{${fieldName}}`, 'g');
			processedFormula = processedFormula.replace(regex, fieldValue || '0');
		});

		return processedFormula;
	}

	private loadCharacters() {
		this.getCharacters().subscribe({
			next: (characters) => this.charactersSubject.next(characters),
			error: (error) => {
				console.error('Erro ao carregar personagens:', error);
				this.charactersSubject.next([]);
			}
		});
	}

	private prepareCharacterForApi(character: Character): any {
		const payload: any = {
			name: character.name?.trim() || '',
			systemId: character.systemId?.trim() || '',
			userId: character.userId?.trim() || '',
			data: character.data?.map(field => ({
				name: field.name?.trim() || '',
				value: (field.value !== null && field.value !== undefined) ? String(field.value) : '',
				rollable: field.rollable || null,
				expression: field.expression || '',
				editable: field.editable || false,
				edited: field.edited || false,
				sessionEditable: field.sessionEditable || false,
				visible: field.visible !== false,
				category: field.category || '',
				component: field.component?.trim() || '',
				order: field.order || 0,
				options: field.options || []
			})) || []
		};

		return payload;
	}

	private evaluateSimpleExpression(expression: string): number {
		const sanitized = expression.trim();

		const dangerousPattern = /[;&|`${}]/;

		if (dangerousPattern.test(sanitized)) {
			throw new Error('Expressão contém caracteres perigosos');
		}

		try {
			// Cria um contexto seguro com as funções Math disponíveis
			const safeContext = {
				Math: Math,
				parseInt: parseInt,
				parseFloat: parseFloat,
				Number: Number,
				isNaN: isNaN,
				isFinite: isFinite
			};

			// Usa Function constructor com contexto controlado
			const func = new Function(...Object.keys(safeContext), `return ${sanitized}`);
			const result = func(...Object.values(safeContext));

			// Converte o resultado para número se possível
			if (typeof result === 'number' && !isNaN(result)) {
				return result;
			} else if (typeof result === 'string' && !isNaN(Number(result))) {
				return Number(result);
			} else if (typeof result === 'boolean') {
				return result ? 1 : 0;
			}

			return 0;
		} catch (error) {
			return 0;
		}
	}
}
