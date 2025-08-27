export interface RpgSystem {
	id?: string;
	name: string;
	description: string;
	version: string;
	attributeSchema: AttributeSchema[];
	createdBy: string;
	isPublic: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface AttributeSchema {
	name: string;
	type: 'number' | 'string' | 'boolean' | 'select';
	required: boolean;
	defaultValue?: any;
	options?: string[]; // Para tipo 'select'
	minValue?: number;   // Para tipo 'number'
	maxValue?: number;   // Para tipo 'number'
}
