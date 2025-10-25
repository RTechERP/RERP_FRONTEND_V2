import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]', // Đổi từ [appHasPermission] thành [hasPermission]
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;
  private currentPermission: string | string[] | null = null;

  @Input() set hasPermission(permission: string | string[]) { // Đổi từ appHasPermission thành hasPermission
    this.currentPermission = permission;
    this.checkPermission(permission);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    // Subscribe to permission changes
    this.permissionService.permissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-check permission when permissions change
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

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}