export function createUpgradeSnapshot(levels){return Object.freeze({levels:Object.freeze(Object.fromEntries(levels)),selectedCount:[...levels.values()].reduce((a,b)=>a+b,0)});}
