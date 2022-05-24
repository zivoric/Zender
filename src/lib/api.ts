import * as Texts from './types/texts'
import * as API from './types/api'
import { MathField, MathText } from './text';

const custom = ["contents", "cursor", "selection", "sscript", "frac", "root", "num", "op",
    "func", "var", "sup", "sub", "numer", "denom", "ord", "arg", "brackets", "int"];

export class ZenderAPI implements API.IZenderAPI {
    readonly #texts = new Map<HTMLElement, Texts.IMathText>();

    constructor() {
        // Register Custom Elements
        for (let el of custom) {
            customElements.define("z-"+el, class extends HTMLElement {});
        }
        // add documentPaste event
        document.addEventListener("paste", (e) => {
            document.activeElement?.dispatchEvent(new CustomEvent("documentpaste", {
                detail: {
                    clipboardData: e.clipboardData
                }
            }));
        });
    }
    
    text(el: HTMLElement, options: Texts.TextOptions): Texts.IMathText {
        return new MathText(el, options);
    }

    field(el: HTMLElement, options: Texts.TextOptions) {
        return new MathField(el, options);
    }
}