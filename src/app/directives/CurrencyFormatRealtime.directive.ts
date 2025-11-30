import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCurrencyFormatRealtime]'
})
export class CurrencyFormatRealtimeDirective {
  private locale = 'en-US';
  constructor(private el: ElementRef<HTMLInputElement>) { }
@HostListener('input', ['$event'])
onInput(event: any) {
    const inputEl = this.el.nativeElement;

    const start = inputEl.selectionStart || 0;

    let rawValue = inputEl.value.replace(/[^0-9.]/g, '');

    if (rawValue === '') {
      inputEl.value = '';
      return;
    }

    const parts = rawValue.split('.');
    let numberPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

    const num = Number(numberPart);

    if (!isNaN(num)) {
      const formattedNumber = new Intl.NumberFormat(this.locale, {
        maximumFractionDigits: 0
      }).format(num);

      inputEl.value = formattedNumber + decimalPart;
    }

    const newCaretPos = this.calculateCaretPosition(rawValue, inputEl.value, start);
    inputEl.setSelectionRange(newCaretPos, newCaretPos);
  }

  private calculateCaretPosition(raw: string, formatted: string, oldPos: number): number {
    const rawLeft = raw.slice(0, oldPos).replace(/[^0-9]/g, '').length;
    let newPos = 0;
    let count = 0;

    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      if (count === rawLeft + 1) {
        newPos = i + 1;
        break;
      }
    }

    return newPos || formatted.length;
  }
}
