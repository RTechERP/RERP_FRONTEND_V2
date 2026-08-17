import type { Column, SlickGrid } from '@slickgrid-universal/common';

/**
 * Helper tạo `rowHeightProvider` cho tính năng Variable Row Height của SlickGrid v10.
 *
 * Dùng khi grid có cột nội dung dài (Note, Description, mã vật tư...) đang bị cắt cụt
 * vì rowHeight cố định. Trước đây cách lách là set rowHeight cao cho MỌI dòng, làm
 * những dòng nội dung ngắn bị thừa khoảng trắng.
 *
 * Cách đo: dùng `canvas.measureText` để lấy bề rộng THẬT của chữ, thay vì nhân số ký
 * tự với một hằng số. Đếm theo ký tự luôn sai với dữ liệu thật vì chữ HOA và chữ số
 * rộng hơn chữ thường đáng kể — mã kiểu `DAIWAVN.26.001-DR-RB-(2)` bị ước lượng hụt
 * hẳn một dòng. `measureText` không gây reflow (không phải DOM layout) và kết quả
 * được cache nên đủ nhanh cho yêu cầu "gọi một lần cho mỗi dòng" của SlickGrid.
 */

export interface TextRowHeightOptions {
  /** Chiều cao một dòng text (px). Nên khớp line-height dùng trong formatter/CSS. */
  lineHeight?: number;
  /** Padding dọc của ô (px), cộng thêm vào tổng chiều cao. */
  padding?: number;
  /** Chiều cao tối thiểu (px) — thường để bằng rowHeight mặc định của grid. */
  min?: number;
  /** Chặn trên (px) để một ô quá dài không phá vỡ layout. */
  max?: number;
  /** Padding ngang của ô (px), trừ ra khỏi bề rộng cột khi tính chỗ chứa chữ. */
  cellPaddingX?: number;
  /**
   * Font dùng để đo. Bỏ trống thì tự đọc một lần từ `.slick-cell` thật trên trang.
   * Chỉ đặt tay khi grid dùng font khác phần còn lại.
   */
  font?: string;
  /** Chỉ dùng khi canvas không khả dụng: bề rộng trung bình một ký tự (px). */
  avgCharWidth?: number;
}

const DEFAULTS: Required<Omit<TextRowHeightOptions, 'font'>> & { font: string } = {
  lineHeight: 20,
  // Đủ cho padding dọc của .slick-cell (3px trên + 3px dưới) + border 1px, còn dư chút.
  padding: 10,
  min: 30,
  max: 160,
  cellPaddingX: 8,
  font: '',
  avgCharWidth: 7,
};

/* ---------- Đo bề rộng chữ ---------- */

let measureCtx: CanvasRenderingContext2D | null | undefined;
let resolvedFont = '';
const widthCache = new Map<string, number>();

const FALLBACK_FONT = '12px sans-serif';

/**
 * Đọc font thật từ một ô của CHÍNH grid đang tính.
 *
 * Phải truyền `scope` là container của grid: mỗi grid có thể có font-size riêng
 * (component đặt `:host { font-size: 12px }`), nếu quét cả document thì
 * `querySelector('.slick-cell')` trả về ô của grid ĐẦU TIÊN trên trang - đo nhầm
 * font là lệch số dòng và chữ bị cắt.
 *
 * Trả về '' khi chưa có ô nào để đo (lần render đầu grid còn rỗng) - phía gọi
 * KHÔNG được cache giá trị tạm, xem lý do ở makeTextRowHeightProvider.
 */
function detectFont(scope?: Element | null): string {
  if (typeof document === 'undefined') {
    return FALLBACK_FONT;
  }
  const cell = (scope ?? document).querySelector('.slick-cell');
  if (cell) {
    const cs = getComputedStyle(cell);
    if (cs.fontSize) {
      return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`.trim();
    }
  }
  return '';
}

function getCtx(font: string): CanvasRenderingContext2D | null {
  if (measureCtx === undefined) {
    measureCtx = typeof document !== 'undefined'
      ? document.createElement('canvas').getContext('2d')
      : null;
  }
  if (measureCtx && resolvedFont !== font) {
    measureCtx.font = font;
    resolvedFont = font;
  }
  return measureCtx;
}

function textWidth(text: string, font: string, avgCharWidth: number): number {
  const key = `${font}\u0000${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const ctx = getCtx(font);
  const w = ctx ? ctx.measureText(text).width : text.length * avgCharWidth;
  // Chặn cache phình vô hạn với grid nhiều dữ liệu.
  if (widthCache.size < 50000) {
    widthCache.set(key, w);
  }
  return w;
}

/* ---------- Tách token theo đúng chỗ CSS được phép ngắt dòng ---------- */

/**
 * Trình duyệt ngắt dòng ở khoảng trắng, và ngắt SAU các dấu `-` `/` `_`.
 * Vì vậy `DAIWAVN.26.001-DR-RB-(2)` tuy không có dấu cách vẫn xuống được 3 chỗ.
 * Không mô hình hoá điều này thì mọi mã vật tư đều bị ước lượng hụt dòng.
 */
function splitTokens(segment: string): string[] {
  const out: string[] = [];
  for (const word of segment.split(/\s+/)) {
    if (!word) {
      continue;
    }
    for (const piece of word.split(/(?<=[-/_])/)) {
      if (piece) {
        out.push(piece);
      }
    }
  }
  return out;
}

/** Đếm số dòng một chuỗi chiếm khi wrap trong bề rộng `avail` (px). */
function countLines(
  text: string,
  avail: number,
  font: string,
  avgCharWidth: number,
  spaceW: number
): number {
  if (!text || avail <= 0) {
    return 1;
  }

  let total = 0;
  // Formatter của các grid này dùng `white-space: pre-line/pre-wrap` nên '\n' là
  // xuống dòng thật.
  for (const segment of text.split('\n')) {
    const tokens = splitTokens(segment);
    if (!tokens.length) {
      total += 1;
      continue;
    }

    let lines = 1;
    let used = 0;

    for (const token of tokens) {
      const w = textWidth(token, font, avgCharWidth);
      // Token nối tiếp token trước: chỉ cần khoảng trắng nếu token trước không
      // kết thúc bằng dấu cho phép ngắt.
      const gap = used === 0 ? 0 : spaceW;

      if (used + gap + w <= avail) {
        used += gap + w;
        continue;
      }

      if (used > 0) {
        lines += 1;
        used = 0;
      }

      if (w <= avail) {
        used = w;
      } else {
        // Token dài hơn cả dòng: bị cắt giữa chừng (overflow-wrap: anywhere)
        const need = Math.ceil(w / avail);
        lines += need - 1;
        used = w - (need - 1) * avail;
      }
    }

    total += lines;
  }

  return total;
}

/* ---------- API ---------- */

/**
 * Tạo callback `rowHeightProvider` tính chiều cao dòng theo nội dung các cột chỉ định.
 *
 * @param fields Danh sách `field` quyết định chiều cao (vd: `['Note']`).
 *   Truyền `'*'` để xét TOÀN BỘ cột đang hiển thị — dùng khi muốn wrap cả bảng.
 * @param options Tuỳ chọn tinh chỉnh; xem {@link TextRowHeightOptions}.
 *
 * @example
 * gridOptions = {
 *   rowHeight: 30,
 *   enableVariableRowHeight: true,
 *   rowHeightProvider: makeTextRowHeightProvider('*', { lineHeight: 18, min: 30, max: 200 }),
 * };
 *
 * Lưu ý: phải bật `enableVariableRowHeight: true` thì provider mới có tác dụng, và
 * phải có CSS cho `.slick-cell` xuống dòng (`white-space: normal`) — mặc định
 * SlickGrid đặt `white-space: nowrap`.
 *
 * Khi nội dung đổi mà SỐ DÒNG không đổi, gọi `grid.invalidateRowHeights()` để
 * SlickGrid dựng lại index chiều cao. Đổi bề rộng cột cũng vậy.
 */
export function makeTextRowHeightProvider(
  fields: string[] | '*',
  options: TextRowHeightOptions = {}
): (grid: SlickGrid, row: number, item: any) => number | undefined {
  const opts = { ...DEFAULTS, ...options };
  const allColumns = fields === '*';
  const wanted = allColumns ? null : new Set(fields as string[]);
  let font = opts.font;
  /** đã đo được font THẬT chưa (khác với font tạm lúc grid còn rỗng) */
  let fontResolved = !!opts.font;
  /** đã hẹn dựng lại index sau khi grid vẽ xong lần đầu chưa */
  let fontRetryScheduled = false;
  let spaceW = 0;

  return (grid: SlickGrid, _row: number, item: any): number | undefined => {
    if (!item) {
      return undefined;
    }

    // Lần dựng index đầu tiên grid chưa có ô nào nên chưa đo được font thật.
    // KHÔNG được cache font tạm: nếu cache, cả vòng đời grid sẽ đo bằng
    // '12px sans-serif' trong khi font thật khác -> hụt dòng -> cắt chữ.
    // Khi đo được font thật thì yêu cầu SlickGrid dựng lại index chiều cao
    // đúng MỘT lần (fontResolved chặn lặp vô hạn).
    if (!fontResolved) {
      const container = (grid as any)?.getContainerNode?.() as
        | HTMLElement
        | undefined;
      const detected = detectFont(container);
      if (detected) {
        font = detected;
        fontResolved = true;
        spaceW = 0;
        queueMicrotask(() => (grid as any)?.invalidateRowHeights?.());
      } else {
        font = FALLBACK_FONT;
        // Lần dựng index ĐẦU TIÊN chạy trước khi grid vẽ ô nào nên chưa đo được
        // font thật. Nếu không tự hẹn dựng lại thì sẽ không có gì gọi provider
        // lần nữa: chiều cao giữ nguyên theo font tạm, dòng bị lệch (rõ nhất ở
        // grid có frozenColumn vì 2 khung trái/phải cao khác nhau) cho tới khi
        // người dùng click làm grid vẽ lại.
        // setTimeout(0) chạy sau khi grid render xong lượt đầu -> lúc đó đã có
        // .slick-cell để đo font, provider chạy lại và áp chiều cao đúng.
        if (!fontRetryScheduled) {
          fontRetryScheduled = true;
          setTimeout(() => (grid as any)?.invalidateRowHeights?.(), 0);
        }
      }
    }
    if (!spaceW) {
      spaceW = textWidth(' ', font, opts.avgCharWidth);
    }

    // Đọc bề rộng cột TRỰC TIẾP mỗi lần, không cache.
    // Cache theo số cột là sai: `setColumns()` và thao tác kéo giãn cột làm đổi
    // width mà giữ nguyên số cột, khiến giá trị cũ tồn tại mãi và tính hụt chiều cao.
    // Vòng lặp này chỉ O(số cột) nên rẻ hơn nhiều so với đo chữ.
    const columns: Column[] = grid.getVisibleColumns?.() ?? grid.getColumns();

    let maxLines = 1;
    for (const col of columns) {
      const field = col?.field as string;
      if (!field || (wanted && !wanted.has(field))) {
        continue;
      }
      const raw = item[field];
      if (raw === null || raw === undefined || raw === '') {
        continue;
      }
      const avail = (col.width ?? 0) - opts.cellPaddingX;
      const lines = countLines(String(raw), avail, font, opts.avgCharWidth, spaceW);
      if (lines > maxLines) {
        maxLines = lines;
      }
    }

    // Một dòng thì trả undefined để SlickGrid dùng rowHeight mặc định.
    if (maxLines <= 1) {
      return undefined;
    }

    const height = maxLines * opts.lineHeight + opts.padding;
    return Math.min(opts.max, Math.max(opts.min, height));
  };
}
