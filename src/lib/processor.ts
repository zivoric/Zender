import {MG, JsMathObject, MU, MathUnit, MathGroup, SelectionStart, SelectionEnd, JsMathObj, ArgumentList} from "./types/math";
import { Optionable } from "./types/api";

const simpleOps = [ "=","+","-","*","/", // Symbols
                    "\\left", "\\right", "\\{", "\\}", "[", "]", "(", ")", // Delimiters
                    "\\pi", "\\epsilon" // Letters
                ];

const opChars = ["=","+","-","*","/"];
const argOrders: {[op: string]: string[]} = {"frac": ["numer", "denom"], "sscript": ["sup", "sub"], "root":["ord", "arg"]};
// Format - "operator name": [required args, optional args]
const complexOps: {[op: string]: [number, number]} = {"\\frac":[2,0], "^":[1,0], "_":[1,0], "\\operatorname":[1,0], "\\sqrt":[1,1]};
type InvalidMode = "convert"|"remove"|"include";

export class DOMProcessor {
    toDOM(units: MathGroup): DocumentFragment {
        let allowSelection = true;
        let mainFragment = new DocumentFragment();
        let currentFragment: ParentNode = mainFragment;
        for (let unit of units) {
            if (Array.isArray(unit)) {
                currentFragment.append(this.toDOM(unit));
            } else {
                if (typeof unit == "object") {
                    let node;
                    if ("operator" in unit) {
                        let op = unit.operator;
                        node = document.createElement("z-" + op);
                        node.append(...Object.entries(unit.arguments).sort((a, b) => {
                            if (op in argOrders) {
                                return argOrders[op].indexOf(a[0]) - argOrders[op].indexOf(b[0]);
                            }
                            return 0;
                        }).map(entry => {
                            let el = document.createElement("z-" + entry[0]);
                            el.append(this.toDOM(entry[1]));
                            return el;
                        }));
                    } else if ("name" in unit) {
                        node = document.createElement("z-func");
                        node.setAttribute("name", unit.name);
                        node.append(this.toDOM(unit.display));
                    } else if ("type" in unit) {
                        node = document.createElement("z-brackets");
                        node.setAttribute("type", unit.type);
                        node.append(this.toDOM(unit.contents));
                    } else {
                        node = document.createElement("z-text");
                        node.innerText = unit.text;
                    }
                    currentFragment.append(node);
                } else if (allowSelection && unit === SelectionStart) {
                        currentFragment = document.createElement("z-selection");
                } else if (allowSelection && unit === SelectionEnd && mainFragment !== currentFragment) {
                    if (currentFragment.children.length == 0) {
                        mainFragment.append(document.createElement("z-cursor"));
                    } else {
                        mainFragment.append(currentFragment);
                    }
                    currentFragment = mainFragment;
                    allowSelection = false;
                } else if (typeof unit == "string") {
                    for (let char of Array.from(unit)) {
                        let name;
                        if (/\d/.test(char)) {
                            name = "z-num";
                        } else if (opChars.includes(char)) {
                            name = "z-op";
                        } else {
                            name = "z-var";
                        }
                        let el = document.createElement(name);
                        el.append(char);
                        currentFragment.append(el);
                    }
                }
            }
        }
        return mainFragment;
    }
    fromDOM(fragment: DocumentFragment|HTMLCollection): MathGroup {
        if ("children" in fragment) {
            return this.#fromDOMCollection(fragment.children);
        } else {
            return this.#fromDOMCollection(fragment);
        }
    }
    #fromDOMCollection(elements: HTMLCollection): MathGroup {
        let group: MathGroup = [];
        let currentNumber = "";
        let allowSelection = true;
        for (let element of elements) {
            if (element.tagName.substring(0,2).toLowerCase() != "z-") {
                continue;
            }
            let tagName = element.tagName.substring(2).toLowerCase();
            if (tagName == "num") {
                currentNumber += element.textContent ?? "";
            } else if (currentNumber.length > 0) {
                group.push(currentNumber);
                currentNumber = "";
            }
            if (tagName == "cursor") {
                if (allowSelection) {
                    group.push(SelectionStart, SelectionEnd);
                    allowSelection = false;
                }
            } else if (tagName == "selection") {
                if (allowSelection) {
                    group.push(SelectionStart, ...this.#fromDOMCollection(element.children), SelectionEnd);
                    allowSelection = false;
                }
            } else if (tagName == "func") {
                let name = element.getAttribute("name") ?? "";
                if (name.length == 0) {
                    name = element.textContent ?? "";
                }
                group.push({name: name, display: this.#fromDOMCollection(element.children)});
            } else if (tagName == "text") {
                group.push({text: element.textContent ?? ""});
            } else if (tagName == "brackets") {
                group.push({type: element.getAttribute("type") ?? "", contents: this.#fromDOMCollection(element.children)});
            } else if (tagName in argOrders) {
                let argOrder = argOrders[tagName];
                let args: ArgumentList = {};
                for (let argName of argOrder) {
                    let argElements = element.getElementsByTagName("z-"+argName);
                    if (argElements.length > 0) {
                        let contents = this.#fromDOMCollection(argElements[0].children);
                        if (contents.length > 0) {
                            args[argName] = contents;
                        }
                    }
                }
                group.push({operator: tagName, arguments: args});
            } else if (tagName != "num") {
                group.push(element.textContent ?? "");
            }
        }
        if (currentNumber.length > 0) {
            group.push(currentNumber);
        }
        return group;
    }
}

export class LaTeXProcessor 
{
    serialize(group: MG): string {
        if (!Array.isArray(group)) {
            return this.serializeUnit(group);
        }
        let final = "";
        for (let unit of group) {
            final += this.serializeUnit(unit);
        }
        return final;
    }
    serializeUnit(obj: MU): string {
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
    parse(text: string, maxUnits = -1, invalidMode: InvalidMode = "convert"): MG {
        let final = this.#parseUnits(text, maxUnits, false, invalidMode)[1].flat();
        return final.length == 1 ? final[0] : final;
    }
    #parseUnits(text: string, maxUnits = -1, strictGrouping = false, invalidMode: InvalidMode = "convert"): [number, MG[]] {
        text = text.replace(/\s/g, "");
        
        let i = 0;
        let final: MG[] = [];
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
    #generateJsObject(args: string, operator: string): [number, MU] {
        let argNums = complexOps[operator] ?? [0,0];
        if (argNums == [0,0]) {
            return [0, operator];
        }
        let optional: [number, MG[]] | undefined = undefined;
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
        let obj: MU;
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