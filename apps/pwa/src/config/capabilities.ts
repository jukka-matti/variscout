/* global __WORKSPACE_ARTIFACTS__ */

export type WorkspaceChannel = 'free' | 'individual' | 'company';

function readChannel(): WorkspaceChannel {
  const raw = import.meta.env.VITE_VARISCOUT_CHANNEL;
  return raw === 'individual' || raw === 'company' ? raw : 'free';
}

export const workspaceChannel = readChannel();

export const workspaceCapabilities = {
  channel: workspaceChannel,
  artifacts: __WORKSPACE_ARTIFACTS__,
  localAutosave: __WORKSPACE_ARTIFACTS__,
  ai: false,
} as const;
