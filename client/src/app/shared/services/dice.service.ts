import { Injectable } from '@angular/core';

export interface DiceRollResult {
	formula: string;
	result: number;
	individual: number[];
	modifier: number;
	breakdown: string;
}

@Injectable({
	providedIn: 'root'
})
export class DiceService {

	public rollDice(formula: string, fieldValues: { [key: string]: string } = {}): DiceRollResult {
		let processedFormula = formula.trim();

		Object.keys(fieldValues).forEach(key => {
			const regex = new RegExp(`\\{${key}\\}`, 'g');
			processedFormula = processedFormula.replace(regex, fieldValues[key] || '0');
		});

		const result = this.parseAndRoll(processedFormula);

		return {
			formula: formula,
			result: result.total,
			individual: result.rolls,
			modifier: result.modifier,
			breakdown: result.breakdown
		};
	}

	public validateFormula(formula: string): boolean {
		try {
			let testFormula = formula.replace(/\{[^}]+\}/g, '1');
			testFormula = testFormula.replace(/\s/g, '');

			const pattern = /^(\d+d\d+([+-]\d+)*|[+-]?\d+)([+-](\d+d\d+|\d+))*$/;
			return pattern.test(testFormula);
		} catch {
			return false;
		}
	}

	private parseAndRoll(formula: string): { total: number, rolls: number[], modifier: number, breakdown: string } {
		const parts: string[] = [];
		const rolls: number[] = [];
		let total = 0;
		let modifier = 0;

		const cleanFormula = formula.replace(/\s/g, '');
		const dicePattern = /(\d+d\d+)|([+-]?\d+)/g;
		let match;

		let processedFormula = cleanFormula;
		if (/^\d/.test(processedFormula) && !processedFormula.includes('d')) {
			processedFormula = '+' + processedFormula;
		}

		while ((match = dicePattern.exec(processedFormula)) !== null) {
			parts.push(match[0]);
		}

		let breakdown = '';

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			if (part.includes('d')) {
				const [count, sides] = part.split('d').map(Number);
				const diceRolls = this.rollMultipleDice(count, sides);

				rolls.push(...diceRolls);
				const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
				total += diceTotal;

				if (breakdown) breakdown += ' + ';
				breakdown += `${part}(${diceRolls.join(',')})`;

			} else {
				let mod = parseInt(part);

				if (!part.startsWith('+') && !part.startsWith('-') && i > 0) {
					mod = Math.abs(mod);
				}

				modifier += mod;
				total += mod;

				if (breakdown) {
					breakdown += mod >= 0 ? ' + ' : ' ';
				}
				breakdown += mod >= 0 && breakdown ? mod.toString() : part;
			}
		}

		return {
			total,
			rolls,
			modifier,
			breakdown: breakdown || formula
		};
	}

	private rollMultipleDice(count: number, sides: number): number[] {
		const results: number[] = [];
		for (let i = 0; i < count; i++) {
			results.push(this.rollSingleDie(sides));
		}
		return results;
	}

	private rollSingleDie(sides: number): number {
		return Math.floor(Math.random() * sides) + 1;
	}
}
