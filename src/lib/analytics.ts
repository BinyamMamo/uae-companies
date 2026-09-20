import posthog from 'posthog-js';

/**
 * Product analytics.
 *
 * Goals, in order: know how many people use the app (total, and daily active),
 * and know which features they actually use. Signed-out visitors are counted
 * anonymously — nobody is asked to log in to be measured.
 *
 * Components never call `posthog.capture` directly; they call `track()` below,
 * so every event name and its properties are typed in one place.
 */

const KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)
  ?? 'https://eu.i.posthog.com';

let enabled = false;

export function initAnalytics(): void {
  if (enabled || !KEY) return;

  posthog.init(KEY, {
    api_host: HOST,
    // Anonymous events for signed-out visitors; a person profile is only
    // created once someone signs in. Still counts unique visitors and DAU.
    person_profiles: 'identified_only',
    capture_pageview: false, // no router — we fire these manually on tab change
    capture_pageleave: true,
    autocapture: false, // explicit events only, so the data stays legible
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
  });

  enabled = true;
}

/** Every tracked interaction in the app, with its properties. */
export type AnalyticsEvent =
  | { name: 'view_changed'; props: { view: string } }
  | { name: 'search_performed'; props: { query_length: number; result_count: number } }
  | { name: 'filter_applied'; props: { filter: string; value: string } }
  | { name: 'filters_cleared'; props?: never }
  | { name: 'sort_changed'; props: { sort_by: string } }
  | { name: 'company_opened'; props: { company_id: string; surface: 'card' | 'map' | 'saved' | 'featured' | 'browse' } }
  | { name: 'company_tab_viewed'; props: { company_id: string; tab: string } }
  | { name: 'company_saved'; props: { company_id: string; saved: boolean } }
  | { name: 'list_created'; props?: never }
  | { name: 'list_deleted'; props?: never }
  | { name: 'list_shared'; props: { company_count: number } }
  | { name: 'compare_toggled'; props: { company_id: string; added: boolean } }
  | { name: 'compare_opened'; props: { company_count: number } }
  | { name: 'map_pin_clicked'; props: { company_id: string } }
  | { name: 'map_style_changed'; props: { style: string } }
  | { name: 'route_viewed'; props: { company_id: string; mode: 'transit' | 'driving' } }
  | { name: 'home_location_changed'; props: { method: 'search' | 'gps' | 'map' | 'reset' } }
  | { name: 'theme_toggled'; props: { theme: 'light' | 'dark' } }
  | { name: 'accent_changed'; props: { accent: string } }
  | { name: 'interests_changed'; props: { count: number } }
  | { name: 'careers_link_clicked'; props: { company_id: string; role?: string } }
  | { name: 'website_link_clicked'; props: { company_id: string } }
  | { name: 'data_exported'; props?: never }
  | { name: 'signed_in'; props: { method: 'google_popup' | 'google_one_tap' } }
  | { name: 'signed_out'; props?: never };

type EventName = AnalyticsEvent['name'];
type PropsFor<N extends EventName> = Extract<AnalyticsEvent, { name: N }> extends {
  props: infer P;
}
  ? P
  : never;

export function track<N extends EventName>(
  ...args: PropsFor<N> extends never | undefined ? [name: N] : [name: N, props: PropsFor<N>]
): void {
  if (!enabled) return;
  const [name, props] = args;
  try {
    posthog.capture(name, props as Record<string, unknown> | undefined);
  } catch {
    // Analytics must never break the app.
  }
}

/** Manual pageview, since the app switches views without changing the URL. */
export function trackView(view: string): void {
  if (!enabled) return;
  try {
    posthog.capture('$pageview', { view, $current_url: `${window.location.origin}/#${view}` });
  } catch {
    // ignore
  }
}

/** Link anonymous history to a signed-in user. */
export function identifyUser(id: string, traits?: Record<string, unknown>): void {
  if (!enabled) return;
  try {
    posthog.identify(id, traits);
  } catch {
    // ignore
  }
}

export function resetUser(): void {
  if (!enabled) return;
  try {
    posthog.reset();
  } catch {
    // ignore
  }
}

export const isAnalyticsEnabled = (): boolean => enabled;
