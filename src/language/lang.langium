grammar Lang

entry File:
    (statements+=Statement | NEWLINE)*;

Statement:
    Equation | ExprStatement;

Equation:
    left=Expression op=Comparison right=Expression (rest+=ComparisonRight)* (
        (where=WhereClause) |
        (NEWLINE (INDENT where=WhereClause DEDENT)?)
    );

ComparisonRight:
    op=Comparison right=Expression;

ExprStatement:
    expr=Expression (
        (where=WhereClause) |
        (NEWLINE (INDENT where=WhereClause DEDENT)?)
    );

WhereClause:
    'where' (
        (NEWLINE INDENT (statements+=Statement | NEWLINE)* DEDENT) |
        (statements+=Statement)
    );

Expression:
    List;

List:
    elements+=BinaryExpression (',' elements+=BinaryExpression)* (',' '...' (',' elements+=BinaryExpression)*)?;

BinaryExpression:
    Element ({infer BinaryExpression.left=current} op=Operator right=Element)*;

Element:
    Primary ({infer MemberAccess.receiver=current} '.' member=(ID | NUMBER) |
             {infer FunctionCall.receiver=current} '(' (args+=BinaryExpression (',' args+=BinaryExpression)*)? ')' )*;

Primary:
    {infer NumberLiteral} value=NUMBER |
    {infer StringLiteral} value=STRING |
    {infer Reference} name=ID |
    Parenthesized |
    Record;

Parenthesized:
    '(' (inner+=Expression | NEWLINE)* ')';

Record:
    '{' NEWLINE? (fields+=Field (',' | NEWLINE)*)* '}';

Field:
     name=ID (('from' | '=') value=BinaryExpression)? (
        (where=WhereClause) |
        (NEWLINE (INDENT where=WhereClause DEDENT)?)
     )?;



Comparison returns string:
    '=' | '!=' | '>' | '<' | '>=' | '<=' | '=>';

Operator returns string:
    '+' | '-' | '*' | '/' | '^' | '<>' | 'of' | 'from' | 'for';

hidden terminal WS: /[ \t]+/;
terminal NEWLINE: /\r?\n/;
terminal INDENT: 'INDENT';
terminal DEDENT: 'DEDENT';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+/;
terminal STRING: /"[^"]*"/;
hidden terminal SL_COMMENT: /#.*/;
