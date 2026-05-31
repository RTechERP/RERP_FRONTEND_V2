import {
    Component, Input, forwardRef, ViewChild, ElementRef,
    ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule, Popover } from 'primeng/popover';

@Component({
    selector: 'app-date-input',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePickerModule, PopoverModule],
    template: `
        <div class="date-input-wrapper" [class.disabled]="isDisabled">
            <div class="date-fields">
                <input #dayRef
                    class="date-part"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="DD"
                    [value]="dayDisplay"
                    [disabled]="isDisabled"
                    (focus)="$any($event.target).select()"
                    (input)="onDayInput($event)"
                    (blur)="onDayBlur()"
                    (keydown)="onDayKeydown($event)"
                />
                <span class="separator">/</span>
                <input #monthRef
                    class="date-part"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="MM"
                    [value]="monthDisplay"
                    [disabled]="isDisabled"
                    (focus)="$any($event.target).select()"
                    (input)="onMonthInput($event)"
                    (blur)="onMonthBlur()"
                    (keydown)="onMonthKeydown($event)"
                />
                <span class="separator">/</span>
                <input #yearRef
                    class="date-part year"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="YYYY"
                    [value]="yearDisplay"
                    [disabled]="isDisabled"
                    (focus)="$any($event.target).select()"
                    (input)="onYearInput($event)"
                    (blur)="onYearBlur()"
                    (keydown)="onYearKeydown($event)"
                />
            </div>

            <button #calBtn
                type="button"
                class="calendar-btn"
                [disabled]="isDisabled"
                (click)="toggleCalendar($event)"
                tabindex="-1"
            >
                <i class="pi pi-calendar"></i>
            </button>

            <p-popover #pop appendTo="body">
                <p-datepicker
                    [(ngModel)]="calendarDate"
                    [inline]="true"
                    [showButtonBar]="true"
                    [dateFormat]="'dd/mm/yy'"
                    (onSelect)="onCalendarSelect($event)"
                    (onTodayClick)="onCalendarSelect($event)"
                    (onClear)="onCalendarClear()"
                />
            </p-popover>
        </div>
    `,
    styles: [`
        .date-input-wrapper {
            display: inline-flex;
            align-items: center;
            border: 1px solid #d9d9d9;
            background: #fff;
            height: 24px;
            gap: 4px;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .date-input-wrapper:focus-within {
            border-color: #4096ff;
            box-shadow: 0 0 0 2px rgba(5,145,255,0.1);
        }
        .date-input-wrapper.disabled {
            background: #f5f5f5;
            cursor: not-allowed;
        }
        .date-fields {
            display: flex;
            align-items: center;
            gap: 2px;
        }
        .date-part {
            border: none;
            outline: none;
            background: transparent;
            text-align: center;
            font-size: 12px;
            color: #333;
            padding: 0;
            width: 22px;
        }
        .date-part.year {
            width: 36px;
        }
        .date-part::placeholder {
            color: #bbb;
        }
        .date-part:disabled {
            cursor: not-allowed;
            color: #999;
        }
        .separator {
            color: #999;
            font-size: 14px;
            user-select: none;
            line-height: 1;
        }
        .calendar-btn {
            border: none;
            background: transparent;
            cursor: pointer;
            padding: 0 0 0 4px;
            display: flex;
            align-items: center;
            color: #666;
            font-size: 14px;
            transition: color 0.2s;
        }
        .calendar-btn:hover:not(:disabled) {
            color: #4096ff;
        }
        .calendar-btn:disabled {
            cursor: not-allowed;
            color: #bbb;
        }
        
    `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateInputComponent implements ControlValueAccessor {
    @ViewChild('dayRef') dayRef!: ElementRef<HTMLInputElement>;
    @ViewChild('monthRef') monthRef!: ElementRef<HTMLInputElement>;
    @ViewChild('yearRef') yearRef!: ElementRef<HTMLInputElement>;
    @ViewChild('pop') pop!: Popover;

    /** Format trả về value: 'date' = Date object | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy' */
    @Input() format: 'date' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy' = 'dd/MM/yyyy';

    private cdr = inject(ChangeDetectorRef);

    dayDisplay = '';
    monthDisplay = '';
    yearDisplay = '';
    calendarDate: Date | null = null;
    isDisabled = false;

    private onChange: (v: any) => void = () => {};
    private onTouched: () => void = () => {};

    // ControlValueAccessor
    writeValue(value: any): void {
        if (!value) {
            this.clear();
            this.cdr.markForCheck();
            return;
        }
        const d = this.parseValue(value);
        if (d) {
            this.setFromDate(d);
        } else {
            this.clear();
        }
        this.cdr.markForCheck();
    }

    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
    setDisabledState(disabled: boolean): void {
        this.isDisabled = disabled;
        this.cdr.markForCheck();
    }

    // Day input
    onDayInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        let val = input.value.replace(/\D/g, '').slice(0, 2);
        input.value = val;
        this.dayDisplay = val;
        if (val.length === 2) {
            const num = +val;
            if (num < 1) input.value = this.dayDisplay = '01';
            else if (num > 31) input.value = this.dayDisplay = '31';
            this.monthRef.nativeElement.focus();
            this.monthRef.nativeElement.select();
        }
        this.emitValue();
    }

    onDayBlur(): void {
        this.onTouched();
        if (this.dayDisplay.length === 1) {
            this.dayDisplay = this.dayDisplay.padStart(2, '0');
            this.dayRef.nativeElement.value = this.dayDisplay;
        }
    }

    onDayKeydown(e: KeyboardEvent): void {
        if (e.key === '/' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.monthRef.nativeElement.focus();
            this.monthRef.nativeElement.select();
        }
    }

    // Month input
    onMonthInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        let val = input.value.replace(/\D/g, '').slice(0, 2);
        input.value = val;
        this.monthDisplay = val;
        if (val.length === 2) {
            const num = +val;
            if (num < 1) input.value = this.monthDisplay = '01';
            else if (num > 12) input.value = this.monthDisplay = '12';
            this.yearRef.nativeElement.focus();
            this.yearRef.nativeElement.select();
        }
        this.emitValue();
    }

    onMonthBlur(): void {
        this.onTouched();
        if (this.monthDisplay.length === 1) {
            this.monthDisplay = this.monthDisplay.padStart(2, '0');
            this.monthRef.nativeElement.value = this.monthDisplay;
        }
    }

    onMonthKeydown(e: KeyboardEvent): void {
        if (e.key === '/' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.yearRef.nativeElement.focus();
            this.yearRef.nativeElement.select();
        }
        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            if ((e.target as HTMLInputElement).value === '') {
                e.preventDefault();
                this.dayRef.nativeElement.focus();
                this.dayRef.nativeElement.select();
            }
        }
    }

    // Year input
    onYearInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        let val = input.value.replace(/\D/g, '').slice(0, 4);
        input.value = val;
        this.yearDisplay = val;
        this.emitValue();
    }

    onYearBlur(): void {
        this.onTouched();
    }

    onYearKeydown(e: KeyboardEvent): void {
        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            if ((e.target as HTMLInputElement).value === '') {
                e.preventDefault();
                this.monthRef.nativeElement.focus();
                this.monthRef.nativeElement.select();
            }
        }
    }

    // Calendar popover
    toggleCalendar(event: MouseEvent): void {
        if (this.isDisabled) return;
        this.pop.toggle(event);
    }

    onCalendarSelect(date: Date): void {
        this.setFromDate(date);
        this.pop.hide();
        this.emitValue();
        this.cdr.markForCheck();
    }

    onCalendarClear(): void {
        this.clear();
        this.pop.hide();
        this.emitValue();
        this.cdr.markForCheck();
    }

    // Helpers
    private setFromDate(d: Date): void {
        this.dayDisplay = String(d.getDate()).padStart(2, '0');
        this.monthDisplay = String(d.getMonth() + 1).padStart(2, '0');
        this.yearDisplay = String(d.getFullYear());
        this.calendarDate = d;
    }

    private clear(): void {
        this.dayDisplay = '';
        this.monthDisplay = '';
        this.yearDisplay = '';
        this.calendarDate = null;
    }

    private emitValue(): void {
        const d = +this.dayDisplay;
        const m = +this.monthDisplay;
        const y = +this.yearDisplay;
        if (!d || !m || !y || this.yearDisplay.length < 4) {
            this.onChange(null);
            return;
        }
        const date = new Date(y, m - 1, d);
        // Nếu JS roll-over (vd: 30/02 → 01/03) thì ngày không tồn tại thực tế
        if (isNaN(date.getTime()) || date.getDate() !== d || date.getMonth() !== m - 1) {
            this.clear();
            this.cdr.markForCheck();
            this.onChange(null);
            return;
        }
        this.calendarDate = date;
        switch (this.format) {
            case 'date':
                this.onChange(date);
                break;
            case 'yyyy-MM-dd':
                this.onChange(`${y}-${this.pad(m)}-${this.pad(d)}`);
                break;
            case 'MM/dd/yyyy':
                this.onChange(`${this.pad(m)}/${this.pad(d)}/${y}`);
                break;
            default:
                this.onChange(`${this.pad(d)}/${this.pad(m)}/${y}`);
        }
    }

    private pad(n: number): string {
        return String(n).padStart(2, '0');
    }

    private parseValue(value: any): Date | null {
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
            // dd/MM/yyyy
            const m1 = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]);
            // yyyy-MM-dd
            const m2 = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    }
}
