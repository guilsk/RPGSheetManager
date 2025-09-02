import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterData, ComponentType } from '../../../shared/models/rpg-sheet-manager.model';
import { DiceService, DiceRollResult } from '../../services/dice.service';

@Component({
	selector: 'app-dynamic-field',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './dynamic-field.component.html',
	styleUrl: './dynamic-field.component.scss'
})
export class DynamicFieldComponent implements OnInit {
	@Input() field!: CharacterData;
	@Input() disabled = false;
	@Input() allFieldValues: { [key: string]: string } = {};
	@Output() valueChange = new EventEmitter<any>();
	@Output() diceRoll = new EventEmitter<DiceRollResult>();

	private diceService = inject(DiceService);

	// Enum para uso no template
	ComponentType = ComponentType;

	currentValue: any;
	lastRollResult?: DiceRollResult;

	get isDisabled(): boolean {
		return this.disabled;
	}

	ngOnInit() {
		this.currentValue = this.field.value || '';
	}

	onValueChange(value: any) {
		this.currentValue = value;
		this.valueChange.emit(value);
	}

	onRoll() {
		if (this.field.rollable?.enabled && this.field.rollable.formula) {
			try {
				const fieldValues = { ...this.allFieldValues };
				if (this.field.name) {
					fieldValues[this.field.name] = this.currentValue || '0';
				}

				const result = this.diceService.rollDice(this.field.rollable.formula, fieldValues);
				this.lastRollResult = result;
				this.diceRoll.emit(result);
			} catch (error) {
				console.error('Erro ao rolar dados:', error);
			}
		}
	}

	getFieldId(): string {
		return `field-${this.field.name?.toLowerCase().replace(/\s+/g, '-')}`;
	}

	isValidRollFormula(): boolean {
		if (!this.field.rollable?.formula) return false;
		return this.diceService.validateFormula(this.field.rollable.formula);
	}
}
