import {MathGroup, JsMathObject, MathUnit} from './types/math';
import { Optionable } from './types/api';

const simpleOps = ['+','-','*','/','\\left(','\\right)'];
const complexOps: {[op: string]: number} = {'\\frac':2, '^':1, '_':1};
const conversions: {[char: string]: string} = {'(':'\\left(', ')':'\\right)'};

interface ProcessorOptions {
    autoConvert: boolean
}

export class JsMathProcessor extends Optionable<ProcessorOptions>  {
    private static readonly _defaultOptions: ProcessorOptions = {
        autoConvert: true
    };

    constructor(options?: ProcessorOptions) {
        super(JsMathProcessor._defaultOptions, options);
    }

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
        switch(typeof obj) {
            case 'object':
                let final = obj.operator;
                if (obj.arguments && obj.arguments.length > 0) {
                    final += obj.arguments.map(arg=>{
                        let s = this.serialize(arg);
                        if (s.length == 1 && (final.charAt(0) != '\\' || /\d/.test(s))) {
                            return s;
                        } else {
                            return '{' + s + '}';
                        }
                    }).join('');
                }
                return final;
            default:
                return obj.toString();
        }
    }
    parse(text: string): MathGroup {
        let i = 0;
        let final: MathUnit[] = [];
        let gBracketDepth = 0;
        let gFirstBracket = -1;
        while (i < text.length) {
            if (text[i] == '{') {
                if (gBracketDepth == 0) {
                    gFirstBracket = i;
                }
                gBracketDepth++;
                i++;
                continue;
            } else if (text[i] == '}' && gBracketDepth > 0) {
                gBracketDepth--;
                if (gBracketDepth == 0) {
                    let parsed = this.parse(text.substring(gFirstBracket+1,i));
                    if (!Array.isArray(parsed)) {
                        final.push(parsed);
                    } else {
                        final.push(...parsed);
                    }
                }
                i++;
                continue;
            } else if (gBracketDepth > 0) {
                i++;
            }
            if (gBracketDepth == 0) {
                if (simpleOps.includes(text[i])) {
                    final.push({operator: text[i]});
                    i++;
                } else if (text[i] in complexOps || text[i] == '\\') {
                    let operator;
                    let end;
                    if (text[i] == '\\') {
                        end = text.substring(i).search(/[\d{]/);
                        if (end == -1) {
                            end = text.length;
                        }
                        operator = text.substring(i,end);
                    } else {
                        end = i+1;
                        operator = text[i];
                    }
                    i = end;
                    if (simpleOps.indexOf(operator) > -1) {
                        final.push({operator: operator});
                        continue;
                    } else if (!(operator in complexOps)) {
                        final.push(...Array.from(operator.substring(1)));
                        continue;
                    }
                    let len = complexOps[operator];
                    let obj: JsMathObject = {operator: operator, arguments: new Array<MathGroup>(len).fill("")};
                    let argIndex = 0, bracketDepth = 0;
                    let firstBracket = -1;
                    while(i < text.length && argIndex < len) {
                        if (bracketDepth == 0 && text[i] != '{' && text[i] != '}') {
                            obj.arguments![argIndex] = this.parse(this.autoConvert(text[i]));
                            argIndex++;
                        } else if (text[i] == '{') {
                            if (bracketDepth == 0) {
                                firstBracket = i;
                            }
                            bracketDepth++;
                        } else if (text[i] == '}' && bracketDepth > 0) {
                            bracketDepth--;
                            if (bracketDepth == 0) {
                                obj.arguments![argIndex] = this.parse(text.substring(firstBracket+1,i));
                                argIndex++;
                            }
                        }
                        i++;
                    }
                    final.push(obj);
                } else {
                    let converted: MathGroup = this.autoConvert(text[i]);
                    if (converted != text[i]) {
                        converted = this.parse(converted);
                    }
                    if (!Array.isArray(converted)) {
                        final.push(converted);
                    } else {
                        final.push(...converted);
                    }
                   i++;
                }
            }
        }
        return final.length == 1 ? final[0] : final;
    }
    private autoConvert(char: string): string {
        if (this.options.autoConvert) {
            return this.convertChar(char)
        } else {
            return char;
        }
    }
    convertChar(char: string): string {
        return conversions[char] ?? char;
    }
}