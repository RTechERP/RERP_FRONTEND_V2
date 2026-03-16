import {
  Directive,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[middleClick]',
})
export class MiddleClickDirective {
  /**Callback function that runs when middle mouse is clicked */
  @Output() middleClickCallback = new EventEmitter<MouseEvent>();

  @HostListener('mousedown', ['$event'])
  onPointerDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      this.middleClickCallback.emit(event);
    }
  }
}
