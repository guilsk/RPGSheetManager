import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map, switchMap } from 'rxjs';
import { RpgSystem } from '../../shared/models/rpg-sheet-manager.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './user.service';

@Injectable({
	providedIn: 'root'
})
export class SystemService {
	private apiUrl = 'https://localhost:7111/api/system';

	constructor(
		private http: HttpClient,
		private auth: AuthService,
		private userService: UserService
	) { }

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

	public uploadSystem(systemData: any): Observable<RpgSystem> {
		console.log('Sistema original:', systemData);
		console.log('URL da requisição:', this.apiUrl);

		// Primeiro obter o usuário logado
		return this.auth.user$.pipe(
			switchMap(user => {
				if (!user?.sub) {
					throw new Error('Usuário não está logado');
				}

				// Buscar o usuário no banco para obter o ID do MongoDB
				return this.userService.getUserByAuthId(user.sub).pipe(
					switchMap(dbUser => {
						if (!dbUser?.authId) {
							throw new Error('Usuário não encontrado no banco de dados');
						}

						const preparedSystem = this.prepareSystemForApi(systemData, dbUser.authId);
						console.log('Sistema preparado para API:', preparedSystem);

						return this.http.post<RpgSystem>(this.apiUrl, preparedSystem).pipe(
							catchError(error => {
								console.error('Erro ao fazer upload do sistema:', error);
								console.error('Status:', error.status);
								console.error('Error body:', error.error);
								if (error.error && error.error.errors) {
									console.error('Detalhes dos erros de validação:', error.error.errors);
								}
								throw error;
							})
						);
					})
				);
			})
		);
	}

	public getUserSystems(): Observable<RpgSystem[]> {
		return this.auth.user$.pipe(
			switchMap(user => {
				if (!user?.sub) {
					return of([]);
				}
				return this.http.get<RpgSystem[]>(`${this.apiUrl}/user/${user.sub}`).pipe(
					catchError(error => {
						console.error('Erro ao buscar sistemas do usuário:', error);
						return of([]);
					})
				);
			})
		);
	}

	public isSystemSaved(systemId: string): Observable<boolean> {
		return this.auth.user$.pipe(
			switchMap(user => {
				if (!user?.sub) {
					return of(false);
				}
				return this.userService.getUserByAuthId(user.sub).pipe(
					map(dbUser => dbUser?.savedSystemIds?.includes(systemId) || false),
					catchError(() => of(false))
				);
			})
		);
	}

	public isSystemOwner(system: RpgSystem): Observable<boolean> {
		return this.auth.user$.pipe(
			map(user => user?.sub === system.ownerId)
		);
	}

	public markSystemAsObsolete(systemId: string): Observable<boolean> {
		return this.http.patch<boolean>(`${this.apiUrl}/${systemId}/obsolete`, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Erro ao marcar sistema como obsoleto:', error);
				return of(false);
			})
		);
	}

	public saveSystem(systemId: string): Observable<boolean> {
		console.log('SystemService.saveSystem chamado para ID:', systemId);
		console.log('URL da requisição:', `${this.apiUrl}/${systemId}/save`);

		return this.http.post<boolean>(`${this.apiUrl}/${systemId}/save`, {}).pipe(
			map((response) => {
				console.log('Resposta do servidor:', response);
				return true;
			}),
			catchError(error => {
				console.error('Erro no SystemService.saveSystem:', error);
				console.error('URL:', `${this.apiUrl}/${systemId}/save`);
				console.error('Status:', error.status);
				console.error('Error details:', error.error);
				return of(false);
			})
		);
	}

	public unsaveSystem(systemId: string): Observable<boolean> {
		return this.http.delete<boolean>(`${this.apiUrl}/${systemId}/save`).pipe(
			map(() => true),
			catchError(error => {
				console.error('Erro ao remover sistema dos salvos:', error);
				return of(false);
			})
		);
	}

	private prepareSystemForApi(system: any, ownerId: string): any {
		// Manter os dados originais sem inventar fallbacks
		return {
			name: system.name,
			description: system.description,
			ownerId: ownerId, // Usar o ID do usuário logado
			createdAt: system.createdAt,
			template: system.template?.map((field: any) => ({
				name: field.name,
				value: field.value,
				rollable: field.rollable,
				expression: field.expression,
				editable: field.editable,
				edited: field.edited,
				sessionEditable: field.sessionEditable,
				visible: field.visible,
				category: field.category,
				component: field.component,
				order: field.order,
				options: field.options
			})) || [],
			categoryOrder: system.categoryOrder
		};
	}
}
