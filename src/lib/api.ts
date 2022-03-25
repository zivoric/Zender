import * as I from './types'
import * as Text from './text'

export class ZenderAPI implements I.IZenderAPI {
    private readonly _texts = new Map<HTMLElement, I.IMathText>();
    
    text(el: HTMLElement, options: I.TextOptions): I.IMathText {
        throw new Error('Method not implemented.');
    }
    field(el: HTMLElement, options: I.TextOptions): I.IMathField {
        throw new Error('Method not implemented.');
    }

}