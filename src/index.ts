import {ZenderAPI} from "./lib/api";
import {IZenderAPI} from "./lib/types/api";
export {JsMathProcessor} from './lib/processor'

let API: IZenderAPI;

export function getAPI(): IZenderAPI {
    if (!API) {
        API = new ZenderAPI();
    }
    return API;
}