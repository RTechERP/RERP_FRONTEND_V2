import { TabulatorFull as Tabulator, CellComponent } from 'tabulator-tables';

const STYLE_ID = 'tabulator-cell-copy-highlight-style';
const highlightClass = 'tabulator-cell-selected-highlight';

/**
 * Inject CSS style cho highlight cell nếu chưa có
 */
function injectHighlightStyle(): void {
  // Kiểm tra xem style đã được inject chưa
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  // Tạo style tag
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${highlightClass} {
      background-color: #e6f7ff !important;
      border: 2px solid #1890ff !important;
      box-shadow: 0 0 4px rgba(24, 144, 255, 0.3) !important;
    }
  `;
  
  // Inject vào head
  document.head.appendChild(style);
}

/**
 * Utility function để setup copy cell value khi bấm Ctrl+C cho Tabulator table
 * Và highlight cell đang được chọn
 * 
 * @param table - Tabulator instance
 * @param tableElement - ElementRef hoặc HTMLElement của table container
 * 
 * @example
 * ```typescript
 * import { setupTabulatorCellCopy } from '../../shared/utils/tabulator-cell-copy.util';
 * 
 * initTable() {
 *   this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
 *     // ... config
 *   });
 *   
 *   setupTabulatorCellCopy(this.tb_Master, this.tb_MasterElement.nativeElement);
 * }
 * ```
 */
export function setupTabulatorCellCopy(
  table: Tabulator,
  tableElement: HTMLElement
): void {
  // Inject CSS style cho highlight
  injectHighlightStyle();

  let selectedCell: CellComponent | null = null;

  // Lưu cell đang được click và highlight
  table.on('cellClick', (e: any, cell: CellComponent) => {
    // Xóa highlight của cell cũ
    if (selectedCell) {
      const oldCellElement = selectedCell.getElement();
      if (oldCellElement) {
        oldCellElement.classList.remove(highlightClass);
      }
    }
    
    // Lưu cell mới và highlight
    selectedCell = cell;
    const cellElement = cell.getElement();
    if (cellElement) {
      cellElement.classList.add(highlightClass);
    }
  });

  // Xóa highlight khi click ra ngoài table
  document.addEventListener('click', (e: MouseEvent) => {
    if (selectedCell && !tableElement.contains(e.target as Node)) {
      const cellElement = selectedCell.getElement();
      if (cellElement) {
        cellElement.classList.remove(highlightClass);
      }
      selectedCell = null;
    }
  });

  // Bắt sự kiện Ctrl+C để copy cell value
  tableElement.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCell) {
      // Kiểm tra xem có text được bôi đen (selected) không
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      // Nếu có text được bôi đen, để trình duyệt xử lý copy mặc định
      if (selectedText && selectedText.length > 0) {
        return; // Không preventDefault, để trình duyệt copy text đã bôi đen
      }
      
      // Nếu không có text được bôi đen, copy toàn bộ giá trị cell
      e.preventDefault();
      const cellValue = selectedCell.getValue();
      const textToCopy = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
      
      // Copy vào clipboard
      copyToClipboard(textToCopy);
    }
  });
}

/**
 * Helper function để copy text vào clipboard
 * @param text - Text cần copy
 */
function copyToClipboard(text: string): void {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Lỗi khi copy:', err);
      // Fallback cho trình duyệt cũ
      fallbackCopyToClipboard(text);
    });
  } else {
    // Fallback cho trình duyệt cũ
    fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback method để copy text vào clipboard cho trình duyệt cũ
 * @param text - Text cần copy
 */
function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Lỗi khi copy:', err);
  }
  document.body.removeChild(textArea);
}

