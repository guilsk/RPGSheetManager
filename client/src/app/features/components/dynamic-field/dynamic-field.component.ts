import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
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
export class DynamicFieldComponent implements OnInit, OnChanges {
	@Input() field!: CharacterData;
	@Input() disabled = false;
	@Input() previewMode = false;
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

	get isSelectPreviewMode(): boolean {
		return this.previewMode && this.field.component === ComponentType.SELECT;
	}

	public ngOnInit() {
		this.updateCurrentValue();
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (changes['previewMode'] || changes['field']) {
			this.updateCurrentValue();
		}
	}

	private updateCurrentValue() {
		if (this.isSelectPreviewMode) {
			this.currentValue = '';
		} else {
			this.currentValue = this.field.value || '';
		}
	}

	public onValueChange(value: any) {
		this.currentValue = value;
		this.valueChange.emit(value);
	}

	public onRoll() {
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

	public getFieldId(): string {
		return `field-${this.field.name?.toLowerCase().replace(/\s+/g, '-')}`;
	}

	public isValidRollFormula(): boolean {
		if (!this.field.rollable?.formula) return false;
		return this.diceService.validateFormula(this.field.rollable.formula);
	}
}
