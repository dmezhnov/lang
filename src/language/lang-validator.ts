import { ValidationChecks } from 'langium';
import { LangAstType } from './generated/ast';
import type { LangServices } from './lang-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: LangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.LangValidator;
    const checks: ValidationChecks<LangAstType> = {
        // Field: validator.checkField
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class LangValidator {
    // checkField(field: Field, accept: ValidationAcceptor): void {
    // }
}
