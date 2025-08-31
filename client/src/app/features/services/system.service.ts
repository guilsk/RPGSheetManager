import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { RpgSystem } from '../../shared/models/rpg-sheet-manager.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class SystemService {
    private apiUrl = 'https://localhost:7111/api/system';

     constructor(private http: HttpClient) {}

    public getSystems(): Observable<RpgSystem[]> {
        return this.http.get<RpgSystem[]>(this.apiUrl);
    }

    public getSystemById(id: string): Observable<RpgSystem | undefined> {
        return this.http.get<RpgSystem>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Erro ao buscar sistema:', error);
                return of(undefined);
            })
        );
    }

    private prepareSystemForApi(system: RpgSystem): any {
        // Converter para o formato esperado pela API
        return {
            id: system.id,
            name: system.name,
            description: system.description,
            ownerId: system.ownerId,
            template: system.template?.map(field => ({
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
}
