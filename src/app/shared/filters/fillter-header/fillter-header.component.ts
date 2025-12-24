import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export type HeaderFilterOption = { value: string; label: string };
export type HeaderFilterApplyEvent = {
  key: string;
  appliedValues: string[] | null;
};
export type HeaderFilterOpenArgs = {
  key: string;
  anchor: HTMLElement;
  options: HeaderFilterOption[];
  appliedValues: string[] | null;
};

type DraftOption = HeaderFilterOption & { checked: boolean };

@Component({
  selector: 'app-fillter-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './fillter-header.component.html',
  styleUrl: './fillter-header.component.css',
  standalone: true,
})
export class FillterHeaderComponent {

  @Output() apply = new EventEmitter<HeaderFilterApplyEvent>();

  @ViewChild('panel') panelRef?: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  isOpen = false;
  left = 0;
  top = 0;

  searchTerm = '';
  draftOptions: DraftOption[] = [];

  private anchorElm?: HTMLElement;
  private key = '';
  private options: HeaderFilterOption[] = [];

  trackByValue = (_: number, x: DraftOption) => x.value;

  get visibleOptions(): DraftOption[] {
    const term = (this.searchTerm ?? '').trim().toLowerCase();
    if (!term) return this.draftOptions;
    return this.draftOptions.filter((x) => {
      const label = String(x.label ?? '').toLowerCase();
      const value = String(x.value ?? '').toLowerCase();
      return label.includes(term) || value.includes(term);
    });
  }

  toggle(args: HeaderFilterOpenArgs) {
    const same = this.isOpen && this.anchorElm === args.anchor && this.key === args.key;
    if (same) {
      this.close();
      return;
    }
    this.open(args);
  }

  open(args: HeaderFilterOpenArgs) {
    this.key = String(args.key ?? '');
    this.anchorElm = args.anchor;
    this.options = Array.isArray(args.options) ? args.options : [];

    const allValues = this.options.map((x) => String(x.value ?? ''));
    const applied = new Set(
      (args.appliedValues ?? allValues).map((x) => String(x ?? ''))
    );

    this.searchTerm = '';
    this.draftOptions = this.options.map((x) => ({
      value: String(x.value ?? ''),
      label: String(x.label ?? ''),
      checked: applied.has(String(x.value ?? '')),
    }));

    this.isOpen = true;
    this.reposition();
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 0);
  }

  close() {
    this.isOpen = false;
    this.anchorElm = undefined;
    this.key = '';
  }

  onSelectAll() {
    this.draftOptions = this.draftOptions.map((x) => ({ ...x, checked: true }));
  }

  onSelectNone() {
    this.draftOptions = this.draftOptions.map((x) => ({ ...x, checked: false }));
  }

  onClearClick() {
    this.apply.emit({ key: this.key, appliedValues: null });
    this.close();
  }

  onApplyClick() {
    const all = this.draftOptions.length;
    const selected = this.draftOptions
      .filter((x) => x.checked)
      .map((x) => String(x.value ?? ''));

    const appliedValues = selected.length === all ? null : selected;
    this.apply.emit({ key: this.key, appliedValues });
    this.close();
  }

  private reposition() {
    if (!this.anchorElm) return;
    const rect = this.anchorElm.getBoundingClientRect();
    this.left = Math.max(0, rect.left);
    this.top = rect.bottom;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(e: MouseEvent) {
    if (!this.isOpen) return;
    const target = e.target as Node | null;
    if (!target) return;

    const panel = this.panelRef?.nativeElement;
    if (panel?.contains(target)) return;
    if (this.anchorElm?.contains(target)) return;

    this.close();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange() {
    if (!this.isOpen) return;
    this.reposition();
  }
}
