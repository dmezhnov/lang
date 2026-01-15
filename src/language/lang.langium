grammar Lang

entry File:
    (statements+=Statement | NEWLINE)*;

Statement:
    Equation | ExprStatement;

Equation:
    left=Expression op=Comparison right=Expression (rest+=ComparisonRight)* (where=WhereClause | NEWLINE);

ComparisonRight:
    op=Comparison right=Expression;

ExprStatement:
    expr=Expression (where=WhereClause | NEWLINE);

WhereClause:
    'where' NEWLINE INDENT statements+=Statement* DEDENT;

Expression:
    List ({infer BinaryExpression.left=current} op=Operator right=List)*;

List:
    elements+=Element (',' elements+=Element)* (',' '...' (',' elements+=Element)*)?;

Element:
    number=NUMBER | string=STRING | id=ID | expr=Parenthesized | record=Record | func=FunctionCall;

Parenthesized:
    '(' (inner+=List | NEWLINE)* ')';

Record:
    '{' NEWLINE? fields+=Field* '}';

Field:
     name=ID ('from' value=Expression)? (where=WhereClause | NEWLINE);

FunctionCall:
    name=ID '(' (args+=Expression (',' args+=Expression)*)? ')';

Comparison returns string:
    '=' | '!=' | '>' | '<' | '>=' | '<=' | '=>' | 'of' | 'from' | 'for';

Operator returns string:
    '+' | '-' | '*' | '/' | '^' | '<>';

hidden terminal WS: /[ \t]+/;
terminal NEWLINE: /\r?\n/;
terminal INDENT: 'INDENT';
terminal DEDENT: 'DEDENT';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+/;
terminal STRING: /"[^"]*"/;
hidden terminal SL_COMMENT: /#.*/;
