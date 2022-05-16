export type LaTeXUnit = string | LaTeXObject;
export type LaTeXGroup = LaTeXUnit | LaTeXUnit[];

export interface LaTeXObject {
    operator: string,
    optional?: LaTeXGroup[]
    required?: LaTeXGroup[]
}

export const SelectionStart: unique symbol = Symbol();
export const SelectionEnd: unique symbol = Symbol();
export const Cursor: unique symbol = Symbol();
export type MathUnit = string | JsMathObj | FunctionObj | BracketObj | SelectionObj | typeof Cursor;
export type MathGroup = MathUnit[];
export type ArgumentList = {[arg: string]: MathGroup};
export type SelectionIndex = (number|string)[];

export interface BracketObj {
    type: string
    contents: MathGroup
}
export interface SelectionObj {
    selection: MathGroup
    pivot: boolean // false = left; true = right
}
export interface FunctionObj {
    name: string,
    display: MathGroup
}
export interface JsMathObj {
    operator: string,
    arguments: ArgumentList
}

/* example object:

    [
        "345","x","*",
        {
            operator: "frac",
            arguments: {"numer":["3"],"denom":["40","y"]}
        }
    ]

*/