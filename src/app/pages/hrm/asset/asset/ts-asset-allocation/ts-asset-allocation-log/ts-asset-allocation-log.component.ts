import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AssetAllocationService } from '../ts-asset-allocation-service/ts-asset-allocation.service';

@Component({
  selector: 'app-ts-asset-allocation-log',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule],
  templateUrl: './ts-asset-allocation-log.component.html',
  styleUrl: './ts-asset-allocation-log.component.css'
})
export class TsAssetAllocationLogComponent implements OnInit, OnChanges{
   @Input() assetID!: number;
  
    logs: any[] = [];
    isLoadingLogs: boolean = false;
    ngOnInit(): void {
      this.loadLogs();
    }
  
    ngOnChanges(): void { }
  
    constructor(private assetAllocationService: AssetAllocationService) { }
  
    loadLogs(): void {
      if (!this.assetID) return;
  
      this.isLoadingLogs = true;
      this.assetAllocationService
        .getAssetLogs(this.assetID)
        .subscribe({
          next: (res: any) => {
            // ApiResponseFactory usually returns { status: 1, Data: ... } or { data: ... }
            this.logs = res?.Data || res?.data || [];
            this.isLoadingLogs = false;
          },
          error: (err) => {
            console.error('Error fetching logs', err);
            this.isLoadingLogs = false;
          },
        });
    }
  
    getLogIcon(typeLog: string): string {
      if (!typeLog) return 'info-circle';
      const type = typeLog.toUpperCase();
      if (type.includes('TẠO MỚI')) return 'plus-circle';
      if (type.includes('XÓA') || type.includes('XOÁ')) return 'delete';
      if (type.includes('SỬA') || type.includes('CẬP NHẬT')) return 'edit';
      if (type.includes('THÊM')) return 'plus-square';
      return 'info-circle';
    }
  
    handleReload(): void {
      this.loadLogs();
    }
  

}
