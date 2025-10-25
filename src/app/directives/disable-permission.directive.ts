import {
  Directive,
  Input,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[disablePermission]',
  standalone: true,
})
export class DisablePermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentPermission: string | string[] | null = null;
  private originalDisabled: boolean = false;
  private originalPointerEvents: string = '';
  private originalOpacity: string = '';

  @Input() set disablePermission(permission: string | string[]) {
    this.currentPermission = permission;
    this.checkPermission(permission);
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    // Lưu trạng thái ban đầu
    this.originalDisabled = this.el.nativeElement.disabled || false;
    this.originalPointerEvents =
      this.el.nativeElement.style.pointerEvents || '';
    this.originalOpacity = this.el.nativeElement.style.opacity || '';

    // Subscribe to permission changes
    this.permissionService.permissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.currentPermission) {
          this.checkPermission(this.currentPermission);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermission(permission: string | string[]): void {
    let hasPermission = false;

    if (typeof permission === 'string') {
      // Loại bỏ dấu nháy đơn hoặc nháy kép nếu có
      const cleanPermission = permission.replace(/^['"]|['"]$/g, '');
      
      // Kiểm tra xem có phải là string có dấu phẩy không
      if (cleanPermission.includes(',')) {
        // Split thành array và trim từng permission
        const permissionArray = cleanPermission
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        hasPermission = this.permissionService.hasAnyPermission(permissionArray);
      } else {
        // Single permission
        hasPermission = this.permissionService.hasPermission(cleanPermission);
      }
    } else if (Array.isArray(permission)) {
      // Nếu là array, clean từng permission
      const cleanPermissions = permission.map(p => 
        typeof p === 'string' ? p.replace(/^['"]|['"]$/g, '') : p
      );
      hasPermission = this.permissionService.hasAnyPermission(cleanPermissions);
    }

    if (hasPermission) {
      this.enableElement();
    } else {
      this.disableElement();
    }
  }

  private disableElement(): void {
    // Disable cho button, input, select, etc.
    if (this.el.nativeElement.disabled !== undefined) {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
    }

    // Disable pointer events cho tất cả elements
    this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'none');

    // Thêm visual feedback (làm mờ)
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');

    // Thêm cursor not-allowed
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'not-allowed');

    // Thêm class để có thể style thêm
    this.renderer.addClass(this.el.nativeElement, 'permission-disabled');
  }

  private enableElement(): void {
    // Restore disabled state về trạng thái ban đầu
    if (this.el.nativeElement.disabled !== undefined) {
      this.renderer.setProperty(
        this.el.nativeElement,
        'disabled',
        this.originalDisabled
      );
    }

    // Restore pointer events
    this.renderer.setStyle(
      this.el.nativeElement,
      'pointer-events',
      this.originalPointerEvents
    );

    // Restore opacity
    this.renderer.setStyle(
      this.el.nativeElement,
      'opacity',
      this.originalOpacity
    );

    // Remove cursor style
    this.renderer.removeStyle(this.el.nativeElement, 'cursor');

    // Remove class
    this.renderer.removeClass(this.el.nativeElement, 'permission-disabled');
  }
}
