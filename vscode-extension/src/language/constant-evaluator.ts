import type { Expression } from './generated/ast.js';
import { isNumberLiteral, isBooleanLiteral, isNothingLiteral, isBinaryExpression, isUnaryExpression, isList } from './generated/ast.js';

/**
 * Evaluates constant expressions at compile time.
 * Returns undefined for non-constant expressions (variables, function calls, etc.)
 */
export function evaluateConstant(expr: Expression): number | boolean | null | undefined {
    if (isList(expr)) {
        // List - recursively evaluate all elements if single element
        if (expr.elements.length === 1) {
            return evaluateConstant(expr.elements[0]);
        }
        // Multi-element lists are not constants
        return undefined;
    }

    if (isNumberLiteral(expr)) {
        return expr.value;
    }

    if (isBooleanLiteral(expr)) {
        return expr.value === 'true';
    }

    if (isNothingLiteral(expr)) {
        return null;
    }

    if (isUnaryExpression(expr) && expr.op && expr.operand) {
        const operand = evaluateConstant(expr.operand);
        if (operand === undefined) return undefined;

        switch (expr.op) {
            case '-':
                return typeof operand === 'number' ? -operand : undefined;
            case 'not':
                return typeof operand === 'boolean' ? !operand : undefined;
            default:
                return undefined;
        }
    }

    if (isBinaryExpression(expr) && expr.op) {
        const left = evaluateConstant(expr.left);
        if (left === undefined) return undefined;

        const right = expr.right ? evaluateConstant(expr.right) : undefined;
        if (right === undefined) return undefined;

        // Arithmetic operators
        if (typeof left === 'number' && typeof right === 'number') {
            switch (expr.op) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return right !== 0 ? left / right : undefined;
                case '^': return Math.pow(left, right);
            }
        }

        // Logical operators
        if (typeof left === 'boolean' && typeof right === 'boolean') {
            switch (expr.op) {
                case 'and': return left && right;
                case 'or': return left || right;
            }
        }
    }

    // Not a constant expression (e.g., variable reference, function call)
    return undefined;
}
