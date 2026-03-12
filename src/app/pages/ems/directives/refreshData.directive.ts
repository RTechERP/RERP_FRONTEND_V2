// pull-down.directive.ts
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[refreshable]',
})
export class RefreshableDirective {
  /**Threshold for callback to run (default: 200px) */
  @Input() threshold = 200;
  /**Callback function that runs when the drag is completed */
  @Output() refreshCallback = new EventEmitter<void>();

  private startY: number | null = null;
  private thresholdReached = false;
  private iconWrapperEl!: HTMLElement;
  private iconEl!: HTMLElement;
  private hideTimeout: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    // --- icon setup (hidden & at top) ---
    this.iconWrapperEl = this.renderer.createElement('div');
    this.iconEl = this.renderer.createElement('div');
    this.renderer.addClass(this.iconWrapperEl, 'pull-icon-wrapper');
    this.renderer.addClass(this.iconEl, 'pull-icon');
    //this.renderer.setAttribute(this.iconEl, 'src', 'imgs/refresh-icon.gif');
    this.renderer.setStyle(this.iconWrapperEl, 'position', 'absolute');
    this.renderer.setStyle(this.iconWrapperEl, 'top', '0');
    this.renderer.setStyle(this.iconWrapperEl, 'left', '50%');
    this.renderer.setStyle(this.iconWrapperEl, 'z-index', '999');
    this.renderer.setStyle(
      this.iconWrapperEl,
      'transition',
      'transform 0.3s ease, opacity 0.5s ease'
    );
    this.renderer.setStyle(this.iconWrapperEl, 'transform', 'translate(-50%, 0)');
    this.renderer.setStyle(this.iconWrapperEl, 'opacity', '0');
    
    this.renderer.insertBefore(
      this.iconWrapperEl,
      this.iconEl,
      this.iconWrapperEl.firstChild
    );
    this.renderer.insertBefore(
      this.el.nativeElement,
      this.iconWrapperEl,
      this.el.nativeElement.firstChild
    );
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    clearTimeout(this.hideTimeout);
    this.thresholdReached = false;
    this.renderer.setStyle(this.iconWrapperEl, 'opacity', '1');
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.startY = event.clientY;
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (this.startY === null) return;

    const delta = event.clientY - this.startY;
    // clamp between 0 and threshold
    const offset = Math.min(Math.max(delta, 0), this.threshold);
    this.renderer.setStyle(
      this.iconWrapperEl,
      'transform',
      `translate(-50%, ${offset}px)`
    );

    // fire callback only once when you first hit the threshold
    if (!this.thresholdReached && delta >= this.threshold) {
      this.thresholdReached = true;
      this.refreshCallback.emit();
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onPointerEnd() {
    this.startY = null;

    // animate back up + fade out
    this.renderer.setStyle(this.iconWrapperEl, 'transform', 'translate(-50%, 0)');
    this.renderer.setStyle(this.iconWrapperEl, 'opacity', '0');
  }
}
