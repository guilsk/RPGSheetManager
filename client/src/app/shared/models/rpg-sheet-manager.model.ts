// Enums
export enum ComponentType {
	TEXT = 'text',
	NUMERIC = 'numeric',
	TEXTAREA = 'textarea',
	SELECT = 'select',
	CHECKBOX = 'checkbox',
	RADIO = 'radio'
}

// Personagens
export interface Character {
	id?: string;
	systemId?: string;
	userId?: string;
	createdAt?: Date;
	name?: string;
	data?: CharacterData[];
}

export interface CharacterData {
	name?: string;
	value?: string;
	rollable?: RollConfig;
	expression?: string;
	editable?: boolean;
	edited?: boolean; // Alinhado com o backend
	sessionEditable?: boolean;
	visible?: boolean;
	category?: string;
	component?: ComponentType;
	order?: number;
	options?: string[]; // Para select e radio
}

export interface RollConfig {
	enabled?: boolean;
	formula?: string;
}

// Sistemas
export interface RpgSystem {
	id?: string;
	name?: string;
	description?: string;
	ownerId?: string;
	createdAt?: Date;
	template?: CharacterData[];
	categoryOrder?: string[];
	obsolete?: boolean; // Flag para marcar sistemas como obsoletos
}

// Campanhas
export interface Campaign {
	id?: string;
	title: string;
	description?: string;
	systemId: string;
	masterId: string;
	playerIds: string[];
	characters: CampaignCharacter[];
	diceHistory: DiceRoll[];
	activeSession: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CampaignCharacter {
	characterId: string;
	playerId: string;
	dynamicData: DynamicField[];
}

export interface DiceRoll {
	playerId: string;
	characterName?: string;
	diceExpression: string;
	result: number;
	details: string;
	timestamp: Date;
}

export interface DynamicField {
	name?: string;
	value?: string;
}

// Usuários
export interface User {
	authId?: string;
	displayName?: string;
	email?: string;
	createdAt?: Date;
	savedSystemIds?: string[];
}
