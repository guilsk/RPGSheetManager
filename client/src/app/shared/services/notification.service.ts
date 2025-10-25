import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	private invitesUpdated$ = new Subject<void>();

	// Observable para componentes se inscreverem
	public get invitesUpdated() {
		return this.invitesUpdated$.asObservable();
	}

	// Método para notificar que os convites foram atualizados
	public notifyInvitesUpdated(): void {
		this.invitesUpdated$.next();
	}
}
