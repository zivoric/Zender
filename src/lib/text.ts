import * as I from './types'

export class MathText implements I.IMathText {
    private static _defaultOptions: I.TextOptions = {

    };

    private _options: I.TextOptions;
    private _element: HTMLElement;
    constructor(el: HTMLElement, options: I.TextOptions) {
        this._options = MathText.defaultOptions(options);
        this._element = el;
    }
    get options(): I.TextOptions {
        return this._options;
    }
    set options(options) {
        this._options = MathText.defaultOptions(options);
    }
    get element(): HTMLElement {
        return this._element;
    }
    private static defaultOptions(options: I.TextOptions) {
        return {...this._defaultOptions, ...options};
    }
}

export class MathField extends MathText implements I.IMathField {
    constructor(el: HTMLElement, options: I.FieldOptions) {
        super(el, options);
    }
}