import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RpgSystem } from '../../../shared/models/rpg-sheet-manager.model';
import { SystemService } from '../../services/system.service';
import { UserService } from '../../services/user.service';

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
	
	systems: RpgSystem[] = [];
	isUploading = false;
	uploadError: string | null = null;
	isDragOver = false;
	ownerNames: { [key: string]: string } = {}; // Cache para nomes dos usuários

	ngOnInit() {
		this.loadSystems();
	}

	private loadSystems() {
		this.systemService.getSystems().subscribe((systems: RpgSystem[]) => {
			this.systems = systems.filter(system => !system.obsolete); // Filtrar sistemas obsoletos
			
			// Carregar nomes dos donos
			this.systems.forEach(system => {
				if (system.ownerId && system.ownerId !== 'system-admin') {
					this.loadOwnerName(system.ownerId);
				}
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
		console.log('Tamanho do JSON:', JSON.stringify(systemData).length);
		
		this.systemService.uploadSystem(systemData).subscribe({
			next: (newSystem: RpgSystem) => {
				this.systems.unshift(newSystem);
				
				// Carregar o nome do dono do novo sistema
				if (newSystem.ownerId && newSystem.ownerId !== 'system-admin') {
					this.loadOwnerName(newSystem.ownerId);
				}
				
				this.isUploading = false;
				this.uploadError = null;
				console.log('Sistema carregado com sucesso:', newSystem);
			},
			error: (error) => {
				this.uploadError = 'Erro ao fazer upload do sistema. Verifique o formato do arquivo.';
				this.isUploading = false;
				console.error('Erro no upload:', error);
				console.error('Status do erro:', error.status);
				console.error('Mensagem do erro:', error.error);
				console.error('Detalhes completos:', error);
			}
		});
	}

	deleteSystem(system: RpgSystem) {
		if (!system.id) return;
		
		const confirmed = window.confirm(
			`Tem certeza que deseja marcar o sistema "${system.name}" como obsoleto? Ele não será mais visível para novos usuários.`
		);
		
		if (!confirmed) return;

		this.systemService.markSystemAsObsolete(system.id).subscribe({
			next: (success) => {
				if (success) {
					this.systems = this.systems.filter(s => s.id !== system.id);
				} else {
					alert('Erro ao marcar sistema como obsoleto. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao deletar sistema:', error);
				alert('Erro ao marcar sistema como obsoleto. Tente novamente.');
			}
		});
	}

	getSystemFieldsCount(system: RpgSystem): number {
		return system.template?.length || 0;
	}

	getSystemCategoriesCount(system: RpgSystem): number {
		const categories = new Set(system.template?.map(field => field.category).filter(Boolean));
		return categories.size;
	}
}
