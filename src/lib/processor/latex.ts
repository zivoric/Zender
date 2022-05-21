import { ArgumentList, MathGroup } from "../types/math";
import { argOrders } from "./dom";

const simpleOps = [ "=","+","-","*","/", // Symbols
    "\\left", "\\right", "\\{", "\\}", "[", "]", "(", ")", // Delimiters
    "\\pi", "\\epsilon" // Letters
];

const parseRegex = /(\\[a-z]+)|(\\.)|(\[.*?\])|({.*?})|./gi;

const convertArgs: {[latex: string]: string} = {"sqrt":"root"};

const optionalNums: {[op: string]: number} = {"sqrt":1};

// Format - "operator name": [required args, optional args]
type InvalidMode = "convert"|"remove"|"include";

// Methods

export function parse(text: string, invalidMode: InvalidMode = "convert"): MathGroup {
    let separated = text.match(parseRegex);
    let group: MathGroup = [];
    if (separated) {
        while (separated.length > 0) {
            let first: string = separated.splice(0,1)[0];
            if (first.charAt(0) == "\\") {
                let op = first.substring(1);
                if (op in convertArgs) {
                    op = convertArgs[op];
                }
                switch (op) {
                    default:
                        if (op in argOrders) {
                            let argList: ArgumentList = {};
                            let optional = op in optionalNums ? optionalNums[op] : 0;
                            let currentArg = separated.splice(0,1)[0];
                            for (let argName of argOrders[op]) {
                                if (separated.length == 0) {
                                    break;
                                }
                                if (currentArg.startsWith("[") && currentArg.endsWith("]")) {
                                    if (optional) {
                                        argList[argName] = parse(currentArg.substring(1,currentArg.length-1));
                                    } else {
                                        separated.unshift("[", ...currentArg.substring(1,currentArg.length-1).match(parseRegex) ?? [], "]");
                                    }
                                    currentArg = separated.splice(0,1)[0];
                                } else {
                                    argList[argName] = parse(separated.splice(0,1)[0]);
                                }
                            }
                        }
                } 
            }
        }
    }
    return group;
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