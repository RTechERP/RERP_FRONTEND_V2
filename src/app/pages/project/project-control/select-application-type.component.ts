import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-application-type',
  standalone: true,
  imports: [MultiSelectModule, FormsModule, CommonModule],
  template: `
    <p-multiSelect
      [options]="options"
      (ngModelChange)="onValueChange($event)"
      placeholder="Chọn kiểu ứng dụng"
      styleClass="w-full text-xs"
      [(ngModel)]="selectedIds"
      optionLabel="ApplicationName"
      optionValue="ID"
      [filter]="true"
      [showClear]="true"
      appendTo="body"
      [panelStyle]="{ 'min-width': '250px' }"
      display="chip"
    >
    </p-multiSelect>
  `,
  styles: [`
    :host ::ng-deep .p-multiselect {
        width: 100%;
        border: none;
        background: transparent;
    }
  `]
})
export class SelectApplicationTypeComponent implements OnInit {
  @Input() selectedIds: any[] = [];
  @Input() options: any[] = [];
  @Output() selectedIdsChange = new EventEmitter<any>();

  ngOnInit(): void {
  }

  onValueChange(val: any) {
    this.selectedIdsChange.emit(val);
  }
}
