import {MathGroup, JsMathObject, MathUnit} from './types/math';

let stringRegex = / /;
type OpInfo = [number,boolean];
const opArgs: {[op: string]: OpInfo} = {'\\frac':[2,true], '^':[1,false], '_':[1,false]};

interface ProcessorOptions {
    deleteInvalid: boolean
}

export class JsMathProcessor {
    private static readonly _defaultOptions: ProcessorOptions = {
        deleteInvalid: false
    };
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
                    let firstSerialized = this.serialize(obj.arguments[0]);
                    if (firstSerialized.length > 1 || obj.arguments.length > 1 || (final in opArgs && opArgs[final][1])) {
                        final += '{' + obj.arguments.map(arg=>this.serialize(arg)).join('}{') + '}';
                    } else {
                        final += firstSerialized;
                    }
                }
                return final;
            default:
                return obj.toString();
        }
    }
    /*parse(text: string): MathGroup {
        let i = 0;
        let final: MathGroup = [];
        let obj: any;
        while (i < text.length) {
            
        }
    }*/
}