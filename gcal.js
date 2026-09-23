/* Google Calendar, read straight from the browser.
 *
 * Port of host/gcal.py. Two deliberate choices:
 *
 *  - No Google Identity Services script. Its token client opens a popup, and
 *    Bluefy (the only iOS browser with Web Bluetooth) is a slim browser where
 *    popups are easily blocked. A full-page redirect works everywhere.
 *  - The Calendar API, not the iCal feed, because `singleEvents=true` expands
 *    recurrence server-side. This calendar has entries that are both recurring
 *    and individually moved, which raw RRULE parsing gets wrong.
 *
 * The implicit flow issues no refresh token, so the hour-long access token has
 * to be re-obtained now and then. That is the price of having no server.
 */

const GCAL = (() => {
  const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
  const API = 'https://www.googleapis.com/calendar/v3';
  const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
  const TZ = 'Asia/Ho_Chi_Minh';
  const OFFSET = '+07:00';

  const KEY_TOKEN = 'eink.token';
  const KEY_STATE = 'eink.oauthState';

  // "[TKB 4A6] Thứ 3 - Buổi Sáng" is only a wrapper; the real timetable lives
  // in its description, one period per line.
  const TKB_RE = /^\s*\[TKB\b/;
  const PERIOD_RE = /^\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*:\s*(.+?)\s*$/;

  const WEEKDAY_VI = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];

  /** This page's own URL, which is what Google must have registered. */
  const redirectUri = () => location.origin + location.pathname;

  function saveToken(token, expiresIn) {
    localStorage.setItem(KEY_TOKEN, JSON.stringify({
      token, expires: Date.now() + (expiresIn - 60) * 1000,   // a minute of slack
    }));
  }

  function currentToken() {
    try {
      const t = JSON.parse(localStorage.getItem(KEY_TOKEN) || 'null');
      return t && t.expires > Date.now() ? t.token : null;
    } catch { return null; }
  }

  function signOut() {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_CAL_ID);   // don't keep another account's calendar
  }

  /** Pick the token out of the URL fragment after Google redirects back. */
  function captureRedirect() {
    if (!location.hash.includes('access_token')) return null;
    const p = new URLSearchParams(location.hash.slice(1));
    const expected = sessionStorage.getItem(KEY_STATE);
    sessionStorage.removeItem(KEY_STATE);
    history.replaceState(null, '', redirectUri());        // don't leave a token in the bar
    if (!expected || p.get('state') !== expected) return { error: 'state không khớp' };
    saveToken(p.get('access_token'), +(p.get('expires_in') || 3600));
    return { ok: true };
  }

  function signIn(clientId) {
    const state = crypto.randomUUID();
    sessionStorage.setItem(KEY_STATE, state);
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: 'token',
      scope: SCOPE,
      state,
      include_granted_scopes: 'true',
    });
    location.href = `${AUTH}?${q}`;
  }

  async function api(path, params) {
    const token = currentToken();
    if (!token) throw new Error('Chưa đăng nhập Google (hoặc phiên đã hết hạn)');
    const url = `${API}${path}?${new URLSearchParams(params || {})}`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { signOut(); throw new Error('Phiên hết hạn, đăng nhập lại'); }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Calendar API ${res.status}: ${body.slice(0, 160)}`);
    }
    return res.json();
  }

  async function listCalendars() {
    const out = [];
    let pageToken;
    do {
      const r = await api('/users/me/calendarList', pageToken ? { pageToken } : {});
      out.push(...(r.items || []));
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out;
  }

  const KEY_CAL_ID = 'eink.calId';

  /** Resolve a calendar name to its id, remembering the answer.
   *
   *  Without this, every day change re-listed the whole calendar list just to
   *  look up an id that never changes. */
  async function findCalendarId(name) {
    const want = name.trim().toLowerCase();
    try {
      const cached = JSON.parse(localStorage.getItem(KEY_CAL_ID) || 'null');
      if (cached && cached.name === want) return cached.id;
    } catch { /* fall through and look it up */ }

    const all = await listCalendars();
    const hit = all.find(c => (c.summary || '').trim().toLowerCase() === want);
    if (!hit) throw new Error(`Không thấy lịch "${name}". Có: ${all.map(c => c.summary).join(', ')}`);
    localStorage.setItem(KEY_CAL_ID, JSON.stringify({ name: want, id: hit.id }));
    return hit.id;
  }

  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  async function fetchEvents(calendarId, date) {
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const r = await api(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      timeMin: `${iso(date)}T00:00:00${OFFSET}`,
      timeMax: `${iso(next)}T00:00:00${OFFSET}`,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeZone: TZ,
      maxResults: '100',
    });
    return r.items || [];
  }

  /** Split events into school periods - unpacked from the TKB wrappers - and
   *  personal to-dos, the shape the layout expects. */
  function buildDay(events, date) {
    const morning = [], afternoon = [], items = [];
    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      const summary = (ev.summary || '').trim();
      const stamp = ev.start && ev.start.dateTime;

      if (TKB_RE.test(summary)) {
        for (const line of (ev.description || '').split('\n')) {
          const m = PERIOD_RE.exec(line);
          if (!m) continue;
          const [, time, , subject] = m;
          (parseInt(time, 10) < 12 ? morning : afternoon).push([time, subject]);
        }
        continue;
      }
      if (!stamp) continue;                    // all-day: no slot on the timeline
      items.push([stamp.slice(11, 16), summary]);
    }
    const byTime = (a, b) => a[0].localeCompare(b[0]);
    morning.sort(byTime); afternoon.sort(byTime); items.sort(byTime);

    return {
      date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      weekday_vi: WEEKDAY_VI[date.getDay()],
      morning, afternoon, items,
    };
  }

  async function loadDay(calendarName, date) {
    const id = await findCalendarId(calendarName);
    return buildDay(await fetchEvents(id, date), date);
  }

  // buildDay is exported so the parsing can be tested without the network -
  // it is the part most likely to drift from the Python original.
  const weekdayVi = d => WEEKDAY_VI[d.getDay()];
  const dayLabel = d =>
    `${WEEKDAY_VI[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  /** An empty day for a date, so the preview can show something real before
   *  anyone has signed in. */
  const blankDay = d => buildDay([], d);

  return { signIn, signOut, currentToken, captureRedirect, listCalendars,
           loadDay, buildDay, blankDay, dayLabel, weekdayVi, redirectUri };
})();
