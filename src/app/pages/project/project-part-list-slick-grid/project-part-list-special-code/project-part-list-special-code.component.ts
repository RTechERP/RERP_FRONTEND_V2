import { Component, OnInit, ViewChild, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartListService } from '../../project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';

@Component({
  selector: 'app-project-part-list-special-code',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    NzSpinModule
  ],
  templateUrl: './project-part-list-special-code.component.html',
  styleUrl: './project-part-list-special-code.component.css'
})
export class ProjectPartListSpecialCodeComponent implements OnInit {
  private partListService = inject(ProjectPartListService);
  public activeModal = inject(NgbActiveModal, { optional: true });

  @ViewChild('dt') dt?: Table;

  // Parameter tìm kiếm
  @Input() keyword: string = '';

  // Dữ liệu bảng
  dataList: any[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.partListService.getAllProjectPartList().subscribe({
      next: (res: any) => {
        const rawData = res?.Data || res?.data || (Array.isArray(res) ? res : []);
        this.dataList = rawData.map((item: any) => ({
          ...item,
          ProductCode: item.ProductCode || item.productCode || '',
          SpecialCode: item.SpecialCode || item.specialCode || item.SpeccialCode || item.speccialCode || '',
          GroupMaterial: item.GroupMaterial || item.groupMaterial || item.ProductGroup || item.productGroup || '',
          Manufacturer: item.Manufacturer || item.manufacturer || item.Maker || item.maker || '',
          Unit: item.Unit || item.unit || item.UnitName || item.unitName || item.UnitCount || ''
        }));
        this.isLoading = false;

        if (this.keyword && this.keyword.trim()) {
          setTimeout(() => {
            this.dt?.filterGlobal(this.keyword.trim(), 'contains');
          }, 100);
        }
      },
      error: (err: any) => {
        console.error('Error fetching project part list special codes', err);
        this.dataList = [];
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadData();
  }

  handleClose(): void {
    this.activeModal?.dismiss();
  }
}


