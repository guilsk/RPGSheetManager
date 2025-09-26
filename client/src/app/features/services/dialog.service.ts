import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DialogConfig } from '../components/dialog/dialog.component';

export interface DialogState {
  isVisible: boolean;
  config: DialogConfig;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new BehaviorSubject<DialogState>({
    isVisible: false,
    config: { title: '', message: '', type: 'info' }
  });

  public dialog$ = this.dialogSubject.asObservable();

  private resolvePromise: ((value: boolean) => void) | null = null;

  constructor() { }

  // Método para mostrar mensagens simples (só com OK)
  showMessage(title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    const config: DialogConfig = {
      title,
      message,
      type,
      showCancel: false,
      confirmText: 'OK'
    };

    this.dialogSubject.next({
      isVisible: true,
      config
    });
  }

  // Método para confirmações (com OK/Cancelar)
  showConfirmation(title: string, message: string, confirmText: string = 'Confirmar', cancelText: string = 'Cancelar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;

      const config: DialogConfig = {
        title,
        message,
        type: 'confirm',
        showCancel: true,
        confirmText,
        cancelText
      };

      this.dialogSubject.next({
        isVisible: true,
        config
      });
    });
  }

  // Método para confirmações de exclusão (vermelho)
  showDeleteConfirmation(title: string, message: string, confirmText: string = 'Excluir'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;

      const config: DialogConfig = {
        title,
        message,
        type: 'warning',
        showCancel: true,
        confirmText,
        cancelText: 'Cancelar'
      };

      this.dialogSubject.next({
        isVisible: true,
        config
      });
    });
  }

  // Método chamado quando o usuário responde ao dialog
  onDialogResult(result: boolean): void {
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
    this.hideDialog();
  }

  // Método para fechar o dialog
  hideDialog(): void {
    this.dialogSubject.next({
      isVisible: false,
      config: { title: '', message: '', type: 'info' }
    });
  }

  // Métodos de conveniência
  success(title: string, message: string): void {
    this.showMessage(title, message, 'success');
  }

  error(title: string, message: string): void {
    this.showMessage(title, message, 'error');
  }

  warning(title: string, message: string): void {
    this.showMessage(title, message, 'warning');
  }

  info(title: string, message: string): void {
    this.showMessage(title, message, 'info');
  }
}