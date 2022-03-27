import * as Text from './types/texts'
import { Optionable } from './types/api';

export class MathText extends Optionable<Text.TextOptions> implements Text.IMathText {
    private static readonly _defaultOptions: Text.TextOptions = {

    };
    private _element: HTMLElement;
    
    constructor(el: HTMLElement, options: Text.TextOptions) {
        super(options, MathText._defaultOptions);
        this._element = el;
    }
    get element(): HTMLElement {
        return this._element;
    }
}