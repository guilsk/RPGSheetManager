import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Campaign } from '../models/rpg-sheet-manager.model';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class CampaignService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/campaigns`;

	// Cache para campanhas
	private masterCampaignsCache = new Map<string, { campaigns: Campaign[], timestamp: number }>();
	private playerCampaignsCache = new Map<string, { campaigns: Campaign[], timestamp: number }>();
	private cacheExpiry = 5 * 60 * 1000; // 5 minutos

	getAllCampaigns(): Observable<Campaign[]> {
		return this.http.get<Campaign[]>(this.apiUrl).pipe(
			catchError(error => {
				console.error('Error loading campaigns:', error);
				return of([]);
			})
		);
	}

	getCampaignsByMaster(masterId: string): Observable<Campaign[]> {
		const now = Date.now();
		const cached = this.masterCampaignsCache.get(masterId);

		// Retornar cache se válido
		if (cached && (now - cached.timestamp) < this.cacheExpiry) {
			console.log('CampaignService - Retornando campanhas de mestre do cache:', cached.campaigns.length);
			return of(cached.campaigns);
		}

		// Buscar novos dados
		console.log('CampaignService - Buscando campanhas de mestre do servidor...');
		return this.http.get<Campaign[]>(`${this.apiUrl}/master/${masterId}`).pipe(
			map(campaigns => {
				console.log('CampaignService - Campanhas de mestre carregadas e armazenadas no cache:', campaigns.length);
				this.masterCampaignsCache.set(masterId, { campaigns, timestamp: now });
				return campaigns;
			}),
			catchError(error => {
				console.error('Error loading master campaigns:', error);
				// Retornar cache antigo se houver erro
				return cached ? of(cached.campaigns) : of([]);
			}),
			shareReplay(1)
		);
	}

	getCampaignsByPlayer(playerId: string): Observable<Campaign[]> {
		const now = Date.now();
		const cached = this.playerCampaignsCache.get(playerId);

		// Retornar cache se válido
		if (cached && (now - cached.timestamp) < this.cacheExpiry) {
			console.log('CampaignService - Retornando campanhas de jogador do cache:', cached.campaigns.length);
			return of(cached.campaigns);
		}

		// Buscar novos dados
		console.log('CampaignService - Buscando campanhas de jogador do servidor...');
		return this.http.get<Campaign[]>(`${this.apiUrl}/player/${playerId}`).pipe(
			map(campaigns => {
				console.log('CampaignService - Campanhas de jogador carregadas e armazenadas no cache:', campaigns.length);
				this.playerCampaignsCache.set(playerId, { campaigns, timestamp: now });
				return campaigns;
			}),
			catchError(error => {
				console.error('Error loading player campaigns:', error);
				// Retornar cache antigo se houver erro
				return cached ? of(cached.campaigns) : of([]);
			}),
			shareReplay(1)
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
			map(createdCampaign => {
				// Limpar cache ao criar campanha
				if (campaign.masterId) {
					this.clearCacheForUser(campaign.masterId);
				}
				return createdCampaign;
			}),
			catchError(error => {
				console.error('Error creating campaign:', error);
				return of(null);
			})
		);
	}

	updateCampaign(id: string, campaign: Campaign): Observable<boolean> {
		return this.http.put(`${this.apiUrl}/${id}`, campaign).pipe(
			map(() => {
				// Limpar cache ao atualizar campanha
				if (campaign.masterId) {
					this.clearCacheForUser(campaign.masterId);
				}
				// Também limpar para jogadores se houver
				if (campaign.invitedPlayerIds) {
					campaign.invitedPlayerIds.forEach(playerId => {
						this.clearCacheForUser(playerId);
					});
				}
				return true;
			}),
			catchError(error => {
				console.error('Error updating campaign:', error);
				return of(false);
			})
		);
	}

	deleteCampaign(id: string): Observable<boolean> {
		return this.http.delete(`${this.apiUrl}/${id}`).pipe(
			map(() => {
				// Limpar todo o cache ao deletar campanha
				this.clearAllCache();
				return true;
			}),
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

	removePlayerFromCampaign(campaignId: string, playerId: string): Observable<boolean> {
		return this.http.delete(`${this.apiUrl}/${campaignId}/players/${playerId}`).pipe(
			map(() => true),
			catchError(error => {
				console.error('Error removing player from campaign:', error);
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

	/**
	 * Limpa o cache de campanhas por usuário
	 */
	public clearCacheForUser(userId: string): void {
		this.masterCampaignsCache.delete(userId);
		this.playerCampaignsCache.delete(userId);
	}

	/**
	 * Limpa todo o cache de campanhas
	 */
	public clearAllCache(): void {
		this.masterCampaignsCache.clear();
		this.playerCampaignsCache.clear();
	}
}
