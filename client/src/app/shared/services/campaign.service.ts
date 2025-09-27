import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Campaign } from '../models/rpg-sheet-manager.model';

@Injectable({
	providedIn: 'root'
})
export class CampaignService {
	private http = inject(HttpClient);
	private apiUrl = 'https://localhost:7111/api/campaigns';

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
}
