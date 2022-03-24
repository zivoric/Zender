export function go(egg:string):string {
    return egg.substring(0,Math.min(egg.length,2));
}