import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Character, CharacterData } from '../../shared/models/rpg-sheet-manager.model';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {
    private apiUrl = 'https://localhost:7111/api/character';
    private charactersSubject = new BehaviorSubject<Character[]>([]);
    public characters$ = this.charactersSubject.asObservable();

    constructor(private http: HttpClient) {
        // Carregar personagens ao inicializar o serviço
        this.loadCharacters();
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

    getCharacters(): Observable<Character[]> {
        return this.http.get<Character[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Erro ao buscar personagens:', error);
                return of([]); // Retorna array vazio em caso de erro
            })
        );
    }

    getCharacterById(id: string): Observable<Character | undefined> {
        return this.http.get<Character>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Erro ao buscar personagem:', error);
                return of(undefined);
            })
        );
    }

    createCharacter(character: Character): Observable<Character> {
        // Preparar dados para envio (remover campos opcionais vazios)
        const characterToCreate = this.prepareCharacterForApi(character);

        return this.http.post<Character>(this.apiUrl, characterToCreate).pipe(
            tap(createdCharacter => {
                // Atualizar lista local
                const currentCharacters = this.charactersSubject.value;
                this.charactersSubject.next([...currentCharacters, createdCharacter]);
            }),
            catchError(error => {
                console.error('Erro ao criar personagem:', error);
                throw error;
            })
        );
    }

    updateCharacter(character: Character): Observable<Character> {
        if (!character.id) {
            throw new Error('ID do personagem é obrigatório para atualização');
        }

        const characterToUpdate = this.prepareCharacterForApi(character);

        return this.http.put<Character>(`${this.apiUrl}/${character.id}`, characterToUpdate).pipe(
            tap(() => {
                // Atualizar lista local
                const currentCharacters = this.charactersSubject.value;
                const index = currentCharacters.findIndex((c: Character) => c.id === character.id);
                if (index !== -1) {
                    currentCharacters[index] = character;
                    this.charactersSubject.next([...currentCharacters]);
                }
            }),
            map(() => character), // A API retorna NoContent, então retornamos o personagem
            catchError(error => {
                console.error('Erro ao atualizar personagem:', error);
                throw error;
            })
        );
    }

    deleteCharacter(id: string): Observable<boolean> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                // Remover da lista local
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

    private prepareCharacterForApi(character: Character): any {
        // Converter para o formato esperado pela API
        return {
            id: character.id,
            systemId: character.systemId,
            userId: character.userId,
            name: character.name,
            data: character.data?.map(field => ({
                name: field.name,
                value: field.value || '',
                rollable: field.rollable ? {
                    enabled: field.rollable.enabled || false,
                    formula: field.rollable.formula || ''
                } : null,
                expression: field.expression || '',
                editable: field.editable || false,
                edited: field.edited || false,
                sessionEditable: field.sessionEditable || false,
                visible: field.visible || true,
                category: field.category || '',
                component: field.component || 'text',
                order: field.order || 0
            })) || []
        };
    }

    // Método para calcular valores baseados em expressões
    calculateExpressions(data: CharacterData[]): CharacterData[] {
        const processedData = [...data];

        processedData.forEach(field => {
            if (field.expression && !field.edited) {
                let expression = field.expression;

                // Substituir referências a outros campos
                processedData.forEach(otherField => {
                    if (otherField.name && otherField.value) {
                        const regex = new RegExp(`{${otherField.name}}`, 'g');
                        expression = expression.replace(regex, otherField.value);
                    }
                });

                // Implementação segura para avaliar expressões matemáticas simples
                try {
                    field.value = this.evaluateSimpleExpression(expression).toString();
                } catch (e) {
                    console.warn('Erro ao processar expressão:', expression, e);
                }
            }
        });

        return processedData;
    }

    private evaluateSimpleExpression(expression: string): number {
        // Remove espaços e valida se a expressão contém apenas números e operadores seguros
        const sanitized = expression.replace(/\s/g, '');
        const safePattern = /^[\d+\-*/().]+$/;

        if (!safePattern.test(sanitized)) {
            throw new Error('Expressão contém caracteres inválidos');
        }

        // Para expressões simples como soma, subtração, multiplicação e divisão
        // Em produção, considere usar uma biblioteca como math.js ou similar
        try {
            // Usa Function constructor como alternativa mais segura ao eval direto
            return new Function('return ' + sanitized)();
        } catch (error) {
            console.error('Erro ao avaliar expressão:', sanitized, error);
            return 0;
        }
    }
}