/**
 * Teams SDK integration — detect Teams context and provide SSO token.
 *
 * Progressive enhancement model:
 * - Teams detected → use Teams SDK for context + SSO token
 * - Not in Teams → fall back to EasyAuth redirect (existing behavior)
 *
 * The app always works; Teams just makes it better (channel name in header,
 * SSO without redirect, channel tab support).
 */

import { app, authentication } from '@microsoft/teams-js';

// ── Types ────────────────────────────────────────────────────────────────

export interface TeamsContext {
  /** True when running inside a Teams tab (personal or channel) */
  isTeams: boolean;
  /** 'personal' | 'channel' | null */
  tabType: 'personal' | 'channel' | null;
  /** Channel name (only set for channel tabs) */
  channelName: string | null;
  /** Channel ID (only set for channel tabs) */
  channelId: string | null;
  /** Team name */
  teamName: string | null;
  /** Team ID */
  teamId: string | null;
  /** User principal name from Teams */
  userPrincipalName: string | null;
  /** Teams theme: 'default' | 'dark' | 'contrast' */
  theme: string | null;
  /** Deep link subPageId from Teams tab navigation */
  subPageId: string | null;
}

const EMPTY_CONTEXT: TeamsContext = {
  isTeams: false,
  tabType: null,
  channelName: null,
  channelId: null,
  teamName: null,
  teamId: null,
  userPrincipalName: null,
  theme: null,
  subPageId: null,
};

// ── State ────────────────────────────────────────────────────────────────

let teamsContext: TeamsContext = EMPTY_CONTEXT;
let initialized = false;
let initPromise: Promise<TeamsContext> | null = null;

// ── Initialization ───────────────────────────────────────────────────────

/**
 * Initialize the Teams SDK. Safe to call multiple times — returns cached result.
 *
 * Call this early in app startup. If not in Teams, resolves immediately
 * with `isTeams: false`. Does not throw.
 */
export function initTeams(): Promise<TeamsContext> {
  if (initPromise) return initPromise;

  initPromise = doInit();
  return initPromise;
}

async function doInit(): Promise<TeamsContext> {
  try {
    // app.initialize() will reject quickly if not in Teams
    await app.initialize();

    const ctx = await app.getContext();

    const isChannel = ctx.page?.frameContext === 'content' && !!ctx.channel?.id;
    const isPersonal = ctx.page?.frameContext === 'content' && !ctx.channel?.id;

    teamsContext = {
      isTeams: true,
      tabType: isChannel ? 'channel' : isPersonal ? 'personal' : null,
      channelName: ctx.channel?.displayName ?? null,
      channelId: ctx.channel?.id ?? null,
      teamName: ctx.team?.displayName ?? null,
      teamId: ctx.team?.internalId ?? null,
      userPrincipalName: ctx.user?.userPrincipalName ?? null,
      theme: ctx.app?.theme ?? null,
      subPageId: ctx.page?.subPageId ?? null,
    };

    // Listen for theme changes from Teams
    app.registerOnThemeChangeHandler((theme: string) => {
      teamsContext = { ...teamsContext, theme };
    });

    // Notify Teams that the app loaded successfully
    app.notifySuccess();

    initialized = true;
    return teamsContext;
  } catch {
    // Not in Teams — this is the normal browser path
    teamsContext = EMPTY_CONTEXT;
    initialized = true;
    return teamsContext;
  }
}

// ── Accessors ────────────────────────────────────────────────────────────

/**
 * Get the current Teams context. Returns the empty context if not initialized
 * or not in Teams.
 */
export function getTeamsContext(): TeamsContext {
  return teamsContext;
}

/** Whether the Teams SDK has been initialized */
export function isTeamsInitialized(): boolean {
  return initialized;
}

/** Whether the app is running inside Teams */
export function isInTeams(): boolean {
  return teamsContext.isTeams;
}

/** Whether the app is running in a Teams channel tab */
export function isChannelTab(): boolean {
  return teamsContext.tabType === 'channel';
}

// ── SSO Token ────────────────────────────────────────────────────────────

/**
 * Get a Teams SSO token (client-side).
 *
 * This token is an Azure AD token scoped to the app's client ID.
 * For Graph API access, it needs to be exchanged server-side via OBO flow.
 * Until the OBO function is deployed (Increment 6), the app falls back
 * to EasyAuth redirect for Graph API tokens.
 *
 * @returns The SSO token string, or null if not in Teams or SSO fails
 */
export async function getTeamsSsoToken(): Promise<string | null> {
  if (!teamsContext.isTeams) return null;

  try {
    const token = await authentication.getAuthToken();
    return token;
  } catch (err) {
    console.warn('[Teams] SSO token acquisition failed:', err);
    return null;
  }
}
