// api

export interface IZenderAPI {
    text(el: HTMLElement, options: TextOptions): IMathText;
    field(el: HTMLElement, options: FieldOptions): IMathField;
}

// text


export interface IMathText {
    get options(): TextOptions;
    set options(options);
    get element(): HTMLElement;
}


export type TextOptions = {

}

// field

export interface IMathField extends IMathText {
    get options(): FieldOptions;
}


export type FieldOptions = TextOptions & {

}