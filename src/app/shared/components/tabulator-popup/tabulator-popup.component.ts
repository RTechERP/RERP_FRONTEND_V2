import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';

/**
 * Reusable Tabulator Popup Component
 * 
 * Usage:
 * <app-tabulator-popup
 *   [data]="productOptions"
 *   [columns]="productColumns"
 *   [searchFields]="['ProductCode', 'ProductName', 'ProductCodeRTC']"
 *   [searchPlaceholder]="'Tìm kiếm sản phẩm...'"
 *   [height]="'300px'"
 *   (rowSelected)="onProductSelected($event)"
 *   (closed)="onPopupClosed()"
 * ></app-tabulator-popup>
 */
@Component({
  selector: 'app-tabulator-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabulator-popup-container">
      <!-- Header with Close Button -->
      <div class="popup-header">
        <input
          #searchInput
          type="text"
          [placeholder]="searchPlaceholder"
          class="search-input"
          (input)="onSearchInput($event)"
        />
        <button *ngIf="multiSelect" class="confirm-button" (click)="confirmSelection()" title="Xác nhận">
          <i class="fas fa-check"></i> Xác nhận
        </button>
        <button *ngIf="showClearButton" class="clear-button" (click)="clearSelection()" title="Xóa giá trị">Clear</button>
        <button class="close-button" (click)="close()" title="Đóng">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Tabulator Table -->
      <div #tabulatorDiv class="tabulator-table"></div>
    </div>
  `,
  styles: [`
    .tabulator-popup-container {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 8px;
      max-height: 400px;
      overflow: hidden;
      overscroll-behavior: contain; /* Prevent scroll chaining to parent */
    }

    .popup-header {
      display: flex;
      gap: 8px;
      margin-bottom: 5px;
      align-items: center;
    }

    .search-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #1890ff;
    }

    .close-button {
      padding: 6px 10px;
      background: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .close-button:hover {
      background: #ff7875;
    }

    .close-button:active {
      background: #d9363e;
    }

    .confirm-button {
      padding: 6px 12px;
      background: #52c41a;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .confirm-button:hover {
      background: #73d13d;
    }

    .confirm-button:active {
      background: #389e0d;
    }

    .clear-button {
      padding: 4px 10px;
      background: #faad14;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .clear-button:hover {
      background: #ffc53d;
    }

    .clear-button:active {
      background: #d48806;
    }

    .tabulator-table {
      width: 100%;
    }
  `],
})
export class TabulatorPopupComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('tabulatorDiv', { static: false }) tabulatorDiv!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;

  // Input properties
  @Input() data: any[] = [];
  @Input() columns: ColumnDefinition[] = [];
  @Input() searchFields: string[] = [];
  @Input() searchPlaceholder: string = 'Tìm kiếm...';
  @Input() height: string = '300px';
  @Input() selectableRows: number | boolean = 1;
  @Input() layout: 'fitData' | 'fitColumns' | 'fitDataFill' | 'fitDataStretch' | 'fitDataTable' = 'fitColumns';
  @Input() multiSelect: boolean = false; // Enable multi-select mode
  @Input() showClearButton: boolean = false; // Show clear button to clear selection

  // Output events
  @Output() rowSelected = new EventEmitter<any>();
  @Output() multiRowsSelected = new EventEmitter<any[]>(); // Emit multiple selected rows
  @Output() closed = new EventEmitter<void>();
  @Output() cleared = new EventEmitter<void>(); // Emit when clear button is clicked

  private tabulatorInstance: Tabulator | null = null;
  private scrollListener: ((event: Event) => void) | null = null;
  private clickListener: ((event: Event) => void) | null = null;
  private scrollListenerTimeoutId: any = null;
  private clickListenerTimeoutId: any = null;
  private isDestroyed = false;

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload table data when data input changes
    if (changes['data'] && this.tabulatorInstance) {
      const currentData = changes['data'].currentValue;
      const previousData = changes['data'].previousValue;
      
      // Check if data actually changed (not just reference)
      if (currentData !== previousData) {
        console.log('TabulatorPopup: Data changed, reloading...', {
          previousLength: previousData?.length || 0,
          currentLength: currentData?.length || 0
        });
        this.tabulatorInstance.setData(currentData || []);
      }
    }
  }

  ngAfterViewInit(): void {
    this.initializeTabulator();
    
    // Auto-focus search input
    setTimeout(() => {
      if (this.searchInputRef?.nativeElement) {
        this.searchInputRef.nativeElement.focus();
      }
    }, 100);

    // Add scroll listener with delay to prevent immediate close
    // Only close if scroll happens OUTSIDE the popup container
    this.scrollListenerTimeoutId = setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.scrollListener = (event: Event) => {
        const target = event.target as HTMLElement;
        const popupContainer = this.tabulatorDiv?.nativeElement?.closest('.tabulator-popup-container');
        
        // Don't close if scrolling inside the popup itself
        // Check if the target is within the popup container
        if (popupContainer && (popupContainer.contains(target) || target === popupContainer)) {
          return;
        }
        
        // If target is document or window, it might be a main page scroll
        // We want to close if the main page scrolls, but we need to be careful
        // that it's not a scroll event bubbling up from the popup (though scroll usually doesn't bubble)
        
        this.close();
      };
      window.addEventListener('scroll', this.scrollListener as EventListener, true);
    }, 300); // Increased delay to 300ms to allow for rendering stabilization

    // Add click-outside listener to close popup
    this.clickListenerTimeoutId = setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.clickListener = (event: Event) => {
        const target = event.target as HTMLElement;
        const popupContainer = this.tabulatorDiv?.nativeElement?.closest('.tabulator-popup-container');

        // Don't close if clicking on the trigger element (it is marked with 'popup-open' by the service)
        if (target?.closest?.('.popup-open')) {
          return;
        }
        
        // Close if clicking outside the popup
        if (popupContainer && !popupContainer.contains(target)) {
          this.close();
        }
      };
      document.addEventListener('click', this.clickListener as EventListener, true);
    }, 300); // Increased delay to 300ms
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.scrollListenerTimeoutId) {
      clearTimeout(this.scrollListenerTimeoutId);
      this.scrollListenerTimeoutId = null;
    }
    if (this.clickListenerTimeoutId) {
      clearTimeout(this.clickListenerTimeoutId);
      this.clickListenerTimeoutId = null;
    }

    // Remove scroll listener
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener as EventListener, true);
      this.scrollListener = null;
    }
    // Remove click listener
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener as EventListener, true);
      this.clickListener = null;
    }
    this.destroyTabulator();
  }

  /**
   * Initialize Tabulator instance
   */
  private initializeTabulator(): void {
    if (!this.tabulatorDiv?.nativeElement) {
      console.error('Tabulator div not found');
      return;
    }

    this.tabulatorInstance = new Tabulator(this.tabulatorDiv.nativeElement, {
      height: this.height,
      data: this.data || [],
      layout: this.layout,
      selectableRows: this.multiSelect ? true : this.selectableRows, // Enable multi-select if multiSelect is true
      columns: this.columns,
    });

    // Handle row click
    this.tabulatorInstance.on('rowClick', (_e, row) => {
      const selectedData = row.getData();
      
      // In single-select mode, emit immediately
      if (!this.multiSelect) {
        this.rowSelected.emit(selectedData);
      }
      // In multi-select mode, just toggle selection (don't emit yet)
    });
  }

  /**
   * Handle search input
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    
    if (!this.tabulatorInstance) return;

    if (!value || value.trim() === '') {
      this.tabulatorInstance.clearFilter(true);
      return;
    }

    // Create filter array based on search fields
    if (this.searchFields.length > 0) {
      const filters = this.searchFields.map(field => ({
        field: field,
        type: 'like',
        value: value,
      }));
      
      // Apply OR filter (any field matches)
      this.tabulatorInstance.setFilter([filters]);
    } else {
      // If no search fields specified, clear filter
      this.tabulatorInstance.clearFilter(true);
    }
  }

  /**
   * Destroy Tabulator instance and cleanup
   */
  private destroyTabulator(): void {
    if (this.tabulatorInstance) {
      this.tabulatorInstance.destroy();
      this.tabulatorInstance = null;
    }
  }

  /**
   * Public method to refresh data
   */
  public refreshData(newData: any[]): void {
    if (this.tabulatorInstance) {
      this.tabulatorInstance.setData(newData);
    }
  }

  /**
   * Public method to close popup
   */
  public close(): void {
    this.closed.emit();
  }

  /**
   * Clear selection and emit cleared event
   */
  public clearSelection(): void {
    this.cleared.emit();
    this.close();
  }

  /**
   * Confirm selection in multi-select mode
   */
  public confirmSelection(): void {
    if (!this.tabulatorInstance) return;
    
    const selectedRows = this.tabulatorInstance.getSelectedRows();
    const selectedData = selectedRows.map(row => row.getData());
    
    if (selectedData.length > 0) {
      this.multiRowsSelected.emit(selectedData);
      this.close();
    } else {
      console.warn('No rows selected');
    }
  }

  /**
   * Public method to get Tabulator instance (if needed)
   */
  public getTabulatorInstance(): Tabulator | null {
    return this.tabulatorInstance;
  }
}
