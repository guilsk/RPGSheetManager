import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RpgSystem, User } from '../../../shared/models/rpg-sheet-manager.model';
import { SystemService } from '../../services/system.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '@auth0/auth0-angular';
import { DialogService } from '../../services/dialog.service';
import { forkJoin, map, switchMap } from 'rxjs';

@Component({
	selector: 'app-systems',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './systems.component.html',
	styleUrl: './systems.component.scss'
})
export class SystemsComponent implements OnInit {
	private systemService = inject(SystemService);
	private userService = inject(UserService);
	private auth = inject(AuthService);
	private dialogService = inject(DialogService);

	systems: RpgSystem[] = [];
	currentUser: User | null = null;
	currentUserId: string | null = null;
	ownerNames: { [key: string]: string } = {}; // Cache para nomes dos usuários

	// Estados do upload
	isUploading = false;
	uploadError: string | null = null;
	isDragOver = false;

	ngOnInit() {
		this.loadCurrentUser();
		this.loadSystems();
	}

	private loadCurrentUser() {
		this.auth.user$.pipe(
			switchMap(authUser => {
				this.currentUserId = authUser?.sub || null;
				if (!authUser?.sub) {
					return [null];
				}
				return this.userService.getUserByAuthId(authUser.sub);
			})
		).subscribe(user => {
			this.currentUser = user;
		});
	}

	private loadSystems() {
		this.systemService.getSystems().subscribe((systems: RpgSystem[]) => {
			const nonObsoleteSystems = systems.filter(system => !system.obsolete);

			this.systemService.getSavedSystems().subscribe((savedSystems: RpgSystem[]) => {
				const obsoleteSavedSystems = savedSystems.filter(system => system.obsolete);

				this.systems = [...nonObsoleteSystems, ...obsoleteSavedSystems];

				// Carregar nomes dos donos
				this.systems.forEach(system => {
					if (system.ownerId && system.ownerId !== 'system-admin') {
						this.loadOwnerName(system.ownerId);
					}
				});
			});
		});
	}

	private loadOwnerName(ownerId: string) {
		if (this.ownerNames[ownerId]) return; // Já foi carregado

		this.userService.getUserByAuthId(ownerId).subscribe({
			next: (user) => {
				this.ownerNames[ownerId] = user.displayName || 'Usuário desconhecido';
			},
			error: () => {
				this.ownerNames[ownerId] = 'Usuário desconhecido';
			}
		});
	}

	getOwnerDisplayName(ownerId: string): string {
		if (ownerId === 'system-admin') {
			return 'Sistema';
		}
		return this.ownerNames[ownerId] || 'Carregando...';
	}

	// Verificações de estado do sistema
	isSystemOwner(system: RpgSystem): boolean {
		return system.ownerId === this.currentUserId;
	}

	isSystemSaved(system: RpgSystem): boolean {
		if (!this.currentUser?.savedSystemIds) return false;
		return this.currentUser.savedSystemIds.includes(system.id || '');
	}

	isSystemSavedOrOwned(system: RpgSystem): boolean {
		return this.isSystemOwner(system) || this.isSystemSaved(system);
	}

	isSystemObsolete(system: RpgSystem): boolean {
		return system.obsolete === true;
	}

	// Ações dos sistemas
	saveSystem(system: RpgSystem) {
		if (!system.id) return;

		console.log('Tentando salvar sistema:', system.id);

		// Verificar se o usuário está autenticado primeiro
		this.auth.isAuthenticated$.subscribe(isAuth => {
			console.log('Usuário autenticado:', isAuth);
			if (!isAuth) {
				this.dialogService.error('Erro de Autenticação', 'Você precisa estar logado para salvar sistemas.');
				return;
			}

			// Verificar se conseguimos obter o token
			this.auth.getAccessTokenSilently().subscribe({
				next: (token) => {
					console.log('Token obtido:', token ? 'Token presente' : 'Token ausente');
					console.log('Chamando API para salvar sistema...');

					this.systemService.saveSystem(system.id!).subscribe({
						next: (success) => {
							console.log('Resposta da API:', success);
							if (success) {
								// Atualizar localmente
								if (!this.currentUser) {
									this.currentUser = { savedSystemIds: [] };
								}
								if (!this.currentUser.savedSystemIds) {
									this.currentUser.savedSystemIds = [];
								}
								this.currentUser.savedSystemIds.push(system.id!);
							} else {
								this.dialogService.error('Erro', 'Erro ao salvar sistema. Tente novamente.');
							}
						},
						error: (error) => {
							console.error('Erro detalhado ao salvar sistema:', error);
							console.error('Status:', error.status);
							console.error('Mensagem:', error.message);
							console.error('Headers:', error.headers);
							this.dialogService.error('Erro', 'Erro ao salvar sistema. Verifique o console para mais detalhes.');
						}
					});
				},
				error: (tokenError) => {
					console.error('Erro ao obter token:', tokenError);
					this.dialogService.error('Erro de Autenticação', 'Erro de autenticação. Tente fazer login novamente.');
				}
			});
		});
	}

	unsaveSystem(system: RpgSystem) {
		if (!system.id) return;

		this.systemService.unsaveSystem(system.id).subscribe({
			next: (success) => {
				if (success) {
					// Atualizar localmente
					if (this.currentUser?.savedSystemIds) {
						this.currentUser.savedSystemIds = this.currentUser.savedSystemIds.filter(id => id !== system.id);
					}
				} else {
					this.dialogService.error('Erro', 'Erro ao remover sistema dos salvos. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao remover sistema dos salvos:', error);
				this.dialogService.error('Erro', 'Erro ao remover sistema dos salvos. Tente novamente.');
			}
		});
	}

	async deleteSystem(system: RpgSystem) {
		if (!system.id || !this.isSystemOwner(system)) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Excluir Sistema',
			`Tem certeza que deseja excluir o sistema "${system.name}"? Esta ação não pode ser desfeita.`,
			'Excluir'
		);

		if (!confirmed) return;

		this.systemService.markSystemAsObsolete(system.id).subscribe({
			next: (success) => {
				if (success) {
					this.systems = this.systems.filter(s => s.id !== system.id);
				} else {
					this.dialogService.error('Erro', 'Erro ao excluir sistema. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao excluir sistema:', error);
				this.dialogService.error('Erro', 'Erro ao excluir sistema. Tente novamente.');
			}
		});
	}

	async deleteObsoleteSystem(system: RpgSystem) {
		if (!system.id || !this.isSystemSaved(system) || !this.isSystemObsolete(system)) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Excluir Sistema Obsoleto',
			`ATENÇÃO: O sistema "${system.name}" está obsoleto e será excluído permanentemente.\n\n` +
			`Este sistema não está mais disponível publicamente e ao excluí-lo você perderá acesso definitivamente.\n\n` +
			`Seus personagens criados com este sistema não serão afetados, mas você não poderá criar novos personagens com ele.`,
			'Excluir Definitivamente'
		);

		if (!confirmed) return;

		this.systemService.unsaveSystem(system.id).subscribe({
			next: (success) => {
				if (success) {
					// Atualizar localmente
					if (this.currentUser?.savedSystemIds) {
						this.currentUser.savedSystemIds = this.currentUser.savedSystemIds.filter(id => id !== system.id);
					}
					// Remover da lista de sistemas exibidos
					this.systems = this.systems.filter(s => s.id !== system.id);
				} else {
					this.dialogService.error('Erro', 'Erro ao excluir sistema obsoleto. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao excluir sistema obsoleto:', error);
				this.dialogService.error('Erro', 'Erro ao excluir sistema obsoleto. Tente novamente.');
			}
		});
	}

	// Upload de sistemas
	onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.handleFileUpload(input.files[0]);
		}
	}

	onDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = true;
	}

	onDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;
	}

	onDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			this.handleFileUpload(files[0]);
		}
	}

	private handleFileUpload(file: File) {
		// Verificar se é um arquivo JSON
		if (!file.name.toLowerCase().endsWith('.json')) {
			this.uploadError = 'Por favor, selecione um arquivo JSON válido.';
			return;
		}

		this.isUploading = true;
		this.uploadError = null;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const systemData = JSON.parse(content);
				this.uploadSystem(systemData);
			} catch (error) {
				this.uploadError = 'Erro ao ler o arquivo JSON. Verifique se o formato está correto.';
				this.isUploading = false;
			}
		};
		reader.readAsText(file);
	}

	private uploadSystem(systemData: any) {
		console.log('Dados do sistema antes do upload:', systemData);

		this.systemService.uploadSystem(systemData).subscribe({
			next: (newSystem: RpgSystem) => {
				this.systems.unshift(newSystem);

				// Carregar o nome do dono do novo sistema
				if (newSystem.ownerId && newSystem.ownerId !== 'system-admin') {
					this.loadOwnerName(newSystem.ownerId);
				}

				this.isUploading = false;
				this.uploadError = null;
			},
			error: (error) => {
				this.uploadError = 'Erro ao fazer upload do sistema. Verifique o formato do arquivo.';
				this.isUploading = false;
				console.error('Erro no upload:', error);
			}
		});
	}

	// Utilitários
	getSystemFieldsCount(system: RpgSystem): number {
		return system.template?.length || 0;
	}

	getSystemCategoriesCount(system: RpgSystem): number {
		const categories = new Set(system.template?.map(field => field.category).filter(Boolean));
		return categories.size;
	}

	// Ordenação para template
	getSortedSystems(): RpgSystem[] {
		return [...this.systems].sort((a, b) => {
			// Sistemas salvos/próprios primeiro
			const aIsSavedOrOwned = this.isSystemSavedOrOwned(a);
			const bIsSavedOrOwned = this.isSystemSavedOrOwned(b);

			if (aIsSavedOrOwned !== bIsSavedOrOwned) {
				return aIsSavedOrOwned ? -1 : 1;
			}

			// Depois por nome
			return (a.name || '').localeCompare(b.name || '');
		});
	}
}
