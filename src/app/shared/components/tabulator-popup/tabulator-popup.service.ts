import {
  Injectable,
  ComponentRef,
  ViewContainerRef,
  ApplicationRef,
  Injector,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { TabulatorPopupComponent } from './tabulator-popup.component';
import { ColumnDefinition } from 'tabulator-tables';

export interface TabulatorPopupConfig {
  data: any[];
  columns: ColumnDefinition[];
  searchFields?: string[];
  searchPlaceholder?: string;
  height?: string;
  selectableRows?: number | boolean;
  layout?: 'fitData' | 'fitColumns' | 'fitDataFill' | 'fitDataStretch' | 'fitDataTable';
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  minWidth?: string;
  maxWidth?: string;
  showClearButton?: boolean; // Hiển thị nút Clear để xóa giá trị đã chọn
  onRowSelected?: (data: any) => void;
  onCleared?: () => void; // Callback khi click nút Clear
  onClosed?: () => void;
}

/**
 * Service để quản lý Tabulator Popup
 * 
 * Usage:
 * constructor(private tabulatorPopupService: TabulatorPopupService) {}
 * 
 * showPopup(cellElement: HTMLElement) {
 *   this.tabulatorPopupService.open({
 *     data: this.productOptions,
 *     columns: this.productColumns,
 *     searchFields: ['ProductCode', 'ProductName'],
 *     onRowSelected: (product) => {
 *       console.log('Selected:', product);
 *       this.tabulatorPopupService.close();
 *     }
 *   }, cellElement);
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class TabulatorPopupService {
  private popupComponentRef: ComponentRef<TabulatorPopupComponent> | null = null;
  private popupContainer: HTMLElement | null = null;
  private clickOutsideHandler: ((event: MouseEvent) => void) | null = null;
  private triggerElement: HTMLElement | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ) {}

  /**
   * Mở popup tại vị trí của element
   */
  open(config: TabulatorPopupConfig, triggerElement: HTMLElement): void {
    // Đóng popup cũ nếu có
    this.close();

    this.triggerElement = triggerElement;

    // Tạo container cho popup
    this.popupContainer = document.createElement('div');
    this.popupContainer.classList.add('tabulator-popup-wrapper');
    
    // Tính toán vị trí
    const rect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgeMargin = 8;

    // Nếu trigger nằm trong modal (ngb-modal/nz-modal) thì kẹp popup theo biên của modal
    // thay vì cả viewport, tránh tràn popup ra ngoài hộp thoại đè lên nội dung trang phía sau
    const boundaryEl = triggerElement.closest(
      '.modal-content, .modal-dialog, .ant-modal-content, nz-modal-container'
    ) as HTMLElement | null;
    const boundaryRect = boundaryEl
      ? boundaryEl.getBoundingClientRect()
      : { left: 0, right: viewportWidth, top: 0, bottom: viewportHeight };

    const spaceBelow = boundaryRect.bottom - rect.bottom;
    const spaceAbove = rect.top - boundaryRect.top;

    // Responsive: nếu maxWidth/minWidth cấu hình rộng hơn vùng chứa (modal hoặc viewport) thì co lại cho vừa
    const parsePx = (value: string | undefined, fallback: number): number => {
      const n = parseInt(value || '', 10);
      return isNaN(n) ? fallback : n;
    };
    const availableWidth = Math.max(boundaryRect.right - boundaryRect.left - edgeMargin * 2, 0);
    const maxWidthPx = Math.min(parsePx(config.maxWidth, 700), availableWidth);
    const minWidthPx = Math.min(parsePx(config.minWidth, 500), maxWidthPx);

    // Set position
    this.popupContainer.style.position = 'fixed';
    this.popupContainer.style.zIndex = '10000';
    this.popupContainer.style.minWidth = minWidthPx + 'px';
    this.popupContainer.style.maxWidth = maxWidthPx + 'px';
    this.popupContainer.style.width = maxWidthPx + 'px';

    // Custom position hoặc auto-calculate
    if (config.position) {
      if (config.position.top) this.popupContainer.style.top = config.position.top;
      if (config.position.left) this.popupContainer.style.left = config.position.left;
      if (config.position.right) this.popupContainer.style.right = config.position.right;
      if (config.position.bottom) this.popupContainer.style.bottom = config.position.bottom;
    } else {
      // Auto position theo chiều ngang, kẹp lại trong biên modal/viewport để không bị tràn ra ngoài
      let left = rect.left;
      if (left + maxWidthPx > boundaryRect.right - edgeMargin) {
        left = boundaryRect.right - maxWidthPx - edgeMargin;
      }
      if (left < boundaryRect.left + edgeMargin) {
        left = boundaryRect.left + edgeMargin;
      }
      this.popupContainer.style.left = left + 'px';

      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        // Hiển thị phía trên
        this.popupContainer.style.bottom = (viewportHeight - rect.top) + 'px';
      } else {
        // Hiển thị phía dưới
        this.popupContainer.style.top = rect.bottom + 'px';
      }
    }

    document.body.appendChild(this.popupContainer);

    // Tạo component
    this.popupComponentRef = createComponent(TabulatorPopupComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector,
    });

    // Set inputs
    this.popupComponentRef.instance.data = config.data;
    this.popupComponentRef.instance.columns = config.columns;
    this.popupComponentRef.instance.searchFields = config.searchFields || [];
    this.popupComponentRef.instance.searchPlaceholder = config.searchPlaceholder || 'Tìm kiếm...';
    this.popupComponentRef.instance.height = config.height || '300px';
    this.popupComponentRef.instance.selectableRows = config.selectableRows ?? 1;
    this.popupComponentRef.instance.layout = config.layout || 'fitColumns';
    this.popupComponentRef.instance.showClearButton = config.showClearButton ?? false;

    // Subscribe to outputs
    this.popupComponentRef.instance.rowSelected.subscribe((data: any) => {
      if (config.onRowSelected) {
        config.onRowSelected(data);
      }
    });

    this.popupComponentRef.instance.cleared.subscribe(() => {
      if (config.onCleared) {
        config.onCleared();
      }
      this.close();
    });

    this.popupComponentRef.instance.closed.subscribe(() => {
      if (config.onClosed) {
        config.onClosed();
      }
      this.close();
    });

    // Attach to application
    this.appRef.attachView(this.popupComponentRef.hostView);

    // Append to container
    const domElem = this.popupComponentRef.location.nativeElement;
    this.popupContainer.appendChild(domElem);

    // Setup click outside handler
    this.setupClickOutsideHandler();

    // Mark trigger element
    triggerElement.classList.add('popup-open');
  }

  /**
   * Đóng popup
   */
  close(): void {
    // Remove click outside handler
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }

    // Remove popup-open class from trigger
    if (this.triggerElement) {
      this.triggerElement.classList.remove('popup-open');
      this.triggerElement = null;
    }

    // Destroy component
    if (this.popupComponentRef) {
      this.appRef.detachView(this.popupComponentRef.hostView);
      this.popupComponentRef.destroy();
      this.popupComponentRef = null;
    }

    // Remove container
    if (this.popupContainer) {
      this.popupContainer.remove();
      this.popupContainer = null;
    }
  }

  /**
   * Check if popup is currently open
   */
  isOpen(): boolean {
    return this.popupComponentRef !== null;
  }

  /**
   * Setup click outside handler
   */
  private setupClickOutsideHandler(): void {
    this.clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        this.popupContainer &&
        !this.popupContainer.contains(target) &&
        this.triggerElement &&
        !this.triggerElement.contains(target)
      ) {
        this.close();
      }
    };

    // Delay để không trigger ngay lập tức
    setTimeout(() => {
      if (this.clickOutsideHandler) {
        document.addEventListener('click', this.clickOutsideHandler);
      }
    }, 100);
  }

  /**
   * Update popup data
   */
  updateData(newData: any[]): void {
    if (this.popupComponentRef) {
      this.popupComponentRef.instance.refreshData(newData);
    }
  }
}
