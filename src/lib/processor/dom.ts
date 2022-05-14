import {
    Cursor,
    MathGroup,
    ArgumentList,
    MathUnit,
    SelectionIndex,
    JsMathObj,
    SelectionObj,
    FunctionObj,
    BracketObj,
} from "../types/math";


const opChars = ["=","+","-","*","⋅","/"];
const convertChars: {[op: string]: string} = {"*":"⋅"};
const argOrders: {[op: string]: string[]} = {"frac": ["numer", "denom"], "sscript": ["sup", "sub"], "root":["ord", "arg"]};

// Methods

export function cursorBackspace(parent1: MathUnit, parent2: MathUnit, index: string) {

}

export function emptyBackspace(parent1: MathUnit, parent2: MathUnit, index: string): [topParent: boolean, content?: MathGroup] {
    if (typeof parent2 == "object") {
        if ("operator" in parent2) {
            switch (parent2.operator) {
                case "frac":
                    return [true, Object.values(parent2.arguments)];
                case "sscript":
                    delete parent2.arguments[index];
                    if (Object.keys(parent2.arguments).length == 0) {
                        return [true];
                    } else {
                        parent2.arguments[Object.keys(parent2.arguments)[0]].push(Cursor);
                        return [true, [parent2]];
                    }
                case "root":
                    if (index == "arg") {
                        return [true];
                    } else {
                        delete parent2.arguments["ord"];
                        return [true, [parent2]];
                    }
                default:
                    return [true];
            }
        } else if ("display" in parent2) {
            return [true];
        }
    }
    /*if (typeof parent1 == "object") {
        if ("contents" in parent1 || "text" in parent1) {
            return [false];
        }
    }*/
    return [false];
}

export function inputKey(key: string, contents: MathGroup): void {
    let indices = selectionIndex(contents);
    let selection: any = fromIndex(contents, indices);
    let cursor = typeof selection == "symbol";
    let parent1 = fromIndex(contents, indices, 1) as MathGroup;
    let parent2: any = fromIndex(contents, indices, 2);
    let parentIndex = indices[indices.length-2] as string;
    let index = indices[indices.length-1] as number;
    delete parent1[index];
    let prev = parent1.splice(0, index);
    let post = parent1.splice(0);
    let autoPrev: MathGroup = cursor ? prev : selection.selection;
    switch (key.toLowerCase()) {
        case "/":
            parent1.splice(index, 0, [{operator:"frac", arguments:{"numer":[prev],"denom":[Cursor]}}, ...post]);
            break;
        case "^":
            if (parentIndex == "sub") {
                if (parent2.arguments["sup"]) {
                    parent2.arguments["sup"].push(Cursor);
                } else {
                    parent2.arguments["sup"] = [Cursor];
                }
                parent1.push(...autoPrev, post);
            } else {
                
            }
        case "_":
        case ")":
        case "]":
        case "}":
        case "(":
        case "[":
        case "{":
        case "|":
        default:
    }
}

function toGroup(unit: MathUnit): MathGroup {
    let val: MathGroup = [];
    if (typeof unit == "object") {
        if ("contents" in unit) {
            val = unit.contents;
        } else if ("display" in unit) {
            val = unit.display;
        } else if ("selection" in unit) {
            val = unit.selection;
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
                layer = toGroup(layer)[i];
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
    for (let s in contents) {
        let i = parseInt(s);
        let unit = contents[i];
        let subIndices: SelectionIndex;
        if (Array.isArray(unit)) {
            subIndices = selectionIndex(unit);
        } else if (typeof unit == "object") {
            if ("selection" in unit) {
                indices.push(i);
                break;
            } else {
                let val;
                if ("contents" in unit) {
                    val = unit.contents;
                    subIndices = selectionIndex(val);
                } else if ("display" in unit) {
                    val = unit.display;
                    subIndices = selectionIndex(val);
                } else {
                    val = unit.arguments;
                    subIndices = selectionIndexArgs(val);
                }
            }
        } else if (typeof unit == "symbol") {
            indices.push(i);
            break;
        } else {
            subIndices = [];
        }
        if (subIndices.length > 0) {
            indices.push(i, ...subIndices);
            break;
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

/*export function cursorKey(key: string, prevSelection: MathGroup, postSelection: MathGroup) {
    return inputKey(key, prevSelection, [Cursor], postSelection, true);
}
export function selectionKey(key: string, selection: MathGroup) {
    return inputKey(key, [], selection, [], false);
}
function inputKey(key: string, prevSelection: MathGroup, selection: MathGroup, postSelection: MathGroup, cursor: boolean): MathGroup {
    if (key in convertChars) {
        key = convertChars[key];
    }
    let autoSelection = cursor ? prevSelection : selection;
    let prevElement = prevSelection[prevSelection.length-1];
    switch (key.toLowerCase()) {
        case "/":
            return [{operator: "frac", arguments: {numer: autoSelection, denom: [Cursor]}}, ...postSelection];
        case "^":
            if (typeof prevElement == "object" && "operator" in prevElement && prevElement.operator == "sscript") {
                if ("sup" in prevElement.arguments) {
                    prevElement.arguments["sup"].push(Cursor);
                } else {
                    prevElement.arguments["sup"] = [Cursor];
                }
                return [...prevSelection, ...postSelection];
            }
            return [...prevSelection, {operator: "sscript", arguments: {sup: selection}}, ...postSelection];
        case "_":
            if (typeof prevElement == "object" && "operator" in prevElement && prevElement.operator == "sscript") {
                if ("sub" in prevElement.arguments) {
                    prevElement.arguments["sub"].push(Cursor);
                } else {
                    prevElement.arguments["sub"] = [Cursor];
                }
                return [...prevSelection, ...postSelection];
            }
            return [...prevSelection, {operator: "sscript", arguments: {sub: selection}}, ...postSelection];
        case ")":
            return [{type: "", contents: autoSelection}, Cursor];
        case "]":
            return [{type: "square", contents: autoSelection}, Cursor];
        case "}":
            return [{type: "curly", contents: autoSelection}, Cursor];
        case "(":
            return [...prevSelection, {type: "", contents: [...selection, ...postSelection]}];
        case "[":
            return [...prevSelection, {type: "square", contents: [...selection, ...postSelection]}];
        case "{":
            return [...prevSelection, {type: "curly", contents: [...selection, ...postSelection]}];
        case "|":
            return [...prevSelection, {type: "abs", contents: [...selection, ...postSelection]}];
        default:
            return [...prevSelection, key.charAt(0), Cursor, ...postSelection];
    }
}*/

export function toDOM(units: MathGroup): DocumentFragment {
    let allowSelection = true;
    let mainFragment = new DocumentFragment();
    for (let unit of units) {
        if (Array.isArray(unit)) {
            mainFragment.append(toDOM(unit));
        } else {
            if (typeof unit == "object") {
                let node;
                if ("operator" in unit) {
                    let op = unit.operator;
                    if (op == "int") {
                        node = document.createElement("z-sscript");
                    } else {
                        node = document.createElement("z-" + op);
                    }

                    node.append(...Object.entries(unit.arguments).sort((a, b) => {
                        if (op in argOrders) {
                            return argOrders[op].indexOf(a[0]) - argOrders[op].indexOf(b[0]);
                        }
                        return 0;
                    }).map(entry => {
                        let el = document.createElement("z-" + entry[0]);
                        el.append(toDOM(entry[1]));
                        return el;
                    }));

                    if (op == "int") {
                        let sscript = node;
                        node = document.createElement("z-"+op);
                        if (sscript.children.length > 0) {
                            node.append(sscript);
                        }
                    }
                } else if ("name" in unit) {
                    node = document.createElement("z-func");
                    node.setAttribute("name", unit.name);
                    node.append(toDOM(unit.display));
                } else if ("type" in unit) {
                    node = document.createElement("z-brackets");
                    node.setAttribute("type", unit.type);
                    node.append(toDOM(unit.contents));
                } else {
                    node = allowSelection ? document.createElement("z-selection") : new DocumentFragment();
                    allowSelection = false;
                    node.append(toDOM(unit.selection));
                }
                mainFragment.append(node);
            } else if (allowSelection && unit === Cursor) {
                mainFragment.append(document.createElement("z-cursor"));
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
                    mainFragment.append(el);
                }
            }
        }
    }
    return mainFragment;
}
export function fromDOM(elements: DocumentFragment|Iterable<Element>): MathGroup {
    if ("children" in elements) {
        return fromDOMCollection(elements.children);
    } else {
        return fromDOMCollection(elements);
    }
}
export function fromDOMItem(element: Element): MathUnit {
    return fromDOMCollection([element])[0];
}
function fromDOMCollection(elements: Iterable<Element>): MathUnit[] {
    let group: MathUnit[] = [];
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
                group.push(Cursor);
                allowSelection = false;
            }
        } else if (tagName == "selection") {
            if (allowSelection) {
                group.push({selection: fromDOMCollection(element.children)});
                allowSelection = false;
            } else {
                group.push(...fromDOMCollection(element.children));
            }
        } else if (tagName == "func") {
            let name = element.getAttribute("name") ?? "";
            if (name.length == 0) {
                name = element.textContent ?? "";
            }
            group.push({name: name, display: fromDOMCollection(element.children)});
        } else if (tagName == "brackets") {
            group.push({type: element.getAttribute("type") ?? "", contents: fromDOMCollection(element.children)});
        } else if (tagName in argOrders || tagName == "int") {
            let argOrder = argOrders[tagName == "int" ? "sscript" : tagName];
            let args: ArgumentList = {};
            for (let argName of argOrder) {
                let argElements = element.getElementsByTagName("z-"+argName);
                if (argElements.length > 0) {
                    let contents = fromDOMCollection(argElements[0].children);
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