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