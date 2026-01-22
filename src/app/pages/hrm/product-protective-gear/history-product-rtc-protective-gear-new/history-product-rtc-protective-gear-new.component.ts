import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDragEnd, CdkDragMove, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';

// ng-zorro
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

// ng-bootstrap
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Services
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { AppUserService } from '../../../../services/app-user.service';
import { MenuItem, PrimeIcons } from 'primeng/api';
// Components
import { HistoryProductRtcProtectiveGearDetailComponent } from '../history-product-rtc-protective-gear-detail/history-product-rtc-protective-gear-detail.component';

// Config
import { ID_ADMIN_DEMO_LIST, NOTIFICATION_TITLE } from '../../../../app.config';
import { BorrowProductHistoryEditPersonComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-edit-person/borrow-product-history-edit-person.component';
import { HistoryProductExtendModalComponent } from '../history-product-extend-modal/history-product-extend-modal.component';
import { Menubar } from "primeng/menubar";
@Component({
  selector: 'app-history-product-rtc-protective-gear-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzTagModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzTabsModule,
    NzDropDownModule,
    NzModalModule,
    Menubar
  ],
  templateUrl: './history-product-rtc-protective-gear-new.component.html',
  styleUrls: ['./history-product-rtc-protective-gear-new.component.css']
})
export class HistoryProductRtcProtectiveGearNewComponent implements OnInit, OnDestroy {
  // Parameters
  keyword: string = '';
  menuBars: MenuItem[] = [];
  // Data
  dataset: any[] = [];
  datasetByType: Map<number, any[]> = new Map(); // Grouped by LocationType
  isLoading: boolean = false;

  // Layout management
  selectedTab: number = 0; // 1=Tủ khóa, 2=Tủ bảo hộ, 3=Lưu layout
  isDefault: boolean = false; // Use default grid positions
  hasUnsavedChanges: boolean = false; // Track if positions changed
  currentInsertionTarget: number = -1; // Index of card being hovered for insertion indicator
  private lastDragMoveTime: number = 0; // Throttle drag move events
  private isScrolling: boolean = false; // Disable indicator during scroll
  private scrollTimeout: any = null; // Scroll debounce timer
  private scrollContainer: HTMLElement | null = null; // Cache scroll container reference
  private scrollPositions: Map<number, number> = new Map(); // Save scroll positions per tab

  private subscriptions: Subscription[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private productProtectiveGearService: ProductProtectiveGearService,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
  }
  initMenuBar() {
    this.menuBars = [
      {
        label: 'Đăng kí mượn',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: true,
        command: () => {
        },
      },


    ]
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.isLoading = true;
    const sub = this.productProtectiveGearService.getProductRTCDetailNew(this.keyword).subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.dataset = data.map((item: any, index: number) => ({
          ...item,
          id: (item.ID || 0) * 1000000 + index,
        }));

        // Group by LocationType (1, 2, 3) and calculate SortOrder
        this.datasetByType.clear();
        for (let i = 1; i <= 3; i++) {
          let typeData = this.dataset.filter(x => x.LocationType === i);

          if (this.isDefault) {
            // ✅ Reset to default: Sort by STT (original order) like WinForm
            typeData = typeData.sort((a, b) => (a.STT || 0) - (b.STT || 0));
            // Assign new SortOrder based on index
            typeData.forEach((item, index) => {
              item.SortOrder = index + 1;
            });
          } else {
            // Normal: Calculate SortOrder from CoordinatesX/Y
            typeData = this.productProtectiveGearService.calculateSortOrderFromCoordinates(typeData);
          }

          this.datasetByType.set(i, typeData);
        }

        // Reset isDefault flag after loading
        if (this.isDefault) {
          this.isDefault = false;
        }

        console.log('datasetByType 1 (with calculated SortOrder)', this.datasetByType.get(1));
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (error.message || error)
        );
      }
    });
    this.subscriptions.push(sub);
  }

  filter() {
    this.loadData();
  }


  // Drag and drop handler - INSERT at position (1 2 3 4 5 -> drag 5 between 2&3 -> 1 2 5 3 4)
  drop(event: CdkDragDrop<any[]>) {
    // Get current tab's data
    const locationType = this.selectedTab + 1;
    const items = this.datasetByType.get(locationType);

    if (!items) return;

    const draggedItem = event.item.data; // cdkDragData
    const draggedIndex = items.findIndex(x => x.id === draggedItem.id);

    if (draggedIndex === -1) return;

    // Get pointer position from the event
    const dropPoint = event.dropPoint;

    // Find the target card element at drop position
    const elements = document.elementsFromPoint(dropPoint.x, dropPoint.y);
    const targetCard = elements.find(el => el.classList.contains('card-wrapper-absolute'));

    if (!targetCard) return;

    // Find target index by matching DOM element with items
    const allCards = Array.from(document.querySelectorAll('.tab-container:not([hidden]) .card-wrapper-absolute'));
    const targetIndex = allCards.indexOf(targetCard);

    console.log('Drag item', draggedItem.ProductCode, 'from index', draggedIndex, 'to index', targetIndex);

    if (targetIndex === -1 || targetIndex === draggedIndex) return;

    // INSERT: Remove from old position and insert at new position
    moveItemInArray(items, draggedIndex, targetIndex);

    console.log('Inserted at position', targetIndex);
    console.log('New order:', items.map(x => x.ProductCode).join(', '));

    // Update SortOrder for all items
    items.forEach((item, index) => {
      item.SortOrder = index + 1;
    });

    // CRITICAL: Create new array reference to force Angular change detection
    const newArray = [...items];
    this.datasetByType.set(locationType, newArray);

    // Trigger change detection manually
    this.cdr.markForCheck();

    // Mark as changed
    this.hasUnsavedChanges = true;
  }






  // Drag end handler - not needed for grid layout but kept for compatibility
  onDragEnded(event: CdkDragEnd, item: any) {
    // For grid layout, we use SortOrder instead of coordinates
    // Position is already tracked in drop() via array reordering
  }

  // Track drag position for insertion indicator - THROTTLED to prevent lag
  onDragMoved(event: CdkDragMove) {
    // Throttle: only run every 50ms
    const now = Date.now();
    if (now - this.lastDragMoveTime < 50) {
      return;
    }
    this.lastDragMoveTime = now;

    const point = event.pointerPosition;
    const elements = document.elementsFromPoint(point.x, point.y);

    // Find target card, excluding the dragged card itself
    const targetCard = elements.find(el =>
      el.classList.contains('card-wrapper-absolute') &&
      !el.classList.contains('cdk-drag-preview')
    );

    if (targetCard) {
      const allCards = Array.from(document.querySelectorAll('.tab-container:not([hidden]) .card-wrapper-absolute'));
      const targetIndex = allCards.indexOf(targetCard);

      if (targetIndex !== this.currentInsertionTarget && targetIndex !== -1) {
        // Clear previous indicator
        document.querySelectorAll('.insertion-target').forEach(el => el.classList.remove('insertion-target'));

        // Add indicator to new target
        targetCard.classList.add('insertion-target');
        this.currentInsertionTarget = targetIndex;
      }
    } else {
      // Only clear if we're not hovering over any card
      if (this.currentInsertionTarget !== -1) {
        this.clearInsertionTarget();
      }
    }
  }

  // Clear insertion indicator when drag starts
  onDragStarted() {
    this.currentInsertionTarget = -1;
    document.querySelectorAll('.insertion-target').forEach(el => el.classList.remove('insertion-target'));
  }

  // Clear insertion target
  clearInsertionTarget() {
    this.currentInsertionTarget = -1;
    document.querySelectorAll('.insertion-target').forEach(el => el.classList.remove('insertion-target'));
  }

  // Detect scroll within container to disable insertion indicator
  onContainerScroll(event: Event) {
    this.isScrolling = true;
    this.clearInsertionTarget();
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 100);

    // Save scroll position when user scrolls
    const locationType = this.selectedTab + 1;
    const target = event.target as HTMLElement;
    if (target) {
      this.scrollPositions.set(locationType, target.scrollTop);
    }
  }


  // TrackBy function for better performance
  trackByItemId(index: number, item: any): any {
    return item.id || index;
  }

  // Helper methods for template
  getDefaultX(index: number): number {
    return (index % 5) * 270;
  }

  getDefaultY(index: number): number {
    return Math.floor(index / 5) * 220;
  }

  // Get current tab data
  getCurrentTabData(): any[] {
    return this.datasetByType.get(this.selectedTab + 1) || [];
  }

  // Tab change handler
  onTabChange(index: number) {
    // Save current scroll position before switching
    const currentLocationType = this.selectedTab + 1;
    const scrollContainer = document.querySelector('.tab-container') as HTMLElement;
    if (scrollContainer) {
      this.scrollPositions.set(currentLocationType, scrollContainer.scrollTop);
    }

    if (this.hasUnsavedChanges) {
      const confirm = window.confirm('Bạn vừa thay đổi vị trí.\nBạn có muốn lưu lại vị trí trước không?');
      if (confirm) {
        this.saveLayout(false);
      }
      this.selectedTab = index;
      if (!confirm) {
        this.hasUnsavedChanges = false;
      }
    } else {
      this.selectedTab = index;
    }

    // Restore scroll position for new tab
    setTimeout(() => {
      const newLocationType = index + 1;
      const container = document.querySelector('.tab-container') as HTMLElement;
      if (container) {
        const savedPosition = this.scrollPositions.get(newLocationType) || 0;
        container.scrollTop = savedPosition;
      }
    }, 0);
  }

  // Save layout positions
  saveLayout(showConfirm: boolean = true) {
    if (showConfirm) {
      const confirm = window.confirm('Bạn có chắc muốn lưu lại layout không?');
      if (!confirm) return;
    }
    this.performSaveLayout();
  }

  private performSaveLayout() {
    const itemsToSave: any[] = [];

    // Collect all items from all tabs with their SortOrder
    this.datasetByType.forEach((items, locationType) => {
      items.forEach((item, index) => {
        // Use ProductLocationID for unique identification
        if (item.ProductLocationID) {
          itemsToSave.push({
            productLocationID: item.ProductLocationID,
            locationType: locationType,
            sortOrder: item.SortOrder || (index + 1)
          });
        }
      });
    });
    if (itemsToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có vị trí nào để lưu!');
      return;
    }
    // Call API to save sort order
    this.productProtectiveGearService.saveProductSortOrder(itemsToSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thông báo', 'Lưu vị trí thành công!');
          this.hasUnsavedChanges = false;
          this.loadData();
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu vị trí thất bại!');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể lưu vị trí: ' + (error.message || error));
      }
    });
  }


  // Reset to default grid layout
  resetLayout() {
    const confirm = window.confirm('Bạn có chắc muốn cài đặt lại vị trí mặc định không?\nLayout trước đó sẽ bị mất và không thể lấy lại!');
    if (confirm) {
      this.isDefault = true;
      this.hasUnsavedChanges = true;
      this.loadData();
    }
  }

  // Warning before leaving page with unsaved changes
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedChanges) {
      $event.returnValue = true;
    }
  }

  // Get status color for card header
  getStatusColor(item: any): string {
    const status = item.Status;
    const statusNew = item.StatusNew;

    // Red for damaged/lost or overdue
    if (statusNew != 0) {
      return '#C74115';
    }
    // Yellow for registered
    else if (status == 1) {
      return '#FFCA2C';
    }
    // Green for normal status
    else {
      return '#3D8642';
    }
  }

  // Get status text color
  getStatusTextColor(item: any): string {
    const status = item.Status;
    const statusNew = item.StatusNew;

    // White text for red background
    if (status == 2 || status == 3 || statusNew == 5) {
      return '#ffffff';
    }

    return '#ffffff';
  }

  // Format date
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return DateTime.fromISO(dateStr).toFormat('dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  }

  // Handle dropdown menu actions
  handleFunctionClick(action: string, item: any) {
    switch (action) {
      case 'borrow': // mượn
        this.openBorrowModal(item);
        break;
      case 'return': // trả
        this.openReturnModal(item);
        break;
      case 'extend':// gia hạn 
        this.openExtendModal(item);
        break;
      case 'approve-borrow': // duyệt mượn
        this.approveBorrow(item);
        break;
      case 'approve-return': // duyệt trả
        this.approveReturn(item);
        break;
      case 'approve-extend': // duyệt gia hạn 
        this.approveExtend(item);
        break;
      case 'edit-borrower': // sửa người mượn
        this.editBorrower(item);
        break;
      case 'washing': // đang giặt
        this.markAsWashing(item);
        break;
      case 'in-use':// đưa vào sử dụng
        this.markAsInUse(item);
        break;
      case 'delete': // xóa
        this.deleteItem(item);
        break;
    }
  }

  private openBorrowModal(item: any) {
    // mượn 
    // thêm sản phẩm luôn vào form mượn
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;
          console.log('data mượn', data);
          console.log('item mượn', item);
          if (data.Status > 0) {
            this.notification.warning('Thông báo', 'Sản phẩm ' + item.ProductName + ' đang được mượn!');
            return;
          }
          else if (item.Status == 1) {
            this.notification.warning('Thông báo', 'Sản phẩm ' + item.ProductName + ' đang được giặt!');
            return;
          }
          else {
            const modalRef = this.modalService.open(
              HistoryProductRtcProtectiveGearDetailComponent,
              {
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
              }
            )
            // Pass preselected product to modal
            modalRef.componentInstance.preselectedProduct = item;
            modalRef.result.finally(() => {
              // Delay to ensure API save completes before reloading
              setTimeout(() => {
                this.loadData();
              }, 800);
            });

          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });

  }

  private openReturnModal(item: any) {
    // trả thiết bị 
    if (item.HistortyID == 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;
          let isValid = data.Status != 1 && data.Status != 4 && data.Status != 7;
          if (isValid) {
            this.notification.warning('Thông báo', 'Trạng thái hiện tại không cho phép trả sản phẩm!');
            return;
          }
          else {
            this.modal.confirm({
              nzTitle: 'Xác nhận trả',
              nzContent: `Bạn có chắc chắn muốn trả sản phẩm ${item.ProductName} không?`,
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOnOk: () => {
                this.productProtectiveGearService.postReturnProductRTC(item.HistortyID, false, 0).subscribe({
                  next: (response: any) => {
                    if (response.status === 1) {
                      this.notification.success('Thông báo', 'Trả sản phẩm thành công!');
                      // nếu chưa lưu layout thì hỏi
                      this.loadData();
                    }
                  },
                  error: (error: any) => {
                    this.notification.error(
                      NOTIFICATION_TITLE.error,
                      'Lỗi khi trả sản phẩm: ' + (error.message || error)
                    );
                  }
                });
              },
            });

          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private openExtendModal(item: any) {
    // gia hạn --> mở form gia hạn
    if (item.HistortyID <= 0) {
      return;
    }

    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;

          // Check if product can be extended
          if (data.Status == 0) {
            this.notification.warning('Thông báo', 'Sản phẩm ' + item.ProductName + ' đã trả, không thể gia hạn!');
            return;
          }

          // Open extend modal using NzModalService
          const modalRef = this.modal.create({
            nzTitle: 'GIA HẠN',
            nzContent: HistoryProductExtendModalComponent,
            nzWidth: 400,
            nzFooter: null,
            nzClosable: true,
            nzMaskClosable: false,
            nzData: {
              item: item,
              currentReturnDate: data.DateReturnExpected ? new Date(data.DateReturnExpected) : null
            }
          });

          // Listen for modal close
          modalRef.afterClose.subscribe((extendDate: Date) => {
            if (extendDate) {
              // User clicked Yes - proceed with extend
              const extendData = {
                ID: data.ID,
                DateReturnExpected: extendDate.toISOString()
              };

              this.productProtectiveGearService.postSaveExtendProduct(extendData).subscribe({
                next: (extendResponse: any) => {
                  if (extendResponse.status === 1) {
                    this.notification.success('Thông báo', 'Gia hạn sản phẩm thành công!');
                    // Delay để đảm bảo API save đã hoàn thành trước khi reload data
                    setTimeout(() => {
                      this.loadData();
                    }, 800);
                  } else {
                    this.notification.error('Lỗi', extendResponse.message || 'Gia hạn sản phẩm thất bại!');
                  }
                },
                error: (error: any) => {
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi gia hạn sản phẩm: ' + (error.message || error)
                  );
                }
              });
            }
          });
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private approveBorrow(item: any) {
    // duyệt mượn
    if (item.HistortyID == 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;
          if (data.ID <= 0) {
            let isValid = data.Status != 1 && data.Status != 4 && data.Status != 7;
            if (isValid) {
              this.notification.warning('Thông báo', 'Trạng thái hiện tại không cho phép trả sản phẩm!');
              return;
            }
          }
          else {
            this.modal.confirm({
              nzTitle: 'Xác nhận duyệt mượn',
              nzContent: `Bạn có chắc chắn muốn duyệt mượn sản phẩm ${item.ProductName} không?`,
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOnOk: () => {
                this.productProtectiveGearService.postApproveBorrowingRTC(item.HistortyID, false).subscribe({
                  next: (response: any) => {
                    if (response.status === 1) {
                      this.notification.success('Thông báo', 'Duyệt mượn sản phẩm thành công!');
                      // nếu chưa lưu layout thì hỏi
                      this.loadData();
                    }
                  },
                  error: (error: any) => {
                    this.notification.error(
                      NOTIFICATION_TITLE.error,
                      'Lỗi khi trả sản phẩm: ' + (error.message || error)
                    );
                  }
                });
              },
            });
          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private approveReturn(item: any) {
    if (item.HistortyID == 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;
          if (data.ID <= 0) {
            // this.notification.warning('Thông báo', 'Sản phẩm ' + item.ProductName + ' không tồn tại!');
            return;
          }
          else {
            this.modal.confirm({
              nzTitle: 'Xác nhận duyệt trả',
              nzContent: `Bạn có chắc chắn muốn duyệt trả sản phẩm ${item.ProductName} không?`,
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOnOk: () => {
                this.productProtectiveGearService.postReturnProductRTC(item.HistortyID, false, 0).subscribe({
                  next: (response: any) => {
                    if (response.status === 1) {
                      this.notification.success('Thông báo', 'Trả sản phẩm thành công!');
                      // nếu chưa lưu layout thì hỏi
                      this.loadData();
                    }
                  },
                  error: (error: any) => {
                    this.notification.error(
                      NOTIFICATION_TITLE.error,
                      'Lỗi khi duyệt trả sản phẩm: ' + (error.message || error)
                    );
                  }
                });
              },
            });
          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private approveExtend(item: any) {
    // duyệt gia hạn
    if (item.HistortyID == 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;
          if (data.ID <= 0) {
            // this.notification.warning('Thông báo', 'Sản phẩm ' + item.ProductName + ' không tồn tại!');
            return;
          }
          else {
            this.modal.confirm({
              nzTitle: 'Xác nhận duyệt gia hạn',
              nzContent: `Bạn có chắc chắn muốn duyệt gia hạn sản phẩm ${item.ProductName} không?`,
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOnOk: () => {
                this.productProtectiveGearService.postReturnProductRTC(item.HistortyID, false, 0).subscribe({
                  next: (response: any) => {
                    if (response.status === 1) {
                      this.notification.success('Thông báo', 'Duyệt gia hạn sản phẩm thành công!');
                      // nếu chưa lưu layout thì hỏi
                      this.loadData();
                    }
                  },
                  error: (error: any) => {
                    this.notification.error(
                      NOTIFICATION_TITLE.error,
                      'Lỗi khi duyệt gia hạn sản phẩm: ' + (error.message || error)
                    );
                  }
                });
              },
            });
          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private editBorrower(item: any) {
    // sửa người mượn
    if (item.HistortyID == 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('response.data', response.data);
          if (response.data.Status == 0) {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Sản phẩm ' + item.ProductName + ' đã trả, không thể sửa người mượn!');
          } else {
            const modalRef = this.modalService.open(
              BorrowProductHistoryEditPersonComponent,
              {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                scrollable: true,
                size: 'xl',
              }
            );
            modalRef.componentInstance.arrHistoryProductID = [
              response.data.ID
            ];
            modalRef.componentInstance.ProductName = item.ProductName;
            modalRef.componentInstance.ProductCode = item.ProductCode;
            modalRef.result.finally(() => {
              // Delay để đảm bảo API save đã hoàn thành trước khi reload data
              setTimeout(() => {
                this.loadData();
              }, 800);
            });
          }
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });
  }

  private markAsWashing(item: any) {
    // đang giặt
    console.log('item', item)
    const confirm = window.confirm(`Bạn có chắc muốn cập nhật thành ${item.ProductCode} đang giặt?`);
    if (confirm) {
      this.updateStatus(item, 1);
    }
  }
  private updateStatus(item: any, status: number) {

    this.productProtectiveGearService.saveUpdateStatusProductRTC(item.ID, status).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Cập nhật trạng thái thành công!');
          this.loadData();
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi cập nhật trạng thái: ' + (error.message || error)
        );
      }
    });


  }

  private markAsInUse(item: any) {
    // đưa vào sử dụng
    const confirm = window.confirm(`Bạn có chắc muốn cập nhật thành ${item.ProductCode} vào sử dụng?`);
    if (confirm) {
      this.updateStatus(item, 0);
    }
  }

  private deleteItem(item: any) {
    // xóa
    if (item.HistortyID <= 0) {
      return;
    }
    this.productProtectiveGearService.getHistoryProductRTCByID(item.HistortyID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const confirm = window.confirm(`Bạn có chắc muốn xóa ${item.ProductCode}?\nHành động này không thể hoàn tác!`);
          if (confirm) {
            this.productProtectiveGearService.postDeleteHistoryProduct([item.HistortyID]).subscribe({
              next: (response: any) => {
                if (response.status === 1) {
                  this.notification.success('Thành công', 'Xóa thành công!');
                  this.loadData();
                }
              },
              error: (error: any) => {
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  'Lỗi khi xóa: ' + (error.message || error)
                );
              }
            })
          }
        }

      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
        );
      }
    });

  }

  // Get image URL (matching WinForm LoadImage logic)
  getImageUrl(locationImg: string | null, productCode?: string): string {
    if (!locationImg) return '';

    // If already full URL, return as-is
    if (locationImg.startsWith('http')) {
      return locationImg;
    }

    // Extract filename from path (handling both Windows and Unix paths)
    const fileName = locationImg.split(/[\\\/]/).pop() || locationImg;

    // Build URL matching WinForm pattern:
    // http://192.168.1.2:8083/api/hcns/DoPhongSach/Anh/{ProductCode}_{fileName}
    const apiUrl = 'http://192.168.1.2:8083/api/hcns';
    const pathPattern = 'DoPhongSach/Anh';

    // If we have productCode, use the pattern {ProductCode}_{fileName}
    if (productCode) {
      return `${apiUrl}/${pathPattern}/${productCode}_${fileName}`;
    }

    // Otherwise just return the file location as path
    return `${apiUrl}/${pathPattern}/${fileName}`;
  }


}
