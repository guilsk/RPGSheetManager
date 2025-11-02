import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Campaign } from '../models/rpg-sheet-manager.model';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class CampaignService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/campaigns`;

	getAllCampaigns(): Observable<Campaign[]> {
		return this.http.get<Campaign[]>(this.apiUrl).pipe(
			catchError(error => {
				console.error('Error loading campaigns:', error);
				return of([]);
			})
		);
	}

	getCampaignsByMaster(masterId: string): Observable<Campaign[]> {
		return this.http.get<Campaign[]>(`${this.apiUrl}/master/${masterId}`).pipe(
			catchError(error => {
				console.error('Error loading master campaigns:', error);
				return of([]);
			})
		);
	}

	getCampaignsByPlayer(playerId: string): Observable<Campaign[]> {
		return this.http.get<Campaign[]>(`${this.apiUrl}/player/${playerId}`).pipe(
			catchError(error => {
				console.error('Error loading player campaigns:', error);
				return of([]);
			})
		);
	}

	getCampaignById(id: string): Observable<Campaign | null> {
		return this.http.get<Campaign>(`${this.apiUrl}/${id}`).pipe(
			catchError(error => {
				console.error('Error loading campaign:', error);
				return of(null);
			})
		);
	}

	createCampaign(campaign: Campaign): Observable<Campaign | null> {
		return this.http.post<Campaign>(this.apiUrl, campaign).pipe(
			catchError(error => {
				console.error('Error creating campaign:', error);
				return of(null);
			})
		);
	}

	updateCampaign(id: string, campaign: Campaign): Observable<boolean> {
		return this.http.put(`${this.apiUrl}/${id}`, campaign).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error updating campaign:', error);
				return of(false);
			})
		);
	}

	deleteCampaign(id: string): Observable<boolean> {
		return this.http.delete(`${this.apiUrl}/${id}`).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error deleting campaign:', error);
				return of(false);
			})
		);
	}

	startSession(campaignId: string): Observable<boolean> {
		return this.http.post(`${this.apiUrl}/${campaignId}/start`, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error starting session:', error);
				return of(false);
			})
		);
	}

	endSession(campaignId: string): Observable<boolean> {
		return this.http.post(`${this.apiUrl}/${campaignId}/end`, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error ending session:', error);
				return of(false);
			})
		);
	}

	getInvitesByPlayerId(playerId: string): Observable<Campaign[]> {
		return this.http.get<Campaign[]>(`${this.apiUrl}/invites/${playerId}`).pipe(
			catchError(error => {
				console.error('Error loading invites:', error);
				return of([]);
			})
		);
	}

	acceptInvite(campaignId: string, playerId: string): Observable<boolean> {
		return this.http.post(`${this.apiUrl}/${campaignId}/invites/${playerId}/accept`, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error accepting invite:', error);
				return of(false);
			})
		);
	}

	declineInvite(campaignId: string, playerId: string): Observable<boolean> {
		return this.http.post(`${this.apiUrl}/${campaignId}/invites/${playerId}/decline`, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error declining invite:', error);
				return of(false);
			})
		);
	}

	associateCharacter(campaignId: string, characterId: string, playerId: string): Observable<boolean> {
		const url = `${this.apiUrl}/${campaignId}/characters/${characterId}/associate?playerId=${playerId}`;

		return this.http.post(url, {}).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error associating character:', error);
				return of(false);
			})
		);
	}

	disassociateCharacter(campaignId: string, characterId: string, playerId: string): Observable<boolean> {
		return this.http.delete(`${this.apiUrl}/${campaignId}/characters/${characterId}?playerId=${playerId}`).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error disassociating character:', error);
				return of(false);
			})
		);
	}

	getCampaignCharacterData(campaignId: string, characterId: string): Observable<any> {
		return this.http.get(`${this.apiUrl}/${campaignId}/characters/${characterId}/campaign-data`).pipe(
			catchError(error => {
				console.error('Error loading campaign character data:', error);
				return of(null);
			})
		);
	}

	saveCampaignCharacterData(campaignId: string, characterId: string, playerId: string, dynamicData: any[]): Observable<boolean> {
		return this.http.put(`${this.apiUrl}/${campaignId}/characters/${characterId}/session-data?playerId=${playerId}`, dynamicData).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error saving campaign character data:', error);
				return of(false);
			})
		);
	}
}
