import * as Text from './types/texts'
import {LaTeXProcessor as LP, DOMProcessor as DP} from '../index';
import { Optionable } from './types/api';
import {Cursor, MathGroup} from './types/math';

export class MathText extends Optionable<Text.TextOptions> implements Text.IMathText {
    private static readonly _defaultOptions: Text.TextOptions = {
        allowVariables: true,
        allowFunctions: true,
        format: "latex"
    };
    private readonly _element: HTMLElement;
    private readonly _contents: HTMLElement;

    constructor(el: HTMLElement, options?: Text.TextOptions) {
        super(MathText._defaultOptions, options);
        el.setAttribute("z-field","");
        this._element = el;
        this._contents = document.createElement("z-contents");
        let format = this.options.format.toLowerCase();
        switch (format) {
            case "dom":
                this._contents.append(...el.children);
                break;
            case "latex":
            default:
                // TODO: Bridge LaTeX to current JS object model
                break;
        }
        el.append(this._contents);
    }
    get contentHTML(): HTMLElement {
        return this._contents;
    }

    get contentJS(): MathGroup {
        return DP.fromDOM(this.contentHTML.children, false);
    }

    set contentJS(content: MathGroup) {
        this.contentHTML.replaceChildren(DP.toDOM(content, false));
    }

    get element(): HTMLElement {
        return this._element;
    }
}

export class MathField extends MathText {
    #disabled: boolean = false;
    constructor(el: HTMLElement, options?: Text.TextOptions) {
        super(el, options);
        el.setAttribute("tabindex", "-1");
        this.contentHTML.append(document.createElement("z-cursor"));
        el.addEventListener("mousedown", e => {
            if (this.#disabled) {
                e.preventDefault();
            }
        });

        el.addEventListener("documentpaste", (e: any) => {
            let data = e.detail.clipboardData?.getData("text");
            if (data && data.length > 0) {
                let cursor = this.contentHTML.querySelector("z-cursor");
                if (cursor) {
                    cursor.parentNode?.insertBefore(DP.toDOM(LP.parse(data)), cursor);
                }
            }
        });

        el.addEventListener("keydown", (e) => {
            if (!e.ctrlKey) {
                e.preventDefault();
                let contents = this.selectableContent;
                DP.inputKey(e.key, e.shiftKey, contents);
                this.selectableContent = contents;
            }
            /*let cursor = false;
            let selection = this.contents.getElementsByTagName("z-selection")[0];
            if (!selection) {
                cursor = true;
                selection = this.contents.getElementsByTagName("z-cursor")[0];
            }
            switch (e.key.toLowerCase()) {
                case "backspace":
                    if (cursor) {
                        let previous = selection.previousSibling;
                        if (previous) {
                            previous.remove();
                        } else {
                            let parent1 = selection.parentElement!;
                            let parent2 = parent1.parentElement!;
                            selection.remove();
                            let results = DP.emptyBackspace(DP.fromDOMItem(parent1), DP.fromDOMItem(parent2), parent1.tagName.substring(2));
                            let replace = results[1] ?? [];
                            if (results[0]) {
                                console.log("gp", DP.toDOM([...replace, Cursor]));
                                parent2.replaceWith(DP.toDOM([...replace, Cursor]));
                            } else {
                                console.log("p", DP.toDOM([...replace, Cursor]));
                                parent1.replaceWith(DP.toDOM([...replace, Cursor]));
                            }
                        }
                    } else {
                        selection.replaceWith(document.createElement("z-cursor"));
                    }
                    break;
                case "arrowleft":
                    if (cursor) {
                        
                    } else {
                        selection.replaceWith(document.createElement("z-cursor"), ...selection.children);
                    }
                    break;
                default:
                    if (e.key.length > 1) {
                        break;
                    }
                    if (cursor) {
                        let parent = selection.parentElement!;
                        let siblings = Array.from(parent.children);
                        let index = siblings.indexOf(selection);
                        parent.replaceChildren(DP.toDOM(DP.cursorKey(e.key ?? "", DP.fromDOM(siblings.slice(0,index)), DP.fromDOM(siblings.slice(index+1)))));
                    } else {
                        selection.replaceChildren(DP.toDOM(DP.selectionKey(e.key ?? "", DP.fromDOM(selection.children))));
                    }
            }*/
        });
    }
    get selectableContent(): MathGroup {
        return DP.fromDOM(this.contentHTML.children, true);
    }

    set selectableContent(content: MathGroup) {
        this.contentHTML.replaceChildren(DP.toDOM(content, true));
    }

    get disabled(): boolean {
        return this.#disabled;
    }
    set disabled(value) {
        this.#disabled = !!(value as any);
    }
}