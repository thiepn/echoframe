export function damageAfterPierces(original,pierces){const base=Math.max(0,Number(original)||0),n=Math.max(0,Math.trunc(pierces)||0);return Math.max(base*.45,base*Math.pow(.82,n));}
