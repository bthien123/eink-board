/* Day layouts for the 296x138 three-colour panel.
 *
 * Port of host/layouts.py. Two rules carried over, both learned the hard way:
 *
 *  - Row spacing comes from measured ink, never from font metrics. Stacked
 *    Vietnamese marks ("Thể" is a hook over a circumflex) reach higher than the
 *    font claims, and metric-spaced rows quietly overlap.
 *  - Black and red are drawn on separate canvases. Sharing one lets canvas
 *    antialiasing blend text toward pink, which the packer reads as red - the
 *    bug that used to eat diacritics off the banner.
 */

const PANEL = {
  W: 296,        // landscape width  = gate lines
  H: 138,        // landscape height = source lines, confirmed on hardware
  RAM_W: 144,    // rounded up to a byte; the spare columns stay white
  RAM_H: 296,
  TOP_MARGIN: 5, // the case hides the first rows of glass
  DRAW_H: 133,   // 138 - TOP_MARGIN
};

const FONT = 'Cozette';
const FONT_BOLD = 'CozetteBold';
// Cozette is a 6x13 bitmap face: only sizes on its grid stay crisp.
const SIZE_LADDER = [20, 16, 13, 11];
// The strip and the subject columns share one size - letting the secondary
// content render larger than the timetable looks backwards.
const BODY_SIZE = 13;

const SHORT = {
  'Giáo dục thể chất': 'Thể chất',
  // Same label so collapse() merges two back-to-back periods into one row.
  'Hoạt động trải nghiệm 1': 'Trải nghiệm',
  'Hoạt động trải nghiệm 2': 'Trải nghiệm',
  'Hoạt động trải nghiệm 3': 'Trải nghiệm',
  'TANN (Tăng cường Anh ngữ)': 'T.Anh tăng cường',
  'KHSN (Kỹ năng sống)': 'Kỹ năng sống',
  'GDDP (Giáo dục địa phương)': 'GD địa phương',
  'ATGT (An toàn giao thông)': 'An toàn GT',
  'Lịch sử & Địa lý': 'Sử & Địa',
};

const ITEM_SHORT = {
  'Uống Bright Vision (sau bữa sáng)': 'Vitamin',
  'Uống Bright Vision (sau bữa tối)': 'Vitamin',
  'Nhỏ mắt Atropine (trước khi ngủ)': 'Nhỏ mắt',
  'Làm bài tập trên lớp': 'Bài tập',
  'Chơi tự do sau giờ học': 'Chơi tự do',
  'Edupia AI - Lớp học': 'Edupia',
  'Edupia AI - Làm bài tập tuần': 'BT Edupia',
  'Robotic - MindX Quảng Ninh': 'Robotic',
  'Vận động ngoài trời': 'Ra ngoài chơi',
  'VioEdu - Vòng sơ loại 1': 'VioEdu',
};

const WEEKDAYS = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];

const short = n => SHORT[n] || n;
const shortItem = t => ITEM_SHORT[t] || t;
const font = (size, bold) => `${size}px ${bold ? FONT_BOLD : FONT}`;

/** Merge back-to-back periods of the same subject: "Tiếng Việt ×2". */
function collapse(entries) {
  const out = [];
  for (const [, name] of entries) {
    const label = short(name);
    if (out.length && out[out.length - 1][0] === label) out[out.length - 1][1]++;
    else out.push([label, 1]);
  }
  return out.map(([n, c]) => (c === 1 ? n : `${n} ×${c}`));
}

// ------------------------------------------------------------ ink measuring
// With textBaseline 'alphabetic', actualBoundingBox* are distances from the
// baseline, which is exactly what the spacing maths needs.
function inkOf(g, text) {
  const m = g.measureText(text);
  return { asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, w: m.width };
}

/** Baseline pitch so no two consecutive rows' ink can touch, plus the depth
 *  the last row reaches below its own baseline. */
function columnSpace(g, texts) {
  if (!texts.length) return { pitch: 0, depth: 0, firstAsc: 0 };
  const ink = texts.map(t => inkOf(g, t));
  let pitch = 1;
  for (let i = 0; i + 1 < ink.length; i++) {
    pitch = Math.max(pitch, Math.ceil(ink[i].desc + ink[i + 1].asc) + 1);
  }
  return { pitch, depth: Math.ceil(ink[ink.length - 1].desc), firstAsc: Math.ceil(ink[0].asc) };
}

// ------------------------------------------------------------ drawing layers
function newLayer() {
  const c = document.createElement('canvas');
  c.width = PANEL.W; c.height = PANEL.H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, PANEL.W, PANEL.H);
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#000';
  return { c, g };
}

/** Heart drawn, not typed: the emoji glyph is a colour font, and a red heart
 *  would vanish into the red banner anyway. */
function heart(g, x, y, size) {
  const h = size / 2;
  g.beginPath();
  g.arc(x + h / 2, y + h / 2, h / 2, 0, Math.PI * 2);
  g.arc(x + size - h / 2, y + h / 2, h / 2, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(x, y + size * 0.32);
  g.lineTo(x + size, y + size * 0.32);
  g.lineTo(x + size / 2, y + size);
  g.closePath();
  g.fill();
}

/** Red banner. Returns the y below it. Text is centred by its real ink box:
 *  accents on capitals (Ù, Ậ) rise above the font's nominal ascent, so
 *  anchoring to metrics slices them off. */
function header(B, R, day, owner) {
  const top = PANEL.TOP_MARGIN, height = 18;
  R.g.fillStyle = '#000';
  R.g.fillRect(0, top, PANEL.W, height);
  B.g.fillStyle = '#fff';
  B.g.fillRect(0, top, PANEL.W, height);   // keep black off the banner

  // White-on-red: painted as holes punched in the red layer.
  R.g.fillStyle = '#fff';
  R.g.font = font(16, true);
  const left = `${day.weekday_vi}  ${day.date}`;
  const li = inkOf(R.g, left);
  const baseline = top + Math.round((height - (li.asc + li.desc)) / 2 + li.asc);
  R.g.fillText(left, 6, baseline);

  if (owner) {
    const used = 6 + li.w + 8, hs = 9;
    let size = 13, block = 0;
    for (const s of [16, 13]) {
      R.g.font = font(s, true);
      block = hs + 4 + R.g.measureText(owner).width + 4 + hs;
      if (used + block <= PANEL.W - 6) { size = s; break; }
    }
    R.g.font = font(size, true);
    let x = PANEL.W - 6 - block;
    heart(R.g, x, top + (height - hs) / 2, hs);
    x += hs + 4;
    const oi = inkOf(R.g, owner);
    R.g.fillText(owner, x, top + Math.round((height - (oi.asc + oi.desc)) / 2 + oi.asc));
    x += oi.w + 4;
    heart(R.g, x, top + (height - hs) / 2, hs);
  }
  R.g.fillStyle = '#000';
  B.g.fillStyle = '#000';
  return top + height + 4;   // 4px, not 2: the timetable sits lower on purpose
}

/** Pack the to-dos left to right, wrapping into as few rows as fit. */
function packStrip(g, items, gap = 10) {
  const rows = []; let cur = [], x = 0;
  for (const [time, title] of items) {
    const w = Math.ceil(g.measureText(time).width) + 4 + Math.ceil(g.measureText(title).width);
    if (cur.length && x + w > PANEL.W - 12) { rows.push(cur); cur = []; x = 0; }
    cur.push([time, title]);
    x += w + gap;
  }
  if (cur.length) rows.push(cur);
  return rows;
}

/** Weekends have no school periods: give the whole panel to the activities. */
function drawFreeDay(B, R, day, owner) {
  let y = header(B, R, day, owner);
  const items = day.items.map(([t, s]) => [t, shortItem(s)]);
  const space = PANEL.H - y - 4;

  let size = 11;
  for (const s of SIZE_LADDER) {
    B.g.font = font(s, false);
    const { pitch, depth } = columnSpace(B.g, items.map(i => i[1]));
    if ((items.length - 1) * pitch + depth <= space) { size = s; break; }
  }
  B.g.font = font(size, false);
  R.g.font = font(size, true);
  const { pitch, depth, firstAsc } = columnSpace(B.g, items.map(i => i[1]));
  const block = (items.length - 1) * pitch + depth + firstAsc;
  let baseline = y + Math.max(0, Math.round((space - block) / 2)) + firstAsc;

  const timeW = Math.ceil(R.g.measureText('00:00').width) + 10;
  for (const [time, title] of items) {
    R.g.font = font(size, true);
    R.g.fillText(time, 8, baseline);
    B.g.font = font(size, false);
    B.g.fillText(title, 8 + timeW, baseline);
    baseline += pitch;
  }
}

/** Subjects in two columns, to-dos on a strip underneath. */
function drawDay(day, owner) {
  const B = newLayer(), R = newLayer();
  if (!day.morning.length && !day.afternoon.length) {
    drawFreeDay(B, R, day, owner);
    return { B, R };
  }
  const y0 = header(B, R, day, owner);

  const items = day.items.map(([t, s]) => [t, shortItem(s)]);
  B.g.font = font(BODY_SIZE, false);
  R.g.font = font(BODY_SIZE, true);
  const stripRows = packStrip(B.g, items);
  const stripInk = columnSpace(B.g, items.map(i => i[1]));
  const stripPitch = Math.max(stripInk.pitch, BODY_SIZE + 1);
  const stripGap = 2;
  const stripH = 1 + stripGap + stripInk.firstAsc + (stripRows.length - 1) * stripPitch + stripInk.depth;

  const columns = { morning: collapse(day.morning), afternoon: collapse(day.afternoon) };
  const names = columns.morning.concat(columns.afternoon);
  const count = Math.max(columns.morning.length, columns.afternoon.length);
  const available = PANEL.H - y0 - stripH;
  const colWidth = PANEL.W / 2 - 10;

  R.g.font = font(BODY_SIZE, true);
  const tagInk = inkOf(R.g, 'SÁNG');

  // Clearance the tag needs above the first subject row, measured from the
  // day's own names rather than assumed.
  const tagGap = size => {
    B.g.font = font(size, false);
    const asc = Math.max(...names.map(n => inkOf(B.g, n).asc));
    return Math.ceil(tagInk.desc + asc) + 3;
  };

  const need = size => {
    B.g.font = font(size, false);
    let pitch = 0, total = 0, firstAsc = 0;
    for (const key of ['morning', 'afternoon']) {
      if (!columns[key].length) continue;
      const s = columnSpace(B.g, columns[key]);
      pitch = Math.max(pitch, s.pitch);
      firstAsc = Math.max(firstAsc, s.firstAsc);
      total = Math.max(total, (columns[key].length - 1) * s.pitch + s.depth + s.firstAsc);
    }
    const widest = Math.max(...names.map(n => Math.ceil(B.g.measureText(n).width)));
    return { pitch, total, firstAsc, widest };
  };

  let size = SIZE_LADDER[SIZE_LADDER.length - 1];
  for (const s of SIZE_LADDER) {
    if (s > BODY_SIZE) continue;               // capped: see BODY_SIZE
    const n = need(s);
    if (tagGap(s) + n.total <= available && n.widest <= colWidth) { size = s; break; }
  }
  const n = need(size), gapH = tagGap(size);
  const slack = Math.floor((available - gapH - n.total) / Math.max(1, count));
  const pitch = n.pitch + Math.max(0, Math.min(slack, 4));

  for (const [x, label, key] of [[6, 'SÁNG', 'morning'], [PANEL.W / 2 + 4, 'CHIỀU', 'afternoon']]) {
    if (!columns[key].length) continue;
    R.g.font = font(BODY_SIZE, true);
    R.g.fillText(label, x, y0 + Math.ceil(tagInk.asc));
    B.g.font = font(size, false);
    let baseline = y0 + gapH + n.firstAsc;
    for (const name of columns[key]) {
      B.g.fillText(name, x, baseline);
      baseline += pitch;
    }
  }

  let y = PANEL.H - stripH;
  B.g.fillRect(6, y, PANEL.W - 12, 1);
  let baseline = y + 1 + stripGap + stripInk.firstAsc;
  for (const row of stripRows) {
    let x = 6;
    for (const [time, title] of row) {
      R.g.font = font(BODY_SIZE, true);
      R.g.fillText(time, x, baseline);
      x += Math.ceil(R.g.measureText(time).width) + 4;
      B.g.font = font(BODY_SIZE, false);
      B.g.fillText(title, x, baseline);
      x += Math.ceil(B.g.measureText(title).width) + 10;
    }
    baseline += stripPitch;
  }
  return { B, R };
}

// ------------------------------------------------------------ plane packing
/** Landscape (x,y) lands in RAM at (y, W-1-x) - verified byte-identical
 *  against the Python renderer that runs on the hardware. */
function planesFrom(B, R) {
  const rowBytes = PANEL.RAM_W / 8;
  const black = new Uint8Array(rowBytes * PANEL.RAM_H).fill(0xFF);
  const red = new Uint8Array(rowBytes * PANEL.RAM_H).fill(0xFF);
  const bp = B.g.getImageData(0, 0, PANEL.W, PANEL.H).data;
  const rp = R.g.getImageData(0, 0, PANEL.W, PANEL.H).data;

  for (let yl = 0; yl < PANEL.H; yl++) {
    for (let xl = 0; xl < PANEL.W; xl++) {
      const idx = (PANEL.W - 1 - xl) * rowBytes + (yl >> 3);
      const mask = 0x80 >> (yl & 7);
      const p = (yl * PANEL.W + xl) * 4;
      if (0.299 * bp[p] + 0.587 * bp[p + 1] + 0.114 * bp[p + 2] < 140) black[idx] &= ~mask & 0xFF;
      if (0.299 * rp[p] + 0.587 * rp[p + 1] + 0.114 * rp[p + 2] < 140) red[idx] &= ~mask & 0xFF;
    }
  }
  return { black, red };
}

/** Paint what the glass will show, for the on-screen preview. */
function paintPreview(canvas, B, R) {
  const g = canvas.getContext('2d');
  const bd = B.g.getImageData(0, 0, PANEL.W, PANEL.H).data;
  const rd = R.g.getImageData(0, 0, PANEL.W, PANEL.H).data;
  const out = g.createImageData(PANEL.W, PANEL.H);
  for (let i = 0; i < PANEL.W * PANEL.H; i++) {
    const j = i * 4;
    const lb = 0.299 * bd[j] + 0.587 * bd[j + 1] + 0.114 * bd[j + 2];
    const lr = 0.299 * rd[j] + 0.587 * rd[j + 1] + 0.114 * rd[j + 2];
    const c = lr < 140 ? [220, 38, 38] : lb < 140 ? [0, 0, 0] : [255, 255, 255];
    out.data[j] = c[0]; out.data[j + 1] = c[1]; out.data[j + 2] = c[2]; out.data[j + 3] = 255;
  }
  g.putImageData(out, 0, 0);
}
