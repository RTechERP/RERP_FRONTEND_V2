import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
@Directive({
  selector: '[appAutocompleteDirective]',
  standalone: true
})
export class AutocompleteDirectiveDirective implements AfterViewInit {

   constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    this.renderer.setAttribute(
      this.el.nativeElement,
      'autocomplete',
      'on'
    );
  }

}
