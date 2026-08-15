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
  // Đủ cho padding dọc của .slick-cell (3px trên + 3px dưới) + border 1px, còn dư chút.
  padding: 10,
  min: 30,
  max: 160,
  // Bề rộng trung bình một ký tự với font ~12px của grid. Để nhỏ hơn thực tế một chút
  // sẽ ước lượng ra NHIỀU dòng hơn — thà dư chiều cao còn hơn bị cắt chữ.
  avgCharWidth: 7,
};

/**
 * Đếm số dòng một chuỗi chiếm, tính cả xuống dòng thủ công lẫn wrap theo bề rộng cột.
 *
 * Mô phỏng đúng cách trình duyệt wrap: ưu tiên ngắt ở RANH GIỚI TỪ, chỉ cắt giữa từ
 * khi bản thân từ đó dài hơn một dòng (tương ứng `overflow-wrap: anywhere` trong CSS).
 *
 * Không được dùng `ceil(độ_dài / số_ký_tự_mỗi_dòng)`: công thức đó giả định chữ được
 * cắt đều tăm tắp nên luôn ĐẾM THIẾU — một từ không vừa phần cuối dòng sẽ bị đẩy
 * xuống dòng mới và để lại khoảng trống mà công thức kia không tính tới.
 */
function countLines(text: string, charsPerLine: number): number {
  if (!text || charsPerLine <= 0) {
    return 1;
  }

  let total = 0;
  // Formatter của các grid này dùng `white-space: pre-line` nên '\n' là xuống dòng thật.
  for (const segment of text.split('\n')) {
    const words = segment.split(/\s+/).filter(Boolean);
    if (!words.length) {
      total += 1;
      continue;
    }

    let lines = 1;
    let used = 0; // số ký tự đã dùng trên dòng hiện tại

    for (const word of words) {
      // +1 cho dấu cách, trừ khi đang ở đầu dòng
      const needed = used === 0 ? word.length : used + 1 + word.length;

      if (needed <= charsPerLine) {
        used = needed;
        continue;
      }

      // Không vừa dòng hiện tại -> xuống dòng mới
      if (used > 0) {
        lines += 1;
        used = 0;
      }

      if (word.length <= charsPerLine) {
        used = word.length;
      } else {
        // Từ dài hơn một dòng: bị cắt giữa chừng thành nhiều dòng
        const extra = Math.ceil(word.length / charsPerLine) - 1;
        lines += extra;
        used = word.length - extra * charsPerLine;
      }
    }

    total += lines;
  }

  return total;
}

/**
 * Tạo callback `rowHeightProvider` tính chiều cao dòng theo nội dung của các cột chỉ định.
 *
 * @param fields Danh sách `field` của các cột quyết định chiều cao (vd: ['Note']).
 *   Truyền `'*'` để xét TOÀN BỘ cột đang hiển thị — dùng khi muốn wrap text cả bảng.
 * @param options Tuỳ chọn tinh chỉnh; xem {@link TextRowHeightOptions}.
 *
 * @example
 * // Chỉ một vài cột nội dung dài
 * rowHeightProvider: makeTextRowHeightProvider(['Note'], { min: 40, lineHeight: 20 })
 *
 * @example
 * // Wrap toàn bảng
 * rowHeightProvider: makeTextRowHeightProvider('*', { min: 30, lineHeight: 18 })
 *
 * Lưu ý: bật `enableVariableRowHeight: true` thì provider mới có tác dụng, và phải
 * có CSS cho `.slick-cell` xuống dòng (`white-space: normal`) thì mới thấy hiệu quả —
 * mặc định SlickGrid đặt `white-space: nowrap`.
 *
 * Khi nội dung đổi mà SỐ DÒNG không đổi, phải gọi `grid.invalidateRowHeights()`
 * để SlickGrid dựng lại index chiều cao. Đổi bề rộng cột cũng vậy.
 */
export function makeTextRowHeightProvider(
  fields: string[] | '*',
  options: TextRowHeightOptions = {}
): (grid: SlickGrid, row: number, item: any) => number | undefined {
  const opts = { ...DEFAULTS, ...options };
  const allColumns = fields === '*';

  // Cache bề rộng cột để không phải quét lại danh sách cột cho từng dòng.
  // Chỉ dựng lại khi số cột đang hiển thị thay đổi.
  let widthCache: Record<string, number> = {};
  let cachedFields: string[] = allColumns ? [] : (fields as string[]);
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
      if (allColumns) {
        cachedFields = Object.keys(widthCache);
      }
      cachedColumnCount = columns.length;
    }

    let maxLines = 1;
    for (const field of cachedFields) {
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
