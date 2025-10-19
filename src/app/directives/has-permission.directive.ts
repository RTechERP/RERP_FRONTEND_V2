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
      hasPermission = this.permissionService.hasPermission(permission);
    } else if (Array.isArray(permission)) {
      hasPermission = this.permissionService.hasAnyPermission(permission);
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