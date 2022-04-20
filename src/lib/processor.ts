import {MathGroup, JsMathObject, MathUnit} from "./types/math";
import { Optionable } from "./types/api";

const simpleOps = [ "=","+","-","*","/", // Symbols
                    "\\left", "\\right", "\\{", "\\}", "[", "]", "(", ")", // Delimiters
                    "\\pi", "\\epsilon" // Letters
                ];

// Format - "operator name": [required args, optional args]
const complexOps: {[op: string]: [number, number]} = {"\\frac":[2,0], "^":[1,0], "_":[1,0], "\\operatorname":[1,0], "\\sqrt":[1,1]};

type InvalidMode = "convert"|"remove"|"include";

const Cursor: unique symbol = Symbol();

export class DOMMathPocessor {
    toDOM(obj: MathGroup): DocumentFragment {
        obj = Array.isArray(obj) ? Array.from(obj) : [obj];
        let d = new DocumentFragment();
        for (let unit of obj) {
            if (typeof unit == "string") {
                if (/d/.test(unit)) {
                    let el = document.createElement("z-num");
                    el.innerHTML = unit;
                    d.appendChild(el);
                }
            }
        }
        return d;
    }
}

export class LaTeXProcessor 
{
    serialize(group: MathGroup): string {
        if (!Array.isArray(group)) {
            return this.serializeUnit(group);
        }
        let final = "";
        for (let unit of group) {
            final += this.serializeUnit(unit);
        }
        return final;
    }
    serializeUnit(obj: MathUnit): string {
        if (typeof obj == "object") {
            let final = obj.operator;
            if (obj.optional && obj.optional.length > 0) {
                final += obj.optional.map((arg,i)=>{
                    let s = this.serialize(arg);
                    if (s != "" || i < obj.optional!.length-1) {
                        return "[" + s + "]";
                    }
                }).join("");
            }
            if (obj.required && obj.required.length > 0) {
                final += obj.required.map(arg=>{
                    let s = this.serialize(arg);
                    if (!Array.isArray(arg)) {
                        return s;
                    } else {
                        return "{" + s + "}";
                    }
                }).join("");
            }
            return final;
        } else {
                return obj.toString();
        }
    }
    parse(text: string, maxUnits = -1, invalidMode: InvalidMode = "convert"): MathGroup {
        let final = this.#parseUnits(text, maxUnits, false, invalidMode)[1].flat();
        return final.length == 1 ? final[0] : final;
    }
    #parseUnits(text: string, maxUnits = -1, strictGrouping = false, invalidMode: InvalidMode = "convert"): [number, MathGroup[]] {
        text = text.replace(/\s/g, "");
        
        let i = 0;
        let final: MathGroup[] = [];
        while (i < text.length && (maxUnits == -1 || final.length < maxUnits)) {
            if (text[i] == "{") {
                let end = this.#bracketEnd(text, i);
                if (strictGrouping) {
                    let units = this.#parseUnits(text.substring(i+1, end))[1].flat();
                    final.push(units.length == 1 ? units[0] : units);
                } else {
                    final.push(...this.#parseUnits(text.substring(i+1, end))[1]);
                }
                i = end+1;
            } else if (text[i] == "}") {
                i++;
            } else if (simpleOps.includes(text[i])) {
                final.push({operator: text[i]});
                i++;
            } else if (text[i] == "\\") {
                i++;
                let end = text.substring(i).search(/[^a-zA-Z]/);
                if (end == 0) {
                    final.push("\\" + text[i]);
                    i++;
                } else {
                    end += i;
                    let operator = "\\" + text.substring(i, end);
                    if (simpleOps.includes(operator)) {
                        final.push({operator: operator});
                        i = end;
                    } else if (operator in complexOps) {
                        let unit = this.#generateJsObject(text.substring(end), operator);
                        final.push(unit[1]);
                        i = end+unit[0]+1;
                    } else {
                        switch(invalidMode) {
                            case "remove":
                                break;
                            case "include":
                                final.push(operator);
                                break;
                            case "convert":
                            default:
                                final.push(...Array.from(operator.substring(1)));
                                break;
                        }
                        i = end+1;
                    }
                }
            } else if (text[i] in complexOps) {
                let unit = this.#generateJsObject(text.substring(i+1),text[i]);
                final.push(unit[1]);
                i += unit[0]+1;
            } else {
                final.push(text[i]);
                i++;
            }
        }
        return [i, final];
    }
    #bracketEnd(text: string, start = 0, leftBracket = "{", rightBracket = "}"): number {
        let bracketDepth = 0;
        let firstBracket = -1;
        let matches = Array.from(text.substring(start).matchAll(new RegExp("[\\" + leftBracket + "\\" + rightBracket + "]", "gi")));
        for (let match of matches) {
            if (match[0] == leftBracket) {
                bracketDepth++;
            } else if (match[0] == rightBracket) {
                bracketDepth--;
                if (bracketDepth < 1) {
                    return match.index! + start;
                }
            }
        }
        return text.length;
    }
    #generateJsObject(args: string, operator: string): [number, MathUnit] {
        let argNums = complexOps[operator] ?? [0,0];
        if (argNums == [0,0]) {
            return [0, operator];
        }
        let optional: [number, MathGroup[]] | undefined = undefined;
        if (argNums[1] > 0) {
            optional = [0, []];
            let optMatches = args.match(new RegExp(`^(\\[[^\\]]*\\]){1,${argNums[1]}}`,"g"));
            if (optMatches && optMatches.length > 0) {
                let bracketStr = optMatches[0];
                optional[0] = bracketStr.length;
                let bracketArgs = optMatches[0].match(/(\[[^\]]*?\])/g)!;
                optional[1] = bracketArgs.map(arg => this.parse(arg.substring(1,arg.length-1)));
            }
        }
        let required = this.#parseUnits(args.substring(optional?.[0] ?? 0), argNums[0], true);
        let obj: MathUnit;
        obj = {
            operator: operator,
            required: required[1]
        }
        if (optional) {
            obj.optional = optional[1];
        }
        return [(optional?.[0] ?? 0) + required[0], obj];
    }
}