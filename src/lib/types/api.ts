// api
import * as T from './texts'

export interface IZenderAPI {
    text(el: HTMLElement, options: T.TextOptions): T.IMathText;
    //field(el: HTMLElement, options: T.FieldOptions): T.IMathField;
}

export abstract class Optionable<T extends object> {
    private _default: T;
    private _options: T;
    constructor(defaults: T, options?: T) {
        this._default = defaults;
        this._options = Optionable.default<T>(defaults, options ?? defaults);
    }
    get options(): T {
        return this._options;
    }
    set options(options: T) {
        this._options = Optionable.default<T>(this._default, options);
    }
    updateOptions(options: T) {
        this._options = Optionable.default<T>(this._options, options);
    }
    private static default<O>(defaults: O, options: O): O {
        return {...defaults, ...options};
    }
}