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
        // Criar uma cópia profunda para evitar mutação direta
        const processedData = data.map(field => ({...field}));
        
        console.log('Iniciando cálculo de expressões para', processedData.length, 'campos');

        // Primeira passagem: calcular expressões que não dependem de outras expressões
        let hasChanges = true;
        let iterations = 0;
        const maxIterations = 5; // Prevenir loop infinito

        while (hasChanges && iterations < maxIterations) {
            hasChanges = false;
            iterations++;
            console.log(`Iteração ${iterations} de cálculo de expressões`);

            processedData.forEach(field => {
                if (field.expression && !field.edited) {
                    let expression = field.expression;
                    const originalValue = field.value;
                    
                    console.log(`Processando campo "${field.name}" com expressão: "${expression}"`);

                    // Substituir referências a outros campos
                    processedData.forEach(otherField => {
                        if (otherField.name && otherField.value !== undefined && otherField.value !== '') {
                            const regex = new RegExp(`{${otherField.name}}`, 'g');
                            const oldExpression = expression;
                            expression = expression.replace(regex, otherField.value);
                            
                            if (oldExpression !== expression) {
                                console.log(`Substituído {${otherField.name}} por "${otherField.value}" na expressão`);
                            }
                        }
                    });

                    console.log(`Expressão final para "${field.name}":`, expression);

                    // Só calcular se todas as variáveis foram substituídas
                    if (!expression.includes('{')) {
                        try {
                            const result = this.evaluateSimpleExpression(expression);
                            const newValue = result.toString();
                            
                            if (newValue !== originalValue) {
                                field.value = newValue;
                                hasChanges = true;
                                console.log(`Resultado calculado para "${field.name}":`, result);
                            }
                        } catch (e) {
                            console.warn('Erro ao processar expressão:', expression, e);
                        }
                    } else {
                        console.log(`Expressão "${field.name}" ainda contém variáveis não resolvidas:`, expression);
                    }
                }
            });
        }

        if (iterations >= maxIterations) {
            console.warn('Máximo de iterações atingido para cálculo de expressões');
        }

        return processedData;
    }

    private evaluateSimpleExpression(expression: string): number {
        // Limpa a expressão mas preserva sua estrutura
        const sanitized = expression.trim();
        
        console.log('Avaliando expressão:', sanitized);
        
        // Remove a validação restritiva que estava bloqueando as expressões válidas
        // Apenas verifica se não contém caracteres claramente perigosos
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
            
            console.log('Resultado da expressão:', result);
            
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
            console.error('Erro ao avaliar expressão:', sanitized, error);
            return 0;
        }
    }
}