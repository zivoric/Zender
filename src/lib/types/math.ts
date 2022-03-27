export type MathUnit = string | number | JsMathObject;
export type MathGroup = MathUnit | MathUnit[];

export interface JsMathObject {
    operator: string,
    arguments?: MathGroup[]
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