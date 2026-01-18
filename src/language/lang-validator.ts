import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { Equation, LangAstType } from './generated/ast.js';
import type { LangServices } from './lang-module.js';
import { evaluateConstant } from './constant-evaluator.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: LangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.LangValidator;
    const checks: ValidationChecks<LangAstType> = {
        Equation: validator.checkEquation
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class LangValidator {

    checkEquation(equation: Equation, accept: ValidationAcceptor): void {
        const leftValue = evaluateConstant(equation.left);
        const rightValue = evaluateConstant(equation.right);

        // Check main comparison if both sides are constant
        if (leftValue !== undefined && rightValue !== undefined) {
            const result = this.compareValues(leftValue, rightValue, equation.op);
            if (result === false) {
                accept('error',
                    `Equation is false: ${leftValue} ${equation.op} ${rightValue}`,
                    { node: equation });
                return; // Stop after first false
            }
        }

        // Check chain of comparisons
        // prevValue starts as the right side of the main equation
        let prevValue = rightValue;

        for (const comp of equation.rest) {
            // We need prevValue (left side of this comparison) to be constant
            if (prevValue === undefined) {
                // If previous was not constant, we can't check this one.
                // But we should update prevValue for the NEXT comparison.
                prevValue = evaluateConstant(comp.right);
                continue;
            }

            const nextValue = evaluateConstant(comp.right);

            if (nextValue === undefined) {
                prevValue = undefined; // Current is not constant, so next comparison left side is not constant
                continue;
            }

            const chainResult = this.compareValues(prevValue, nextValue, comp.op);

            if (chainResult === false) {
                accept('error',
                    `Equation is false: ${prevValue} ${comp.op} ${nextValue}`,
                    { node: comp, property: 'right' });
                return;
            }
            prevValue = nextValue;
        }
    }

    private compareValues(left: number | boolean | null, right: number | boolean | null, op: string): boolean | undefined {
        switch (op) {
            case '=': return left === right;
            case '!=': return left !== right;
            case '>': return typeof left === 'number' && typeof right === 'number' ? left > right : undefined;
            case '<': return typeof left === 'number' && typeof right === 'number' ? left < right : undefined;
            case '>=': return typeof left === 'number' && typeof right === 'number' ? left >= right : undefined;
            case '<=': return typeof left === 'number' && typeof right === 'number' ? left <= right : undefined;
            case '=>': return typeof left === 'number' && typeof right === 'number' ? left >= right : undefined;
            default: return undefined;
        }
    }
}
