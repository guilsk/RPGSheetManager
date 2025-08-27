export interface Character {
	id?: string;
	name: string;
	level: number;
	systemId: string;
	campaignId?: string;
	userId: string;
	attributes: Record<string, any>;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CharacterAttribute {
	name: string;
	value: number | string;
	type: 'number' | 'string' | 'boolean';
}
