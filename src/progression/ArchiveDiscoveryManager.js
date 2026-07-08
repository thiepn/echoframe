export class ArchiveDiscoveryManager {
  static discover(save, ids = []) {
    save.progression.archiveDiscoveryIds ??= [];
    for (const id of ids) if (typeof id === 'string' && !save.progression.archiveDiscoveryIds.includes(id)) save.progression.archiveDiscoveryIds.push(id);
    return [...save.progression.archiveDiscoveryIds];
  }
}
