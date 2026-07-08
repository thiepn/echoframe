export function formatUpgradeLevel(definition,level){const data=definition?.levels?.[Math.max(0,level-1)];return data?.description??definition?.description??'';}
