function deepFreeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))deepFreeze(child);return Object.freeze(value);}
export function createArenaDescriptor(input){return deepFreeze(structuredClone(input));}
export function isSerializableArenaDescriptor(value){try{return Boolean(JSON.stringify(value));}catch{return false;}}
