// text

export interface IMathText {
    get element(): HTMLElement;
}

export type TextOptions = {
    allowVariables: boolean
    allowFunctions: boolean
    format: "dom"|"latex"
}