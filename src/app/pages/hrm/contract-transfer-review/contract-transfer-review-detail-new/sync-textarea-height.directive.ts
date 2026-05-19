import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appSyncTextareaHeight]'
})
export class SyncTextareaHeightDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input('appSyncTextareaHeight') group = '';
  @Input() appSyncTextareaHeightValue: string | null = null;

  private static groups = new Map<string, Set<SyncTextareaHeightDirective>>();
  private syncQueued = false;

  constructor(private elementRef: ElementRef<HTMLTextAreaElement>, private ngZone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('appSyncTextareaHeightValue' in changes) {
      this.scheduleSync();
    }
  }

  ngAfterViewInit(): void {
    this.register();
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.addEventListener('input', this.scheduleSync);
      this.scheduleSync();
    });
  }

  ngOnDestroy(): void {
    this.unregister();
    this.elementRef.nativeElement.removeEventListener('input', this.scheduleSync);
  }

  private register(): void {
    if (!this.group) {
      return;
    }

    const directives = SyncTextareaHeightDirective.groups.get(this.group) ?? new Set<SyncTextareaHeightDirective>();
    directives.add(this);
    SyncTextareaHeightDirective.groups.set(this.group, directives);
  }

  private unregister(): void {
    const directives = SyncTextareaHeightDirective.groups.get(this.group);
    if (!directives) {
      return;
    }

    directives.delete(this);
    if (directives.size === 0) {
      SyncTextareaHeightDirective.groups.delete(this.group);
    }
  }

  private scheduleSync = (): void => {
    if (this.syncQueued) {
      return;
    }

    this.syncQueued = true;
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.syncQueued = false;
        this.syncGroupHeights();
      });
    });
  };

  private syncGroupHeights(): void {
    if (!this.group) {
      return;
    }

    const directives = SyncTextareaHeightDirective.groups.get(this.group);
    if (!directives || directives.size === 0) {
      return;
    }

    let maxHeight = 0;
    directives.forEach((dir) => {
      const textarea = dir.elementRef.nativeElement;
      textarea.style.height = 'auto';
      maxHeight = Math.max(maxHeight, textarea.scrollHeight);
    });

    if (maxHeight > 0) {
      directives.forEach((dir) => {
        dir.elementRef.nativeElement.style.height = `${maxHeight}px`;
      });
    }
  }
}
