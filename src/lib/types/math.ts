export type MathUnit = string | JsMathObject;
export type MathGroup = MathUnit | MathUnit[];

export interface JsMathObject {
    operator: string,
    optional?: MathGroup[]
    required?: MathGroup[]
}
/*
let o : JsMathObject = {
    operator: "frac",
    arguments: [4,[4,'x']]
};
let o = {
    operator: "frac",
    arguments: [4,[4,'x']]
};
*/