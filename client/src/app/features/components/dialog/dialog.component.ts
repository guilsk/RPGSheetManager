import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogConfig {
	title: string;
	message: string;
	type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
	showCancel?: boolean;
	confirmText?: string;
	cancelText?: string;
}

@Component({
	selector: 'app-dialog',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './dialog.component.html',
	styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
	@Input() config: DialogConfig = {
		title: '',
		message: '',
		type: 'info'
	};
	@Input() isVisible: boolean = false;
	@Output() confirmed = new EventEmitter<boolean>();
	@Output() closed = new EventEmitter<void>();

	ngOnInit() {
		if (this.isVisible) {
			document.body.style.overflow = 'hidden';
		}
	}

	onConfirm() {
		this.confirmed.emit(true);
		this.close();
	}

	onCancel() {
		this.confirmed.emit(false);
		this.close();
	}

	onOverlayClick() {
		if (this.config.type !== 'confirm') {
			this.close();
		}
	}

	private close() {
		this.isVisible = false;
		this.closed.emit();
		document.body.style.overflow = 'auto';
	}


}
