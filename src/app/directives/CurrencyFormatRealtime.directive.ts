import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCurrencyFormatRealtime]',
  standalone: true
})
export class CurrencyFormatRealtimeDirective {
  private locale = 'en-US';
  constructor(private el: ElementRef<HTMLInputElement>) { }
  @HostListener('input', ['$event'])
  onInput(event: any) {
    const inputEl = this.el.nativeElement;

    const start = inputEl.selectionStart || 0;
    const unformatted = inputEl.value;

    let rawValue = unformatted.replace(/[^0-9.]/g, '');

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

    const newCaretPos = this.calculateCaretPosition(unformatted, inputEl.value, start);
    inputEl.setSelectionRange(newCaretPos, newCaretPos);
  }

  private calculateCaretPosition(unformatted: string, formatted: string, caretPos: number): number {
    let leftCount = 0;
    for (let i = 0; i < caretPos; i++) {
        if (/[0-9.]/.test(unformatted[i])) {
            leftCount++;
        }
    }

    if (leftCount === 0) return 0;

    let newPos = formatted.length;
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/[0-9.]/.test(formatted[i])) {
            count++;
        }
        if (count === leftCount) {
            newPos = i + 1;
            break;
        }
    }

    return newPos;
  }
}
