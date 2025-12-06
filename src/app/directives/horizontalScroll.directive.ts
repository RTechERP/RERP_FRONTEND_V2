import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[horizontalScroll]',
})
export class HorizontalScrollDirective {
  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const scrollable = this.el.nativeElement;
    if (scrollable.scrollWidth <= scrollable.clientWidth) return;
    const atLeft = scrollable.scrollLeft === 0;
    const atRight =
      scrollable.scrollLeft + scrollable.clientWidth >= scrollable.scrollWidth;
    if ((event.deltaY < 0 && atLeft) || (event.deltaY > 0 && atRight)) return;
    event.preventDefault();
    scrollable.scrollLeft += event.deltaY;
  }
}
