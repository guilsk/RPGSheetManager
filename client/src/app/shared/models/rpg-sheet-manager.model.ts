// Personagens
export interface ICharacter {
	id?: string;
	systemId?: string;
	userId?: string;
	createdAt?: Date;
	name?: string;
	data?: ICharacterData[];
}

export interface ICharacterData {
	name?: string;
	value?: string;
	rollable?: IRollConfig;
	expression?: string;
	editable?: boolean;
	edited?: boolean;
	sessionEditable?: boolean;
	visible?: boolean;
	category?: string;
	component?: string;
	order?: number;
}

export interface IRollConfig {
	enabled?: boolean;
	formula?: string;
}

// Sistemas
export interface IRpgSystem {
    id?: string;
    name?: string;
    description?: string;
    ownerId?: string;
    createdAt?: Date;
    template?: ICharacterData[];
}

// Campanhas
export interface ICampaign {
    id?: string;
    title?: string;
    systemId?: string;
    masterId?: string;
    playerIds?: string[];
    createdAt?: Date;
    activeSession?: boolean;
    characters?: ICampaignCharacter[];
    chatMessages?: IChatMessage[];
    diceHistory?: IDiceRoll[];
}

export interface ICampaignCharacter {
    charId?: string;
    playerId?: string;
    dynamicData?: IDynamicField[];
}

export interface IChatMessage {
	senderId?: string;
	timestamp?: Date;
	message?: string;
}

export interface IDiceRoll {
	rollerId?: string;
	expression?: string;
	result?: number;
	individualRolls?: number[];
	timestamp?: Date;
}

export interface IDynamicField {
	name?: string;
	value?: string;
}

// Usuários
export interface IUser {
    authId?: string;
    displayName?: string;
    createdAt?: Date;
}
