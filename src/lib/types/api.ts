// api
import * as T from './texts'

export interface IZenderAPI {
    text(el: HTMLElement, options: T.TextOptions): T.IMathText;
    //field(el: HTMLElement, options: T.FieldOptions): T.IMathField;
}

export abstract class Optionable<T extends object> {
    private _default: T;
    private _options: T;
    constructor(options: T, defaults: T) {
        this._default = defaults;
        this._options = Optionable.default<T>(options, defaults);
    }
    getOptions(): T {
        return this._options;
    }
    setOptions(options: T): void {
        this._options = Optionable.default<T>(options, this._default);
    }
    updateOptions(options: T) {
        this._options = Optionable.default<T>(options, this._options);
    }
    private static default<O>(options: O, defaults: O): O {
        return {...defaults, ...options};
    }
}