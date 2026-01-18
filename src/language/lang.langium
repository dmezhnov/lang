grammar Lang

entry File:
    (statements+=Statement | NEWLINE)*;

Statement:
    Expression (
        (op=Comparison right=Expression (rest+=ComparisonRight)* (
            (where=WhereClause) |
            (NEWLINE+ (INDENT where=WhereClause DEDENT)?)
        )? {infer Equation.left=current}) |
        ((
            (where=WhereClause) |
            (NEWLINE+ (INDENT where=WhereClause DEDENT)?)
        )? {infer ExprStatement.expr=current})
    );

ComparisonRight:
    op=Comparison right=Expression;

WhereClause:
    'where' (
        (NEWLINE INDENT (statements+=Statement | NEWLINE)* DEDENT) |
        (statements+=Statement)
    );

Expression:
    List;

List:
    elements+=BinaryExpression (',' elements+=BinaryExpression)*;

BinaryExpression:
    UnaryExpression ({infer BinaryExpression.left=current} op=Operator right=UnaryExpression)*;

UnaryExpression:
    {infer UnaryExpression} op=UnaryOperator operand=UnaryExpression |
    Element;

Element:
    Primary ({infer MemberAccess.receiver=current} '.' member=(ID | NUMBER) |
             {infer FunctionCall.receiver=current} '(' (args+=BinaryExpression (',' args+=BinaryExpression)*)? ')' )*;

Primary:
    {infer NumberLiteral} value=NUMBER |
    {infer StringLiteral} value=STRING |
    {infer BooleanLiteral} value=('true' | 'false') |
    {infer Reference} name=ID |
    {infer Ellipsis} '...' |
    Parenthesized |
    Record;

Parenthesized:
    '(' (inner+=Expression | NEWLINE)* ')';

Record:
    '{' NEWLINE? (fields+=Field (',' | NEWLINE)*)* '}';

Field:
     key=BinaryExpression (
         ('from' | '=') value=BinaryExpression (rest+=FieldComparison)* |
         (where=WhereClause | (NEWLINE INDENT where=WhereClause DEDENT))
     )?;

FieldComparison:
     op=Comparison right=BinaryExpression;

Comparison returns string:
    '=' | '!=' | '>' | '<' | '>=' | '<=' | '=>';

UnaryOperator returns string:
    'not';

Operator returns string:
    '+' | '-' | '*' | '/' | '^' | '<>' | 'of' | 'from' | 'for' | 'and' | 'or';

hidden terminal WS: /[ \t]+/;
terminal NEWLINE: /\r?\n/;
terminal INDENT: 'INDENT';
terminal DEDENT: 'DEDENT';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+/;
terminal STRING: /"[^"]*"/;
hidden terminal SL_COMMENT: /#.*/;
