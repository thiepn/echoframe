export const COMBAT_BALANCE=Object.freeze({
 player:Object.freeze({maximumHealth:100,postHitInvulnerabilityMs:700}),
 difficulty:Object.freeze({
  relaxed:Object.freeze({enemyHealth:.90,enemyMovement:.92,projectileSpeed:.85,anticipation:1.20,recovery:1.15,threat:.82,spawnInterval:1.15,recoveryWindow:1.25,hitInvulnerability:1.12}),
  standard:Object.freeze({enemyHealth:1,enemyMovement:1,projectileSpeed:1,anticipation:1,recovery:1,threat:1,spawnInterval:1,recoveryWindow:1,hitInvulnerability:1}),
  overclocked:Object.freeze({enemyHealth:1.12,enemyMovement:1.08,projectileSpeed:1.12,anticipation:.90,recovery:.90,threat:1.20,spawnInterval:.88,recoveryWindow:.80,hitInvulnerability:.92}),
 }),
 sliceCaps:Object.freeze({drifters:12,sentries:6,lancers:5,shardCarriers:5,bulwarks:4,suppressors:3,enemies:20,hostileProjectiles:80,carrierShards:24}),
 playtest:Object.freeze({spawnTelegraphMs:650,drifterContactCooldownMs:650,drifterSeparationRadius:56,drifterSeparationStrength:72,drifterLungeTriggerRange:230,sentryProjectileLifetimeMs:3200,sentryBodyRadius:24,drifterBodyRadius:22,chamberIntroMs:1100,chamberClearMs:850,enemyDeathMs:240,healthTrailLerpPerSecond:4.8,damageDeduplicationCapacity:4096,minimumSpawnDistance:260}),
});
export function getDifficultyCombatProfile(id='standard'){return COMBAT_BALANCE.difficulty[id]??COMBAT_BALANCE.difficulty.standard;}
