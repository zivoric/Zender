import { ArgumentList, Cursor, MathGroup } from "../types/math";
import { argOrders } from "./dom";

const characters: {[op: string]: string} = {"Delta": "∆", "Gamma": "Γ", "Lambda": "Λ", "Omega": "Ω", "Phi": "Φ", "Pi": "Π",
    "Psi": "Ψ", "Sigma": "Σ", "Theta": "Θ", "Upsilon": "Υ", "Xi": "Ξ", "aleph": "ℵ", "alpha": "α", "beta": "β", "chi": "χ",
    "delta": "δ", "digamma": "ϝ", "epsilon": "ϵ", "eta": "η", "gamma": "γ", "iota": "ι", "kappa": "κ", "lambda": "λ",
    "mu": "µ", "nu": "ν", "omega": "ω", "phi": "ϕ", "pi": "π", "psi": "ψ", "rho": "ρ", "sigma": "σ", "tau": "τ", "theta": "θ",
    "upsilon": "υ", "varepsilon": "ε", "varkappa": "ϰ", "varphi": "φ", "varpi": "ϖ", "varrho": "ϱ", "varsigma": "ς",
    "vartheta": "ϑ", "xi": "ξ", "zeta": "ζ"};

// LaTeX name
const simpleOps = ["int"];

const specialOps = ["^","_"];

const parseRegex = /((\\left(\\{|(\\?[{[(|]))|{).*?(\\right(\\}|(\\?[}\])|]))|}))|(\\[a-z]+)|(\\.)|./gi;

// LaTeX: DOM
const convertArgs: {[latex: string]: string} = {"sqrt":"root"};

// LaTeX: # optional args
const optionalNums: {[op: string]: number} = {"sqrt":1};

const bracketTypes: {[left: string]: string} = {"[":"square","{":"curly","(":"", "|":"abs"};

const matchingBrackets: {[left: string]: string} = {"(":")", "[":"]", "\\{":"\\}", "|":"|"};

// Format - "operator name": [required args, optional args]
type InvalidMode = "convert"|"remove"|"include";

// Methods

export function parse(text: string, invalidMode: InvalidMode = "convert"): MathGroup {
    let separated = text.match(parseRegex);
    return parseSeparated(separated ?? [], invalidMode);
}

function parseSeparated(separated: RegExpMatchArray, invalidMode: InvalidMode = "convert"): MathGroup {
    let group: MathGroup = [];
    while (separated.length > 0) {
        let first: string = separated.splice(0, 1)[0];
        try {
            if (first.startsWith("\\left") && first.indexOf("\\right") != -1) {
                let leftBracket = first.substring(5,6);
                if (leftBracket == "\\") {
                    leftBracket = first.substring(6,7);
                }
                group.push({type: bracketTypes[leftBracket], contents: parse(first.substring(first.indexOf(leftBracket)+1, first.indexOf("\\right")), invalidMode)});
            } else if (first.charAt(0) == "\\" || specialOps.includes(first)) {
                let op, latexOp;
                if (first.charAt(0) == "\\") {
                    op = first.substring(1);
                    if (op.length == 1) { // escape character
                        group.push(op);
                        continue;
                    }
                    latexOp = op;
                    if (op in convertArgs) { // convert latex to DOM names
                        op = convertArgs[op];
                    }
                } else {
                    op = first;
                    latexOp = op;
                }
                if (op == "^") {
                    let parsed = parse(separated.splice(0, 1)[0], invalidMode);
                    let lastItem = group[group.length-1];
                    if (group.length > 0 && typeof lastItem == "object" && "operator" in lastItem && lastItem.operator == "sscript") {
                        if ("sup" in lastItem.arguments) {
                            lastItem.arguments["sup"].push(...parsed);
                        } else {
                            lastItem.arguments["sup"] = parsed;
                        }
                    } else {
                        group.push({operator: "sscript", arguments:{sup: parsed}});
                    }
                } else if (op == "_") {
                    let parsed = parse(separated.splice(0, 1)[0], invalidMode);
                    let lastItem = group[group.length-1];
                    if (group.length > 0 && typeof lastItem == "object" && "operator" in lastItem && lastItem.operator == "sscript") {
                        if ("sub" in lastItem.arguments) {
                            lastItem.arguments["sub"].push(...parsed);
                        } else {
                            lastItem.arguments["sub"] = parsed;
                        }
                    } else {
                        group.push({operator: "sscript", arguments:{sub: parsed}});
                    }
                }/* else if (op == "left") {
                    let leftBracket: string = separated.slice(0, 1)[0];
                    if (!(leftBracket in matchingBrackets)) {
                        break;
                    }
                    let rightBracket = matchingBrackets[leftBracket];
                    let rightIndex = separated.indexOf("\\right");
                    if (rightIndex == -1 || (rightIndex < separated.length - 1 && separated[rightIndex + 1] != rightBracket)) {
                        if (rightIndex < separated.length - 1 && separated[rightIndex + 1] != rightBracket) {
                            separated.splice(rightIndex, 1);
                        }
                        rightIndex = separated.length;
                    }
                    group.push({
                        type: bracketTypes[leftBracket],
                        contents: parseSeparated(separated.splice(1, rightIndex), invalidMode)
                    });
                }*/ else {
                    if (op in argOrders) {
                        let argList: ArgumentList = {};
                        let optional = latexOp in optionalNums ? optionalNums[latexOp] : 0;
                        let optionalRemaining = optional;
                        let order = argOrders[op];
                        for (let i = 0; optional+i < order.length; i++) {
                            if (separated.length == 0) {
                                argList[order[optional+i]] = [];
                                continue;
                            }
                            let currentArg = separated.splice(0, 1)[0];
                            if (currentArg.startsWith("[") && optionalRemaining) {
                                let rightBracket = separated.indexOf("]");
                                if (rightBracket != -1) {
                                    let currentArgs = separated.splice(0,rightBracket+1).slice(0,rightBracket);
                                    argList[order[optional-optionalRemaining+i]] = parseSeparated(currentArgs, invalidMode);
                                    optionalRemaining--;
                                    i--;
                                } else {
                                    optionalRemaining = 0;
                                    argList[order[optional+i]] = parse(currentArg, invalidMode);
                                }
                            } else {
                                if (optionalRemaining) {
                                    optionalRemaining = 0;
                                }
                                argList[order[optional+i]] = parse(currentArg, invalidMode);
                            }
                        }
                        group.push({operator: op, arguments: argList});
                    } else if (latexOp in characters) {
                        group.push(characters[latexOp]);
                    } else if (simpleOps.includes(latexOp)) {
                        group.push({operator: op, arguments: {}});
                    } else {
                        switch (invalidMode) {
                            case "include":
                                group.push({operator: op, arguments: {}});
                                break;
                            case "remove":
                                break;
                            case "convert":
                            default:
                                group.push(...Array.from(latexOp));
                        }
                    }
                }
            } else if (first.startsWith("{") && first.endsWith("}")) {
                group.push(...parse(first.substring(1, first.length - 1), invalidMode));
            } else if (first.trim().length > 0) {
                group.push(first);
            }
        } catch {}
    }
    return group;
}

function separate(latex: string): string[] {
    let arr: string[] = [];
    while (latex.length > 0) {

    }
    return arr;
}

/*
export function serialize(group: LaTeXGroup): string {
    if (!Array.isArray(group)) {
        return serializeUnit(group);
    }
    let final = "";
    for (let unit of group) {
        final += serializeUnit(unit);
    }
    return final;
}
export function serializeUnit(obj: LaTeXUnit): string {
    if (typeof obj == "object") {
        let final = obj.operator;
        if (obj.optional && obj.optional.length > 0) {
            final += obj.optional.map((arg,i)=>{
                let s = serialize(arg);
                if (s != "" || i < obj.optional!.length-1) {
                    return "[" + s + "]";
                }
            }).join("");
        }
        if (obj.required && obj.required.length > 0) {
            final += obj.required.map(arg=>{
                let s = serialize(arg);
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
export function parse(text: string, maxUnits = -1, invalidMode: InvalidMode = "convert"): LaTeXGroup {
    let final = parseUnits(text, maxUnits, false, invalidMode)[1].flat();
    return final.length == 1 ? final[0] : final;
}
function parseUnits(text: string, maxUnits = -1, strictGrouping = false, invalidMode: InvalidMode = "convert"): [number, LaTeXGroup[]] {
    text = text.replace(/\s/g, "");

    let i = 0;
    let final: LaTeXGroup[] = [];
    while (i < text.length && (maxUnits == -1 || final.length < maxUnits)) {
        if (text[i] == "{") {
            let end = bracketEnd(text, i);
            if (strictGrouping) {
                let units = parseUnits(text.substring(i+1, end))[1].flat();
                final.push(units.length == 1 ? units[0] : units);
            } else {
                final.push(...parseUnits(text.substring(i+1, end))[1]);
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
                    let unit = generateJsObject(text.substring(end), operator);
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
            let unit = generateJsObject(text.substring(i+1),text[i]);
            final.push(unit[1]);
            i += unit[0]+1;
        } else {
            final.push(text[i]);
            i++;
        }
    }
    return [i, final];
}
function bracketEnd(text: string, start = 0, leftBracket = "{", rightBracket = "}"): number {
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
function generateJsObject(args: string, operator: string): [number, LaTeXUnit] {
    let argNums = complexOps[operator] ?? [0,0];
    if (argNums == [0,0]) {
        return [0, operator];
    }
    let optional: [number, LaTeXGroup[]] | undefined = undefined;
    if (argNums[1] > 0) {
        optional = [0, []];
        let optMatches = args.match(new RegExp(`^(\\[[^\\]]*\\]){1,${argNums[1]}}`,"g"));
        if (optMatches && optMatches.length > 0) {
            let bracketStr = optMatches[0];
            optional[0] = bracketStr.length;
            let bracketArgs = optMatches[0].match(/(\[[^\]]*?\])/g)!;
            optional[1] = bracketArgs.map(arg => parse(arg.substring(1,arg.length-1)));
        }
    }
    let required = parseUnits(args.substring(optional?.[0] ?? 0), argNums[0], true);
    let obj: LaTeXUnit;
    obj = {
        operator: operator,
        required: required[1]
    }
    if (optional) {
        obj.optional = optional[1];
    }
    return [(optional?.[0] ?? 0) + required[0], obj];
}*/