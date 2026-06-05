import type { ImprovementProject } from './types';

/**
 * True once a project has ever been collaborated on — i.e. its durable
 * `collaboratedAt` marker has been set by the first invite. The marker is
 * never cleared (removing members does not flip this back to false), so this
 * is distinct from a reversible `members.length > 1` check.
 *
 * Gates the Azure-only collaboration affordances (the optional, non-blocking
 * sign-off section). A solo PWA investigation never sets the marker, so it
 * stays in Mode-1 solo and the sign-off section stays hidden. (IM-7 §11 #6.)
 */
export function isCollaborative(ip: ImprovementProject): boolean {
  return Boolean(ip.collaboratedAt);
}
