import { DefaultLexer, type LexerResult } from 'langium';
import type { IToken, TokenType } from 'chevrotain';

export class LangLexer extends DefaultLexer {

    override tokenize(source: string): LexerResult {
        const result = super.tokenize(source);
        const tokens = result.tokens;
        const newTokens: IToken[] = [];
        const indentStack: number[] = [0];
        let parenDepth = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.image === '(' || token.image === '[' || token.image === '{') {
                parenDepth++;
            } else if (token.image === ')' || token.image === ']' || token.image === '}') {
                if (parenDepth > 0) {
                    parenDepth--;
                }
            }

            if (token.tokenType.name === 'NEWLINE') {
                if (parenDepth > 0) {
                    continue;
                }
                newTokens.push(token);

                // Look ahead for the next non-hidden token
                let nextToken = tokens[i + 1];

                // If there are multiple NEWLINEs, we just keep pushing them until the last one
                // Effectively we only care about indentation on the line where code starts.
                // However, python allows multiple blank lines.
                // If we have NEWLINE, NEWLINE, ID...
                // The first NEWLINE ends the first statement.
                // The second NEWLINE effectively does nothing or ends an empty statement?
                // In my grammar: Statement: (Equation | ExprStatement) NEWLINE;
                // And File: (statements+=Statement | NEWLINE)*;
                // So extra NEWLINEs are allowed at top level.

                // We only generated INDENT/DEDENT when we transition to a new line that has content.
                // So if the next token is NEWLINE or EOF, we ignore indentation for this line.
                if (!nextToken || nextToken.tokenType.name === 'NEWLINE') {
                    continue;
                }

                // Check indentation of the next token
                const currentIndent = indentStack[indentStack.length - 1];
                const nextIndent = this.getIndentation(source, nextToken);

                if (nextIndent > currentIndent) {
                    indentStack.push(nextIndent);
                    newTokens.push(this.createVirtualToken('INDENT', nextToken));
                } else if (nextIndent < currentIndent) {
                    while (indentStack.length > 1 && nextIndent < indentStack[indentStack.length - 1]) {
                        indentStack.pop();
                        newTokens.push(this.createVirtualToken('DEDENT', nextToken));
                    }
                    if (nextIndent !== indentStack[indentStack.length - 1]) {
                        // Error: Inconsistent indentation
                        // We could report an error here
                    }
                }
            } else {
                newTokens.push(token);
            }
        }

        // Implicit DEDENTs at EOF
        while (indentStack.length > 1) {
            indentStack.pop();
            const lastToken = newTokens[newTokens.length - 1] || { endOffset: source.length, startLine: 0,
                // Dummy token if empty
                tokenType: { name: 'EOF' }
            } as IToken;
            newTokens.push(this.createVirtualToken('DEDENT', lastToken));
        }


        // Insert 'nothing' tokens between consecutive commas
        const finalTokens: IToken[] = [];
        for (let i = 0; i < newTokens.length; i++) {
            const current = newTokens[i];
            finalTokens.push(current);

            // Check if current token is a comma
            if (current.image === ',') {
                // Look for next non-whitespace token (WS tokens are hidden)
                const nextIdx = i + 1;

                if (nextIdx < newTokens.length) {
                    const next = newTokens[nextIdx];
                    // If next is comma or closing paren, insert nothing
                    if (next.image === ',' || next.image === ')') {
                        const nothingToken: IToken = {
                            tokenType: this.definition['nothing'],
                            image: 'nothing',
                            startOffset: current.endOffset! + 1,
                            endOffset: current.endOffset! + 1,
                            startLine: current.endLine!,
                            endLine: current.endLine!,
                            startColumn: (current.endColumn || 0) + 1,
                            endColumn: (current.endColumn || 0) + 1,
                            tokenTypeIdx: this.definition['nothing'] ? this.definition['nothing'].tokenTypeIdx : -1
                        };
                        finalTokens.push(nothingToken);
                    }
                }
            }
            // Check if current token is opening paren followed by comma
            else if (current.image === '(') {
                const nextIdx = i + 1;

                if (nextIdx < newTokens.length && newTokens[nextIdx].image === ',') {
                    const nothingToken: IToken = {
                        tokenType: this.definition['nothing'],
                        image: 'nothing',
                        startOffset: current.endOffset! + 1,
                        endOffset: current.endOffset! + 1,
                        startLine: current.endLine!,
                        endLine: current.endLine!,
                        startColumn: (current.endColumn || 0) + 1,
                        endColumn: (current.endColumn || 0) + 1,
                        tokenTypeIdx: this.definition['nothing'] ? this.definition['nothing'].tokenTypeIdx : -1
                    };
                    finalTokens.push(nothingToken);
                }
            }
        }

        result.tokens = finalTokens;
        return result as LexerResult;
    }

    private getIndentation(source: string, token: IToken): number {
        // Find the start of the line containing the token
        // Use token.startOffset and scan backwards in source until \n or start of file
        let index = token.startOffset - 1;
        while (index >= 0) {
            const char = source[index];
            if (char === '\n' || char === '\r') {
                break;
            }
            index--;
        }

        // Text between newline (indent + 1) and token.startOffset is the indentation
        // (plus potentially comments if they were hidden? No, comments go to end of line usually)
        // If there were comments before this token on the same line, they would be hidden tokens.
        // But comments start with # and go to end of line. So code cannot follow comment on same line.
        // So the stuff before token on this line is just whitespace.

        const lineStart = index + 1;
        const indentText = source.substring(lineStart, token.startOffset);

        return this.computeIndentCounts(indentText);
    }

    private computeIndentCounts(text: string): number {
        let count = 0;
        for (const char of text) {
            if (char === '\t') {
                count += 4;
            } else if (char === ' ') {
                count++;
            }
        }
        return count;
    }

    private createVirtualToken(name: string, anchor: IToken): IToken {
        const tokenType: TokenType = this.definition[name];
        return {
            tokenType: tokenType,
            image: name,
            startOffset: anchor.startOffset,
            endOffset: anchor.startOffset,
            startLine: anchor.startLine,
            endLine: anchor.startLine,
            startColumn: anchor.startColumn,
            endColumn: anchor.startColumn,
            tokenTypeIdx: tokenType.tokenTypeIdx!
        };
    }
}
