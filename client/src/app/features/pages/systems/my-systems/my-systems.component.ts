import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RpgSystem } from '../../../../shared/models/rpg-sheet-manager.model';
import { SystemService } from '../../../services/system.service';
import { UserService } from '../../../services/user.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
	selector: 'app-my-systems',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './my-systems.component.html',
	styleUrl: './my-systems.component.scss'
})
export class MySystemsComponent implements OnInit {
	private systemService = inject(SystemService);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);

	systems: RpgSystem[] = [];
	isUploading = false;
	uploadError: string | null = null;
	isDragOver = false;

	ngOnInit() {
		this.loadUserSystems();
	}

	private loadUserSystems() {
		this.systemService.getUserSystems().subscribe((systems: RpgSystem[]) => {
			this.systems = systems.filter(system => !system.obsolete);
		});
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
				this.isUploading = false;
				this.uploadError = null;
				console.log('Sistema carregado com sucesso:', newSystem);
			},
			error: (error) => {
				this.uploadError = 'Erro ao fazer upload do sistema. Verifique o formato do arquivo.';
				this.isUploading = false;
				console.error('Erro no upload:', error);
			}
		});
	}

	async deleteSystem(system: RpgSystem) {
		if (!system.id) return;

		const confirmed = await this.dialogService.showDeleteConfirmation(
			'Marcar Sistema como Obsoleto',
			`Tem certeza que deseja marcar o sistema "${system.name}" como obsoleto? Ele não será mais visível para novos usuários.`,
			'Marcar como Obsoleto'
		);

		if (!confirmed) return;

		this.systemService.markSystemAsObsolete(system.id).subscribe({
			next: (success) => {
				if (success) {
					this.systems = this.systems.filter(s => s.id !== system.id);
				} else {
					this.dialogService.error('Erro', 'Erro ao marcar sistema como obsoleto. Tente novamente.');
				}
			},
			error: (error) => {
				console.error('Erro ao deletar sistema:', error);
				this.dialogService.error('Erro', 'Erro ao marcar sistema como obsoleto. Tente novamente.');
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
