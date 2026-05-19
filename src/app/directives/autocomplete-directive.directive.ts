import { Directive, ElementRef, Input, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutocompleteDirective]',
  standalone: true
})
export class AutocompleteDirectiveDirective implements AfterViewInit {

  /** Đặt true để tắt autocomplete dù input là type=text/number */
  @Input() noAutocomplete: boolean = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2
  ) { }

  ngAfterViewInit(): void {
    const el = this.el.nativeElement;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    const isTextOrNumber = type === 'text' || type === 'number';

    const value = (!this.noAutocomplete && isTextOrNumber) ? 'on' : 'off';
    this.renderer.setAttribute(el, 'autocomplete', value);
  }

}
