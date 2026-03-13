import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[shortcut]',
})
export class ShortcutDirective {
  /** Keys to match, e.g. ['ctrl', 'q'] */
  @Input('shortcut') keys: string[] = [];

  /** Event emitted when the shortcut is matched */
  @Output() shortcutTriggered = new EventEmitter<KeyboardEvent>();

  private normalizeKey(key: string): string {
    return key.toLowerCase();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.repeat) return;
    if (!this.keys || this.keys.length === 0) return;
    const required = this.keys.map((k) => this.normalizeKey(k));
    const pressed: string[] = [];

    if (event.ctrlKey) pressed.push('ctrl');
    if (event.shiftKey) pressed.push('shift');
    if (event.altKey) pressed.push('alt');
    if (event.metaKey) pressed.push('meta');

    if (
      !['control', 'shift', 'alt', 'meta'].includes(event.key.toLowerCase())
    ) {
      pressed.push(this.normalizeKey(event.key));
    }

    const match =
      required.length === pressed.length &&
      required.every((k) => pressed.includes(k));

    if (match) {
      event.preventDefault();
      this.shortcutTriggered.emit(event);
    }
  }
}
