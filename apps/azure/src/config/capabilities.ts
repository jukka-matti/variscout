export type WorkspaceChannel = 'free' | 'individual' | 'company';

function readChannel(): WorkspaceChannel {
  const raw = import.meta.env.VITE_VARISCOUT_CHANNEL;
  return raw === 'free' || raw === 'individual' ? raw : 'company';
}

export const workspaceChannel = readChannel();

export const workspaceCapabilities = {
  channel: workspaceChannel,
  artifacts: workspaceChannel !== 'free',
  localAutosave: workspaceChannel !== 'free',
  ai: workspaceChannel === 'company',
} as const;
