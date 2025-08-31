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
  
  constructor() { }

  /**
   * Rola dados baseado em uma fórmula
   * @param formula Fórmula no formato "XdY+Z" (ex: "2d6+3", "1d20-1")
   * @param fieldValues Valores dos campos para substituição de variáveis
   * @returns Resultado da rolagem
   */
  rollDice(formula: string, fieldValues: { [key: string]: string } = {}): DiceRollResult {
    let processedFormula = formula.trim();
    
    // Substituir variáveis por valores dos campos
    Object.keys(fieldValues).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedFormula = processedFormula.replace(regex, fieldValues[key] || '0');
    });

    // Analisar a fórmula
    const result = this.parseAndRoll(processedFormula);
    
    return {
      formula: formula,
      result: result.total,
      individual: result.rolls,
      modifier: result.modifier,
      breakdown: result.breakdown
    };
  }

  private parseAndRoll(formula: string): { total: number, rolls: number[], modifier: number, breakdown: string } {
    const parts: string[] = [];
    const rolls: number[] = [];
    let total = 0;
    let modifier = 0;

    // Dividir a fórmula em partes (dados e modificadores)
    const dicePattern = /(\d+d\d+)|([+-]\d+)/g;
    let match;
    
    while ((match = dicePattern.exec(formula)) !== null) {
      parts.push(match[0]);
    }

    let breakdown = '';

    for (const part of parts) {
      if (part.includes('d')) {
        // É um dado (ex: "2d6")
        const [count, sides] = part.split('d').map(Number);
        const diceRolls = this.rollMultipleDice(count, sides);
        
        rolls.push(...diceRolls);
        const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
        total += diceTotal;
        
        if (breakdown) breakdown += ' + ';
        breakdown += `${part}(${diceRolls.join(',')})`;
        
      } else {
        // É um modificador (ex: "+3", "-1")
        const mod = parseInt(part);
        modifier += mod;
        total += mod;
        
        if (breakdown) breakdown += ' ';
        breakdown += part;
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

  /**
   * Valida se uma fórmula de dado é válida
   * @param formula Fórmula a ser validada
   * @returns true se a fórmula é válida
   */
  validateFormula(formula: string): boolean {
    const pattern = /^(\d+d\d+)([+-]\d+)*$/;
    return pattern.test(formula.replace(/\s/g, '').replace(/{[^}]+}/g, '1'));
  }

  /**
   * Gera fórmulas de dado comuns
   */
  getCommonFormulas(): { name: string, formula: string }[] {
    return [
      { name: 'D20', formula: '1d20' },
      { name: 'D20 + Atributo', formula: '1d20 + {Força}' },
      { name: 'Dano Espada', formula: '1d8' },
      { name: 'Dano Machado Grande', formula: '1d12' },
      { name: 'Dano Fireball', formula: '8d6' },
      { name: 'Atributo Call of Cthulhu', formula: '1d100' },
      { name: 'Vida D&D', formula: '1d8 + {Constituição}' }
    ];
  }
}
