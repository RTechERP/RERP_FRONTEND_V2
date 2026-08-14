import type { Column, SlickGrid } from '@slickgrid-universal/common';

/**
 * Helper tạo `rowHeightProvider` cho tính năng Variable Row Height của SlickGrid v10.
 *
 * Dùng khi grid có cột nội dung dài (Note, Description, ContentError...) đang bị cắt
 * cụt vì rowHeight cố định. Trước đây cách lách là set rowHeight cao cho MỌI dòng,
 * làm những dòng nội dung ngắn bị thừa khoảng trắng.
 *
 * Lưu ý quan trọng về hiệu năng (theo tài liệu SlickGrid): callback được gọi MỘT LẦN
 * CHO MỖI DÒNG mỗi khi index chiều cao được dựng lại, nên nó phải nhanh và
 * KHÔNG được chạm vào DOM. Vì vậy ở đây chỉ ước lượng bằng số ký tự và bề rộng cột.
 */

export interface TextRowHeightOptions {
  /** Chiều cao một dòng text (px). Nên khớp line-height dùng trong formatter. */
  lineHeight?: number;
  /** Padding dọc của ô (px), cộng thêm vào tổng chiều cao. */
  padding?: number;
  /** Chiều cao tối thiểu (px) — thường để bằng rowHeight mặc định của grid. */
  min?: number;
  /** Chặn trên (px) để một ô quá dài không phá vỡ layout. */
  max?: number;
  /** Bề rộng trung bình một ký tự (px), dùng để ước lượng số dòng bị wrap. */
  avgCharWidth?: number;
}

const DEFAULTS: Required<TextRowHeightOptions> = {
  lineHeight: 20,
  padding: 8,
  min: 30,
  max: 160,
  avgCharWidth: 7,
};

/** Đếm số dòng một chuỗi chiếm, tính cả xuống dòng thủ công lẫn wrap theo bề rộng cột. */
function countLines(text: string, charsPerLine: number): number {
  if (!text) {
    return 1;
  }
  // Formatter của các grid này dùng `white-space: pre-line` nên '\n' là xuống dòng thật.
  const segments = text.split('\n');
  let lines = 0;
  for (const seg of segments) {
    lines += charsPerLine > 0 ? Math.max(1, Math.ceil(seg.length / charsPerLine)) : 1;
  }
  return lines;
}

/**
 * Tạo callback `rowHeightProvider` tính chiều cao dòng theo nội dung của các cột chỉ định.
 *
 * @param fields Danh sách `field` của các cột quyết định chiều cao (vd: ['Note']).
 * @param options Tuỳ chọn tinh chỉnh; xem {@link TextRowHeightOptions}.
 *
 * @example
 * gridOptions = {
 *   rowHeight: 40,
 *   enableVariableRowHeight: true,
 *   rowHeightProvider: makeTextRowHeightProvider(['Note'], { min: 40, lineHeight: 20 }),
 * };
 *
 * Khi nội dung đổi mà SỐ DÒNG không đổi, phải gọi `grid.invalidateRowHeights()`
 * để SlickGrid dựng lại index chiều cao. Đổi bề rộng cột cũng vậy.
 */
export function makeTextRowHeightProvider(
  fields: string[],
  options: TextRowHeightOptions = {}
): (grid: SlickGrid, row: number, item: any) => number | undefined {
  const opts = { ...DEFAULTS, ...options };

  // Cache bề rộng cột để không phải quét lại danh sách cột cho từng dòng.
  // Chỉ dựng lại khi số cột đang hiển thị thay đổi.
  let widthCache: Record<string, number> = {};
  let cachedColumnCount = -1;

  return (grid: SlickGrid, _row: number, item: any): number | undefined => {
    if (!item) {
      return undefined;
    }

    const columns: Column[] = grid.getVisibleColumns?.() ?? grid.getColumns();
    if (columns.length !== cachedColumnCount) {
      widthCache = {};
      for (const col of columns) {
        if (col?.field) {
          widthCache[col.field as string] = col.width ?? 0;
        }
      }
      cachedColumnCount = columns.length;
    }

    let maxLines = 1;
    for (const field of fields) {
      const raw = item[field];
      if (raw === null || raw === undefined || raw === '') {
        continue;
      }
      const width = widthCache[field] ?? 0;
      const charsPerLine = Math.floor((width - opts.padding) / opts.avgCharWidth);
      const lines = countLines(String(raw), charsPerLine);
      if (lines > maxLines) {
        maxLines = lines;
      }
    }

    // Chỉ một dòng thì trả undefined để SlickGrid dùng rowHeight mặc định,
    // tránh ghi đè không cần thiết.
    if (maxLines <= 1) {
      return undefined;
    }

    const height = maxLines * opts.lineHeight + opts.padding;
    return Math.min(opts.max, Math.max(opts.min, height));
  };
}
