import {ZenderAPI} from "./lib/api";
import {IZenderAPI} from "./lib/types";

let API: IZenderAPI;

export function getAPI(): IZenderAPI {
    if (!API) {
        API = new ZenderAPI();
    }
    return API;
}