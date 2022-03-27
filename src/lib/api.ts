import * as Texts from './types/texts'
import * as API from './types/api'

export class ZenderAPI implements API.IZenderAPI {
    private readonly _texts = new Map<HTMLElement, Texts.IMathText>();
    
    text(el: HTMLElement, options: Texts.TextOptions): Texts.IMathText {
        throw new Error('Method not implemented.');
    }

}