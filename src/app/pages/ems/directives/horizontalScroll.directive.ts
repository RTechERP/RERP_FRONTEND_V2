import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[horizontalScroll]',
})
export class HorizontalScrollDirective {
  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // only act if there is actually horizontal overflow
    const scrollable = this.el.nativeElement;
    if (scrollable.scrollWidth <= scrollable.clientWidth) return;

    // prevent the page from scrolling vertically
    event.preventDefault();

    // shift vertical wheel delta into horizontal scroll
    scrollable.scrollLeft += event.deltaY;
  }
}
