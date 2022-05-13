import * as Texts from './types/texts'
import * as API from './types/api'
import { MathField, MathText } from './text';

export class ZenderAPI implements API.IZenderAPI {
    private readonly _texts = new Map<HTMLElement, Texts.IMathText>();
    
    text(el: HTMLElement, options: Texts.TextOptions): Texts.IMathText {
        return new MathText(el, options);
    }

    field(el: HTMLElement, options: Texts.TextOptions) {
        return new MathField(el, options);
    }
}