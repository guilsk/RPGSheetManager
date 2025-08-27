export interface Campaign {
	id?: string;
	name: string;
	description: string;
	systemId: string;
	gameMasterId: string;
	players: CampaignPlayer[];
	isActive: boolean;
	maxPlayers: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CampaignPlayer {
	userId: string;
	characterId?: string;
	joinedAt: Date;
	role: 'player' | 'co-gm';
}
