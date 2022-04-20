import './scss/main.scss';

import {ZenderAPI} from "./lib/api";
import {IZenderAPI} from "./lib/types/api";
export {LaTeXProcessor} from './lib/processor';

let API: IZenderAPI;

export function getAPI(): IZenderAPI {
    if (!API) {
        API = new ZenderAPI();
    }
    return API;
}