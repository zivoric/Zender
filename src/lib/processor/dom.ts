import {ArgumentList, Cursor, LaTeXObj, MathGroup, MathUnit, SelectionIndex,} from "../types/math";

import {parse as latexParse} from "./latex";

const hasSelection = (value: MathUnit): boolean => {
    return value == Cursor || (typeof value == "object" && "selection" in value);
};

export const opChars = ["=","+","-","*","/","!","%","<",">"," "];
export const convertChars: {[op: string]: string} = {"*":"⋅", "-":"\u2212"};
export const convertCharsReverse: {[op: string]: string} = {};
for (let key in convertChars) {
    convertCharsReverse[convertChars[key]] = key;
}

// list all optional arguments first for LaTeX

export const argOrders: {[op: string]: string[]} = {"frac": ["numer", "denom"], "sscript": ["sup", "sub"], "root":["ord", "arg"]};

// Methods

export function inputKey(key: string, shift: boolean, contents: MathGroup): void {
    let indices = selectionIndex(contents);
    let selection: any = fromIndex(contents, indices);
    let cursor = typeof selection == "symbol";
    let baseParent1: any = fromIndex(contents, indices, 1)!;
    let parent1 = getGroup(baseParent1);
    let parent2: any = indices.length >= 2 ? fromIndex(contents, indices, 2) : undefined;
    let parentIndex: any = indices[indices.length-2];
    let index = indices[indices.length-1] as number;
    delete parent1[index];
    let prev = parent1.splice(0, index);
    let post = parent1.splice(1);
    let sel = cursor ? [] : selection.selection;
    let selPrev: MathGroup = cursor ? prev : sel;
    let selPost: MathGroup = cursor ? post : sel;
    let autoPrev = cursor ? [] : prev;
    let autoPost = cursor ? [] : post;
    let navigationKey = true;
    switch (key.toLowerCase()) {
        case "backspace":
            if (cursor) {
                if (prev.length > 0) {
                    let prevElement = prev[prev.length-1];
                    if (typeof prevElement == "object") {
                        if ("operator" in prevElement) {
                            let keys = Object.keys(prevElement.arguments);
                            if (keys.length > 0) {
                                prevElement.arguments[keys[keys.length-1]].push(Cursor);
                            } else {
                                prev.pop();
                                prev.push(Cursor);
                            }
                        } else {
                            getGroup(prevElement).push(Cursor);
                        }
                    } else {
                        prev.pop();
                        prev.push(Cursor);
                    }
                    parent1.push(...prev, ...post);
                } else {
                    if (indices.length > 2 && "operator" in parent2) {
                        let arg = indices[indices.length-2] as string;
                        let parent3 = getGroup(fromIndex(contents, indices, 3)!);
                        let i = indices[indices.length-3] as number;
                        parent2.arguments[arg].push(Cursor, ...post);
                        let argContents = parent2.arguments[arg];
                        let vals = Object.values(parent2.arguments as ArgumentList).flat();
                        delete parent2.arguments[arg];
                        let len = Object.keys(parent2.arguments).length;
                        switch (parent2.operator) {
                            case "sscript":
                                if (len == 0) {
                                    parent3.splice(i,1,...vals);
                                } else {
                                    if (arg == "sup") {
                                        parent3.splice(i+1,0,Cursor,...argContents);
                                    } else {
                                        parent3.splice(i,0,Cursor,...argContents);
                                    }
                                }
                                break;
                            default:
                                parent3.splice(i,1,...vals);
                        }
                    } else if (indices.length > 1) {
                        let group2 = getGroup(parent2);
                        if ("latex" in baseParent1) {
                            group2.splice(parentIndex, 1, Cursor);
                        } else {
                            group2.splice(parentIndex, 1, Cursor, ...post);
                        }
                    } else {
                        parent1.push(Cursor, ...post);
                    }
                }
            } else {
                parent1.push(...prev, Cursor, ...post);
            }
            break;
        case "arrowleft":
            if (shift) {
                let pivot = cursor || selection.pivot;
                let replaceCursor = true;
                if (pivot) {
                    if (prev.length > 0) {
                        sel.unshift(prev.pop());
                    } else if (indices.length > 1) {
                        let parentLevel = "operator" in parent2 ? 3 : 2;
                        let group = getGroup(fromIndex(contents, indices, parentLevel)!);
                        let pIndex = indices[indices.length-parentLevel] as number;
                        group.splice(pIndex, 0, {selection: group.splice(pIndex, 1), pivot: pivot});
                    }
                } else {
                    if (sel.length == 1 && typeof sel[0] == "object") {
                        let obj = sel[0];
                        if ("operator" in obj) {
                            let vals = Object.values(obj.arguments as ArgumentList);
                            replaceCursor = !vals.some(val=>val.some(hasSelection));
                        } else {
                            let group = getGroup(obj);
                            replaceCursor = !group.some(hasSelection);
                        }
                        if (!replaceCursor) {
                            post.unshift(sel.pop());
                        }
                    } else {
                        post.unshift(sel.pop());
                    }
                }
                if (replaceCursor) {
                    if (sel.length == 0) {
                        prev.push(Cursor);
                    } else {
                        prev.push({selection: sel, pivot: pivot});
                    }
                }
                parent1.push(...prev, ...post);
            } else {
                if (cursor) {
                    if (prev.length > 0) {
                        let prevElement = prev[prev.length - 1];
                        if (typeof prevElement == "object") {
                            if ("operator" in prevElement) {
                                let args = Object.keys(prevElement.arguments);
                                if (args.length > 0) {
                                    prevElement.arguments[args[args.length - 1]].push(Cursor);
                                } else {
                                    prev.splice(prev.length-1,0,Cursor);
                                }
                            } else {
                                let group = getGroup(prevElement);
                                group.push(Cursor);
                            }
                        } else {
                            prev.splice(prev.length - 1, 0, Cursor);
                        }
                    } else if (parent2) {
                        if ("operator" in parent2) {
                            let args = Object.keys(parent2.arguments);
                            let argIndex = args.indexOf(parentIndex);
                            if (argIndex > 0) {
                                parent2.arguments[args[argIndex - 1]].push(Cursor);
                            } else {
                                let parent3 = getGroup(fromIndex(contents, indices, 3)!);
                                parent3.splice(indices[indices.length - 3] as number, 0, Cursor);
                            }
                        } else {
                            let group2 = getGroup(parent2);
                            group2.splice(parentIndex, 0, Cursor);
                        }
                    } else {
                        prev.push(Cursor);
                    }
                    parent1.push(...prev, ...post);
                } else {
                    parent1.push(...prev, Cursor, ...sel, ...post);
                }
            }
            break;
        case "arrowright":
            if (shift) {
                let pivot = !cursor && selection.pivot;
                let replaceCursor = true;
                if (!pivot) {
                    if (post.length > 0) {
                        sel.push(post.shift());
                    } else if (indices.length > 1) {
                        let parentLevel = "operator" in parent2 ? 3 : 2;
                        let group = getGroup(fromIndex(contents, indices, parentLevel)!);
                        let pIndex = indices[indices.length-parentLevel] as number;
                        group.splice(pIndex, 0, {selection: group.splice(pIndex, 1), pivot: pivot});
                    }
                } else {
                    if (sel.length == 1 && typeof sel[0] == "object") {
                        let obj = sel[0];
                        if ("operator" in obj) {
                            let vals = Object.values(obj.arguments as ArgumentList);
                            replaceCursor = !vals.some(val=>val.some(hasSelection));
                        } else {
                            let group = getGroup(obj);
                            replaceCursor = !group.some(hasSelection);
                        }
                        if (!replaceCursor) {
                            prev.push(sel.shift());
                        }
                    } else {
                        prev.push(sel.shift());
                    }
                }
                if (replaceCursor) {
                    if (sel.length == 0) {
                        prev.push(Cursor);
                    } else {
                        prev.push({selection: sel, pivot: pivot});
                    }
                }
                parent1.push(...prev, ...post);
            } else {
                if (cursor) {
                    if (post.length > 0) {
                        let postElement = post[0];
                        if (typeof postElement == "object") {
                            if ("operator" in postElement) {
                                let args = Object.keys(postElement.arguments);
                                if (args.length > 0) {
                                    postElement.arguments[args[0]].unshift(Cursor);
                                } else {
                                    post.splice(1, 0, Cursor);
                                }
                            } else {
                                let group = getGroup(postElement);
                                group.unshift(Cursor);
                            }
                        } else {
                            post.splice(1, 0, Cursor);
                        }
                    } else if (parent2) {
                        if ("operator" in parent2) {
                            let args = Object.keys(parent2.arguments);
                            let argIndex = args.indexOf(parentIndex);
                            if (argIndex < args.length - 1) {
                                parent2.arguments[args[argIndex + 1]].unshift(Cursor);
                            } else {
                                let parent3 = getGroup(fromIndex(contents, indices, 3)!);
                                parent3.splice(indices[indices.length - 3] as number + 1, 0, Cursor);
                            }
                        } else {
                            let group2 = getGroup(parent2);
                            group2.splice(parentIndex + 1, 0, Cursor);
                        }
                    } else {
                        post.unshift(Cursor);
                    }
                    parent1.push(...prev, ...post);
                } else {
                    parent1.push(...prev, ...sel, Cursor, ...post);
                }
            }
            break;
        default:
            navigationKey = false;
            break;
    }
    if (navigationKey) {
        return;
    }
    if ("latex" in baseParent1) {
        if (key == " " || key.toLowerCase() == "tab" || key.toLowerCase() == "enter")  {
            parent1.push(...prev, ...post);
            getGroup(parent2).splice(parentIndex, 1, ...latexParse((baseParent1 as LaTeXObj).latex.join("")), Cursor);
        } else if (key.length == 1) {
            parent1.push(...prev, key, Cursor, ...post);
        } else {
            parent1.push(...prev, Cursor, ...post);
        }
        return;
    }
    switch (key.toLowerCase()) {
        case "\\":
            parent1.push(...prev, {latex: ["\\",Cursor]}, ...post);
            break;
        case "$":
            parent1.push(...prev, {latex: [Cursor]}, ...post);
            break;
        case "/":
            parent1.splice(index, 0, ...autoPrev, {operator: "frac", arguments: {"numer": [...selPrev], "denom": [Cursor]}}, ...post);
            break;
        case "^":
            if (parentIndex == "sub" && parent2.operator == "sscript") {
                if (parent2.arguments["sup"]) {
                    parent2.arguments["sup"].push(Cursor);
                } else {
                    parent2.arguments["sup"] = [Cursor];
                }
                parent1.push(...prev, ...sel, ...post);
            } else {
                let prevElement = prev.slice(prev.length-1, prev.length)[0];
                let postElement = post.slice(0,1)[0];
                if (typeof prevElement == "object" && "operator" in prevElement && (prevElement.operator == "sscript")) {
                    if (prevElement.arguments["sup"]) {
                        prevElement.arguments["sup"].push(...sel, Cursor);
                    } else {
                        prevElement.arguments["sup"] = [...sel, Cursor];
                    }
                    parent1.push(...prev, ...post);
                } else if (typeof postElement == "object" && "operator" in postElement && (postElement.operator == "sscript")) {
                    if (postElement.arguments["sup"]) {
                        postElement.arguments["sup"].unshift(Cursor, ...sel);
                    } else {
                        postElement.arguments["sup"] = [Cursor, ...sel];
                    }
                    parent1.push(...prev, ...post);
                } else {
                    parent1.push(...prev, {operator: "sscript", arguments:{sup:[...sel, Cursor]}}, ...post);
                }
            }
            break;
        case "_":
            if (parentIndex == "sup" && parent2.operator == "sscript") {
                if (parent2.arguments["sub"]) {
                    parent2.arguments["sub"].push(Cursor);
                } else {
                    parent2.arguments["sub"] = [Cursor];
                }
                parent1.push(...prev, ...sel, ...post);
            } else {
                let prevElement = prev.slice(prev.length-1, prev.length)[0];
                let postElement = post.slice(0,1)[0];
                if (typeof prevElement == "object" && "operator" in prevElement && (prevElement.operator == "sscript")) {
                    if (prevElement.arguments["sub"]) {
                        prevElement.arguments["sub"].push(...sel, Cursor);
                    } else {
                        prevElement.arguments["sub"] = [...sel, Cursor];
                    }
                    parent1.push(...prev, ...post);
                } else if (typeof postElement == "object" && "operator" in postElement && (postElement.operator == "sscript")) {
                    if (postElement.arguments["sub"]) {
                        postElement.arguments["sub"].unshift(Cursor, ...sel);
                    } else {
                        postElement.arguments["sub"] = [Cursor, ...sel];
                    }
                    parent1.push(...prev, ...post);
                } else {
                    parent1.push(...prev, {operator: "sscript", arguments:{sub:[...sel, Cursor]}}, ...post);
                }
            }
            break;
        case ")":
            parent1.push(...autoPrev, {type: "", contents: selPrev}, Cursor, ...post);
            break;
        case "]":
            parent1.push(...autoPrev, {type: "square", contents: selPrev}, Cursor, ...post);
            break;
        case "}":
            parent1.push(...autoPrev, {type: "curly", contents: selPrev}, Cursor, ...post);
            break;
        case "(":
            parent1.push(...prev, {type: "", contents: [Cursor, ...selPost]}, ...autoPost);
            break;
        case "[":
            parent1.push(...prev, {type: "square", contents: [Cursor, ...selPost]}, ...autoPost);
            break;
        case "{":
            parent1.push(...prev, {type: "curly", contents: [Cursor, ...selPost]}, ...autoPost);
            break;
        case "|":
            parent1.push(...prev, {type: "abs", contents: [Cursor, ...selPost]}, ...autoPost);
            break;
        default:
            if (key.length == 1 && (/[a-zA-Z0-9\.]/.test(key) || opChars.includes(key))) {
                parent1.push(...prev, key, Cursor, ...post);
            } else {
                parent1.push(...prev, selection, ...post);
            }
    }
}

export function getGroup(unit: MathUnit|MathGroup): MathGroup {
    let val: MathGroup = [];
    if (Array.isArray(unit)) {
        return unit;
    } else if (typeof unit == "object") {
        if ("contents" in unit) {
            val = unit.contents;
        } else if ("display" in unit) {
            val = unit.display;
        } else if ("selection" in unit) {
            val = unit.selection;
        } else if ("latex" in unit) {
            val = unit.latex;
        }
    }
    return val;
}

export function fromIndex(group: MathGroup, index: SelectionIndex, parentLevel?: number): MathGroup|MathUnit|undefined {
    let layer: MathGroup|MathUnit|undefined = group;
    if (parentLevel) {
        index = index.slice(0,index.length - parentLevel);
    }
    for (let i of index) {
        if (!layer) {
            break;
        }
        if (typeof i == "number") {
            if (Array.isArray(layer)) {
                layer = layer[i];
            } else {
                layer = getGroup(layer)[i];
            }
        } else if (typeof layer == "object" && "arguments" in layer) {
            layer = layer.arguments[i];
        } else {
            layer = undefined;
            break;
        }
    }
    return layer;
}

export function selectionIndex(contents: MathGroup): SelectionIndex {
    let indices: SelectionIndex = [];
    let foundIndex = contents.findIndex(val => {
        return val == Cursor || (typeof val == "object" && "selection" in val);
    });
    if (foundIndex != -1) {
        indices.push(foundIndex);
    } else {
        for (let s in contents) {
            let i = parseInt(s);
            let unit = contents[i];
            let subIndices: SelectionIndex;
            if (typeof unit == "object") {
                let val;
                if ("operator" in unit) {
                    val = unit.arguments;
                    subIndices = selectionIndexArgs(val);
                } else {
                    val = getGroup(unit);
                    subIndices = selectionIndex(val);
                }
            } else {
                subIndices = [];
            }
            if (subIndices.length > 0) {
                indices.push(i, ...subIndices);
                break;
            }
        }
    }
    
    return indices;
}

function selectionIndexArgs(args: ArgumentList): SelectionIndex {
    let indices: SelectionIndex = [];
    for (let arg of Object.keys(args)) {
        let subIndices = selectionIndex(args[arg]);
        if (subIndices.length > 0) {
            indices.push(arg, ...subIndices);
            break;
        }
    }
    return indices;
}

export function toDOM(units: MathGroup, allowSelection = true, convert = true): DocumentFragment {
    let hasSelect = !allowSelection || units.some(hasSelection);
    let mainFragment = new DocumentFragment();
    for (let unit of units) {
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
                    el.append(toDOM(entry[1], !hasSelect, convert));
                    return el;
                }));
            } else if ("name" in unit) {
                node = document.createElement("z-func");
                node.setAttribute("name", unit.name);
                node.append(toDOM(unit.display, !hasSelect, convert));
            } else if ("type" in unit) {
                node = document.createElement("z-brackets");
                node.setAttribute("type", unit.type);
                node.append(toDOM(unit.contents, !hasSelect, convert));
            } else if ("latex" in unit) {
                node = document.createElement("z-latex");
                node.append(toDOM(unit.latex, !hasSelect, false));
            } else {
                node = allowSelection ? document.createElement("z-selection") : new DocumentFragment();
                if (allowSelection) {
                    (node as HTMLElement).setAttribute("pivot", unit.pivot ? "right" : "left");
                }
                node.append(toDOM(unit.selection, allowSelection, convert));
                allowSelection = false;
            }
            mainFragment.append(node);
        } else if (allowSelection && unit === Cursor) {
            mainFragment.append(document.createElement("z-cursor"));
            allowSelection = false;
        } else if (typeof unit == "string") {
            for (let char of Array.from(unit)) {
                let name;
                if (/\d|\./.test(char)) {
                    name = "z-num";
                } else if (opChars.includes(char)) {
                    if (convert && char in convertChars) {
                        char = convertChars[char];
                    }
                    name = "z-op";
                } else {
                    name = "z-var";
                }
                let el = document.createElement(name);
                el.append(char);
                mainFragment.append(el);
            }
        }
    }
    return mainFragment;
}
export function fromDOM(elements: DocumentFragment|Iterable<Element>, allowSelection = true): MathGroup {
    if ("children" in elements) {
        return fromDOMCollection(elements.children, allowSelection);
    } else {
        return fromDOMCollection(elements, allowSelection);
    }
}
export function fromDOMItem(element: Element, allowSelection = true): MathUnit {
    return fromDOMCollection([element], allowSelection)[0];
}
function fromDOMCollection(iterable: Iterable<Element>, allowSelection = true, convert = true): MathUnit[] {
    let elements = Array.from(iterable);
    let group: MathUnit[] = [];
    let hasSelect = !allowSelection || elements.some(el => el.tagName == "z-cursor" || el.tagName == "z-selection");
    for (let element of elements) {
        if (element.tagName.substring(0,2).toLowerCase() != "z-") {
            continue;
        }
        let tagName = element.tagName.substring(2).toLowerCase();
        if (tagName == "cursor") {
            if (allowSelection) {
                group.push(Cursor);
                allowSelection = false;
            }
        } else if (tagName == "selection") {
            if (allowSelection) {
                let pivot = element.getAttribute("pivot") ?? "left";
                group.push({selection: fromDOMCollection(element.children, allowSelection, convert), pivot: pivot == "right"});
                allowSelection = false;
            } else {
                group.push(...fromDOMCollection(element.children, allowSelection, convert));
            }
        } else if (tagName == "func") {
            let name = element.getAttribute("name") ?? "";
            if (name.length == 0) {
                name = element.textContent ?? "";
            }
            group.push({name: name, display: fromDOMCollection(element.children, !hasSelect, convert)});
        } else if (tagName == "brackets") {
            group.push({type: element.getAttribute("type") ?? "", contents: fromDOMCollection(element.children, !hasSelect, convert)});
        } else if (tagName == "latex") {
            group.push({latex: fromDOMCollection(element.children, !hasSelect, false)});
        } else if (tagName in argOrders) {
            let argOrder = argOrders[tagName];
            let args: ArgumentList = {};
            for (let argName of argOrder) {
                let argElements = element.querySelector(":scope > z-"+argName);
                if (argElements) {
                    let contents = fromDOMCollection(argElements.children, !hasSelect, convert);
                    args[argName] = contents;
                }
            }
            group.push({operator: tagName, arguments: args});
        } else {
            let content = element.textContent ?? "";
            if (convert && content in convertCharsReverse) {
                content = convertCharsReverse[content];
            }
            group.push(content);
        }
    }
    return group;
}