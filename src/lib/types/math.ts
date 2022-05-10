export type MU = string | JsMathObject;
export type MG = MU | MU[];

export interface JsMathObject {
    operator: string,
    optional?: MG[]
    required?: MG[]
}

export const SelectionStart: unique symbol = Symbol();
export const SelectionEnd: unique symbol = Symbol();
export type MathUnit = string | JsMathObj | FunctionObj | TextObj | BracketObj | typeof SelectionStart | typeof SelectionEnd;
export type MathGroup = (MathGroup|MathUnit)[];
export type ArgumentList = {[arg: string]: MathGroup};

export interface BracketObj {
    type: string
    contents: MathGroup
}
export interface TextObj {
    text: string
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