/**
 * Product analytics, via Firebase (Google Analytics 4).
 *
 * Goals, in order: know how many people use the app (total, and daily active),
 * and know which features they actually use. Signed-out visitors are counted
 * anonymously — nobody is asked to log in to be measured.
 *
 * Components never call the SDK directly; they call `track()` below, so every
 * event name and its properties are typed in one place. GA4 constrains names
 * to <=40 chars, alphanumeric plus underscore, starting with a letter — the
 * union below is written to satisfy that.
 *
 * The SDK is dynamically imported so it never lands in the initial bundle, and
 * events raised before it finishes loading are queued rather than dropped.
 */

import { loadFirebase, isAnalyticsConfigured } from './firebase';

type AnalyticsClient = import('firebase/analytics').Analytics;
type LogEvent = typeof import('firebase/analytics').logEvent;
type SetUserId = typeof import('firebase/analytics').setUserId;

let client: AnalyticsClient | null = null;
let logEventFn: LogEvent | null = null;
let setUserIdFn: SetUserId | null = null;

const queue: Array<[string, Record<string, unknown> | undefined]> = [];
let starting = false;

export function initAnalytics(): void {
  if (starting || client || !isAnalyticsConfigured) return;
  starting = true;

  const pending = loadFirebase();
  if (!pending) return;

  void pending
    .then(async fb => {
      const mod = await import('firebase/analytics');
      // Blocked by some browsers and unavailable in unsupported environments.
      if (!(await mod.isSupported())) return;

      client = mod.getAnalytics(fb.app);
      logEventFn = mod.logEvent;
      setUserIdFn = mod.setUserId;

      for (const [name, params] of queue.splice(0)) {
        try {
          logEventFn(client, name, params);
        } catch {
          // ignore
        }
      }
    })
    .catch(() => {
      // Analytics must never break the app.
    });
}

/** Every tracked interaction in the app, with its properties. */
export type AnalyticsEvent =
  | { name: 'view_changed'; props: { view: string } }
  | { name: 'search_performed'; props: { query_length: number; result_count: number } }
  | { name: 'filter_applied'; props: { filter: string; value: string } }
  | { name: 'filters_cleared'; props?: never }
  | { name: 'sort_changed'; props: { sort_by: string } }
  | { name: 'company_opened'; props: { company_id: string; surface: 'card' | 'map' | 'featured' } }
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
  | { name: 'signed_out'; props?: never }
  | { name: 'install_guide_opened'; props: { platform: 'ios' } }
  | {
      name: 'install_prompted';
      props: { outcome: 'accepted' | 'dismissed' | 'unavailable' };
    };

type EventName = AnalyticsEvent['name'];
type PropsFor<N extends EventName> = Extract<AnalyticsEvent, { name: N }> extends {
  props: infer P;
}
  ? P
  : never;

function send(name: string, params?: Record<string, unknown>): void {
  if (!isAnalyticsConfigured) return;
  if (!client || !logEventFn) {
    if (queue.length < 50) queue.push([name, params]);
    return;
  }
  try {
    logEventFn(client, name, params);
  } catch {
    // Analytics must never break the app.
  }
}

export function track<N extends EventName>(
  ...args: PropsFor<N> extends never | undefined ? [name: N] : [name: N, props: PropsFor<N>]
): void {
  const [name, props] = args;
  send(name, props as Record<string, unknown> | undefined);
}

/** Manual pageview, since the app switches views without changing the URL. */
export function trackView(view: string): void {
  send('page_view', {
    page_title: view,
    page_location: `${window.location.origin}/#${view}`,
    page_path: `/${view}`,
  });
}

/** Attribute subsequent events to a signed-in user. */
export function identifyUser(id: string): void {
  try {
    if (client && setUserIdFn) setUserIdFn(client, id);
  } catch {
    // ignore
  }
}

export function resetUser(): void {
  try {
    if (client && setUserIdFn) setUserIdFn(client, null);
  } catch {
    // ignore
  }
}

export const isAnalyticsEnabled = (): boolean => isAnalyticsConfigured;
