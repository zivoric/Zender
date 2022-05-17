import './scss/main.scss';

import {ZenderAPI} from "./lib/api";
import {IZenderAPI} from "./lib/types/api";
export * as DOMProcessor from './lib/processor/dom';
export * as LaTeXProcessor from './lib/processor/latex';

// API

let API: IZenderAPI;

export function getAPI(): IZenderAPI {
    if (!API) {
        API = new ZenderAPI();
    }
    return API;
}

// Register Custom Elements

const custom = ["contents", "cursor", "selection", "sscript", "frac", "root", "num", "op",
                "func", "var", "sup", "sub", "numer", "denom", "ord", "arg", "brackets", "int"];
for (let el of custom) {
    customElements.define("z-"+el, class extends HTMLElement {});
}