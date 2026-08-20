import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TravelRegistrationServiceService } from '../travel-registration-service/travel-registration-service.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import * as ExcelJS from 'exceljs';

@Component({
  standalone: true,
  selector: 'app-travel-registration-confirm-modal',
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './travel-registration-confirm-modal.component.html',
  styleUrl: './travel-registration-confirm-modal.component.css'
})
export class TravelRegistrationConfirmModalComponent implements OnInit {
  @Input() dataInput: any[] | null = null;

  isLoading = false;
  isConfirming = false;
  travelRegistrations: any[] = [];
  unconfirmedList: any[] = [];
  bgImageUrl: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.bgImageUrl = this.getSeverImageUrl('\\\\192.168.1.190\\Software\\Image\\Upload\\bgconfirm2.jpg');
    if (this.dataInput && this.dataInput.length > 0) {
      this.travelRegistrations = this.dataInput;
      this.unconfirmedList = this.travelRegistrations.filter((x: any) => x.ConfirmStatus !== 1);
    } else {
      this.loadData();
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  getSeverImageUrl(serverPath: string): string {
    if (!serverPath) return '/assets/images/bgconfirm2.jpg';
    let path = serverPath.replace(/\\/g, '/').replace(/^\/\/192\.168\.1\.190\//i, '');
    const host = environment.host ? environment.host.replace(/\/+$/, '') : '';
    if (path.startsWith('/')) path = path.substring(1);
    if (!path.toLowerCase().startsWith('api/')) {
      path = `api/share/${path}`;
    }
    return host ? `${host}/${path}` : `/${path}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.travelRegistrationService.getByEmployeeId().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1 && res.data) {
          this.travelRegistrations = res.data || [];
          this.unconfirmedList = this.travelRegistrations.filter((x: any) => x.ConfirmStatus !== 1);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get isAllConfirmed(): boolean {
    return this.travelRegistrations.length > 0 && this.travelRegistrations.every((x: any) => x.ConfirmStatus === 1);
  }

  async onExportExcel(): Promise<void> {
    const exportData = this.travelRegistrations;
    if (!exportData || exportData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DanhSachDangKyDuLich');

    // ===== COLUMN WIDTHS =====
    worksheet.columns = [
      { key: 'A', width: 6 },    // STT
      { key: 'B', width: 14 },   // Mã nhân viên
      { key: 'C', width: 24 },   // Họ tên
      { key: 'D', width: 22 },   // Phòng ban
      { key: 'E', width: 20 },   // Chức vụ
      { key: 'F', width: 14 },   // Ngày sinh
      { key: 'G', width: 8 },    // Tuổi
      { key: 'H', width: 12 },   // Chiều cao
      { key: 'I', width: 12 },   // Giới tính
      { key: 'J', width: 15 },   // Mối quan hệ
      { key: 'K', width: 32 },   // Địa chỉ
      { key: 'L', width: 16 },   // CCCD
      { key: 'M', width: 14 },   // Ngày cấp
      { key: 'N', width: 28 },   // Nơi cấp
      { key: 'O', width: 15 },   // Điện thoại
      { key: 'P', width: 16 },   // Khởi hành/Về
      { key: 'Q', width: 10 },   // Đoàn
      { key: 'R', width: 14 },   // Ngày bay (đi)
      { key: 'S', width: 16 },   // Mã chuyến bay (đi)
      { key: 'T', width: 14 },   // Giờ bay (đi)
      { key: 'U', width: 18 },   // HLKG (đi)
      { key: 'V', width: 14 },   // Ngày bay (về)
      { key: 'W', width: 16 },   // Mã chuyến bay (về)
      { key: 'X', width: 14 },   // Giờ bay (về)
      { key: 'Y', width: 18 },   // HLKG (về)
      { key: 'Z', width: 24 },   // Xe tiễn VPHN→SB Nội Bài
      { key: 'AA', width: 22 },  // Xe đón SB Cam Ranh
      { key: 'AB', width: 18 },  // Xe đi Vinwonder
      { key: 'AC', width: 18 },  // Xe đi Gala Dinner
      { key: 'AD', width: 22 },  // Xe tiễn KS→SB Cam Ranh
      { key: 'AE', width: 24 },  // Xe đón SB→VPHN
      { key: 'AF', width: 14 },  // Ngày đi (Vinwonders)
      { key: 'AG', width: 14 },  // VinWonders
      { key: 'AH', width: 12 },  // Số phòng
      { key: 'AI', width: 22 },  // Mã phòng
      { key: 'AJ', width: 15 },  // Loại giường
      { key: 'AK', width: 24 },  // Ghi chú BTC
      { key: 'AL', width: 16 },  // Xếp bàn Gala Dinner
      { key: 'AM', width: 24 },  // Ghi chú 2
      { key: 'AN', width: 24 },  // Đồng thanh toán
      { key: 'AO', width: 22 },  // Chiều cao ≥ 1m Vinwonders
      { key: 'AP', width: 16 },  // Mua HLKG
      { key: 'AQ', width: 16 },  // Tổng cộng (CBNV)
      { key: 'AR', width: 24 },  // Hỗ trợ tự túc bữa ăn
      { key: 'AS', width: 20 },  // Hỗ trợ tự túc VMB
      { key: 'AT', width: 16 },  // Tổng cộng (CT hỗ trợ)
      { key: 'AU', width: 22 },  // Theo từng người
      { key: 'AV', width: 26 },  // Tổng số tiền thanh toán
      { key: 'AW', width: 15 },  // Ngày xác nhận
      { key: 'AX', width: 22 },  // Người xác nhận
      { key: 'AY', width: 16 },  // Trạng thái
    ];

    // Set header rows height
    worksheet.getRow(1).height = 32;
    worksheet.getRow(2).height = 32;

    // Merge & Header Row 1 & Row 2
    worksheet.mergeCells('A1:A2'); worksheet.getCell('A1').value = 'STT';
    worksheet.mergeCells('B1:B2'); worksheet.getCell('B1').value = 'Mã nhân viên';
    worksheet.mergeCells('C1:C2'); worksheet.getCell('C1').value = 'Họ tên';
    worksheet.mergeCells('D1:D2'); worksheet.getCell('D1').value = 'Phòng ban';
    worksheet.mergeCells('E1:E2'); worksheet.getCell('E1').value = 'Chức vụ';
    worksheet.mergeCells('F1:F2'); worksheet.getCell('F1').value = 'Ngày sinh';
    worksheet.mergeCells('G1:G2'); worksheet.getCell('G1').value = 'Tuổi';
    worksheet.mergeCells('H1:H2'); worksheet.getCell('H1').value = 'Chiều cao';
    worksheet.mergeCells('I1:I2'); worksheet.getCell('I1').value = 'Giới tính';
    worksheet.mergeCells('J1:J2'); worksheet.getCell('J1').value = 'Mối quan hệ';
    worksheet.mergeCells('K1:K2'); worksheet.getCell('K1').value = 'Địa chỉ';
    worksheet.mergeCells('L1:L2'); worksheet.getCell('L1').value = 'CCCD';
    worksheet.mergeCells('M1:M2'); worksheet.getCell('M1').value = 'Ngày cấp';
    worksheet.mergeCells('N1:N2'); worksheet.getCell('N1').value = 'Nơi cấp';
    worksheet.mergeCells('O1:O2'); worksheet.getCell('O1').value = 'Điện thoại';
    worksheet.mergeCells('P1:P2'); worksheet.getCell('P1').value = 'Khởi hành/ Về';
    worksheet.mergeCells('Q1:Q2'); worksheet.getCell('Q1').value = 'Đoàn';

    // Lịch bay chiều đi
    worksheet.mergeCells('R1:U1'); worksheet.getCell('R1').value = 'Lịch bay chiều đi';
    worksheet.getCell('R2').value = 'Ngày bay';
    worksheet.getCell('S2').value = 'Mã chuyến bay';
    worksheet.getCell('T2').value = 'Giờ bay';
    worksheet.getCell('U2').value = 'HLKG (kg)';

    // Lịch bay chiều về
    worksheet.mergeCells('V1:Y1'); worksheet.getCell('V1').value = 'Lịch bay chiều về';
    worksheet.getCell('V2').value = 'Ngày bay chiều về';
    worksheet.getCell('W2').value = 'Mã chuyến bay chiều về';
    worksheet.getCell('X2').value = 'Giờ bay chiều về';
    worksheet.getCell('Y2').value = 'HLKG (kg) chiều về';

    // Xếp xe
    worksheet.mergeCells('Z1:AE1'); worksheet.getCell('Z1').value = 'Xếp xe';
    worksheet.getCell('Z2').value = 'Xe tiễn VPHN ➝ SB Nội Bài / VPHCM ➝ SB TSN';
    worksheet.getCell('AA2').value = 'Xe đón tại SB Cam Ranh';
    worksheet.getCell('AB2').value = 'Xe đi Vinwonder';
    worksheet.getCell('AC2').value = 'Xe đi Gala Dinner';
    worksheet.getCell('AD2').value = 'Xe tiễn KS ➝ SB Cam Ranh';
    worksheet.getCell('AE2').value = 'Xe đón SB Nội Bài ➝ VPHN / SB TSN ➝ VPHCM';

    // Vinwonders
    worksheet.mergeCells('AF1:AG1'); worksheet.getCell('AF1').value = 'Vinwonders';
    worksheet.getCell('AF2').value = 'Ngày đi';
    worksheet.getCell('AG2').value = 'VinWonders';

    // Xếp phòng
    worksheet.mergeCells('AH1:AK1'); worksheet.getCell('AH1').value = 'Xếp phòng';
    worksheet.getCell('AH2').value = 'Số phòng';
    worksheet.getCell('AI2').value = 'Mã phòng (Cung cấp sau)';
    worksheet.getCell('AJ2').value = 'Loại giường';
    worksheet.getCell('AK2').value = 'Ghi chú của BTC';

    worksheet.mergeCells('AL1:AL2'); worksheet.getCell('AL1').value = 'Xếp bàn Gala Dinner';
    worksheet.mergeCells('AM1:AM2'); worksheet.getCell('AM1').value = 'Ghi chú 2';

    // CBNV thanh toán
    worksheet.mergeCells('AN1:AQ1'); worksheet.getCell('AN1').value = 'CBNV thanh toán';
    worksheet.getCell('AN2').value = 'Đồng thanh toán';
    worksheet.getCell('AO2').value = 'Chiều cao ≥ 1m Đi Vinwonders';
    worksheet.getCell('AP2').value = 'Mua HLKG';
    worksheet.getCell('AQ2').value = 'Tổng cộng CBNV thanh toán';

    // Công ty hỗ trợ
    worksheet.mergeCells('AR1:AT1'); worksheet.getCell('AR1').value = 'Công ty hỗ trợ';
    worksheet.getCell('AR2').value = 'Hỗ trợ tự túc bữa ăn';
    worksheet.getCell('AS2').value = 'Hỗ trợ tự túc VMB';
    worksheet.getCell('AT2').value = 'Tổng cộng công ty hỗ trợ';

    // Quyết toán T9
    worksheet.mergeCells('AU1:AV1'); worksheet.getCell('AU1').value = 'Quyết toán vào kỳ lương T9';
    worksheet.getCell('AU2').value = 'Theo từng người';
    worksheet.getCell('AV2').value = 'Tổng số tiền thanh toán';

    worksheet.mergeCells('AW1:AW2'); worksheet.getCell('AW1').value = 'Ngày xác nhận';
    worksheet.mergeCells('AX1:AX2'); worksheet.getCell('AX1').value = 'Người xác nhận';
    worksheet.mergeCells('AY1:AY2'); worksheet.getCell('AY1').value = 'Trạng thái';

    // ===== HEADER STYLING WITH COLORS =====
    const styleCell = (addr: string, bgColor: string) => {
      const cell = worksheet.getCell(addr);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };
      cell.font = { bold: true, size: 11, name: 'Times New Roman' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    };

    // Nhóm thông tin cá nhân (A-O) → Cam hồng
    const personalCols1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    for (const col of personalCols1) {
      styleCell(`${col}1`, 'FAA68A');
      styleCell(`${col}2`, 'FAA68A');
    }

    // Khởi hành/Về + Đoàn (P,Q) → Vàng
    styleCell('P1', 'FFFF00'); styleCell('P2', 'FFFF00');
    styleCell('Q1', 'FFFF00'); styleCell('Q2', 'FFFF00');

    // Lịch bay chiều đi (R-U) → Vàng
    styleCell('R1', 'FFFF00');
    for (const col of ['R', 'S', 'T', 'U']) styleCell(`${col}2`, 'FFFF00');

    // Lịch bay chiều về (V-Y) → Vàng
    styleCell('V1', 'FFFF00');
    for (const col of ['V', 'W', 'X', 'Y']) styleCell(`${col}2`, 'FFFF00');

    // Xếp xe (Z-AE) → Xanh dương nhạt
    styleCell('Z1', '9DC3E6');
    for (const col of ['Z', 'AA', 'AB', 'AC', 'AD', 'AE']) styleCell(`${col}2`, '9DC3E6');

    // Vinwonders (AF-AG) → Xanh lá nhạt
    styleCell('AF1', 'A9D18E');
    for (const col of ['AF', 'AG']) styleCell(`${col}2`, 'A9D18E');

    // Xếp phòng (AH-AK) → Vàng
    styleCell('AH1', 'FFFF00');
    for (const col of ['AH', 'AI', 'AJ', 'AK']) styleCell(`${col}2`, 'FFFF00');

    // Xếp bàn Gala + Ghi chú 2 (AL,AM) → Vàng
    styleCell('AL1', 'FFFF00'); styleCell('AL2', 'FFFF00');
    styleCell('AM1', 'FFFF00'); styleCell('AM2', 'FFFF00');

    // CBNV thanh toán (AN-AQ) → Vàng đậm cam
    styleCell('AN1', 'FFC000');
    for (const col of ['AN', 'AO', 'AP', 'AQ']) styleCell(`${col}2`, 'FFC000');

    // Công ty hỗ trợ (AR-AT) → Xanh dương nhạt
    styleCell('AR1', '9DC3E6');
    for (const col of ['AR', 'AS', 'AT']) styleCell(`${col}2`, '9DC3E6');

    // Quyết toán T9 (AU-AV) → Cam đất
    styleCell('AU1', 'F4B183');
    for (const col of ['AU', 'AV']) styleCell(`${col}2`, 'F4B183');

    // Ngày xác nhận / Người xác nhận / Trạng thái (AW-AY) → Xám nhạt
    for (const col of ['AW', 'AX', 'AY']) {
      styleCell(`${col}1`, 'D9D9D9');
      styleCell(`${col}2`, 'D9D9D9');
    }

    // Add rows with formatting
    exportData.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item.EmployeeCode || '',
        item.EmployeeName || '',
        item.Department || '',
        item.PositionName || '',
        this.formatDate(item.BirthDay),
        item.Age ?? '',
        item.Height || '',
        item.Gender || '',
        item.Relationship || '',
        item.Address || '',
        item.CCCD || '',
        this.formatDate(item.CCCDIssueDate),
        item.CCCDIssuePlace || '',
        item.PhoneNumber || '',
        item.DepartureLocation || '',
        item.GroupNumber || '',
        this.formatDate(item.DepartureDate),
        item.DepartureFlightCode || '',
        item.DepartureFlightTime || '',
        item.DepartureHLKG || item.DangKyHLKGChieuDi || '',
        this.formatDate(item.ReturnDate),
        item.ReturnFlightCode || '',
        item.ReturnFlightTime || '',
        item.ReturnHLKG || item.DangKyHLKGChieuVe || '',
        item.XeVPSB || '',
        item.XeSBKS || '',
        item.XeVinWonder || '',
        item.XeGalaDinner || '',
        item.XeKSSB || '',
        item.XeSBVP || '',
        this.formatDate(item.DateDepartureVinWonder),
        (item.DangKyVinwonders === true || item.DangKyVinwonders === 1) ? 'Có' : (item.DangKyVinwonders === false || item.DangKyVinwonders === 0) ? 'Không' : '',
        item.RoomNumber || '',
        item.RommCode || '',
        item.RoomType || '',
        item.Note || '',
        item.TableNumberGala || '',
        item.Note2 || '',
        item.TripCost || '',
        item.VinWonderCost || '',
        item.HLKGCost || '',
        item.TotalCost || '',
        item.SupportLunchCost || '',
        item.SupportFlightCost || '',
        item.SupportTotalCost || '',
        item.SeptemberDeductionAmount || '',
        item.TotalPaymentAmount || '',
        this.formatDate(item.ConfirmDate),
        item.ConfirmBy || '',
        item.ConfirmStatus === 1 ? 'Đã xác nhận' : 'Chưa xác nhận'
      ]);

      row.height = 32; // Tăng khoảng cách dòng
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 11, name: 'Times New Roman' }; // Tăng font chữ
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        const isCenterCol = [1, 6, 7, 8, 9, 10, 13, 17, 18, 20, 22, 24, 32, 33, 34, 35, 36, 38, 49, 51].includes(colNumber);
        const isRightCol = [40, 41, 42, 43, 44, 45, 46, 47, 48].includes(colNumber);
        cell.alignment = {
          vertical: 'middle',
          horizontal: isCenterCol ? 'center' : (isRightCol ? 'right' : 'left'),
          wrapText: true // Tự động xuống dòng khi hết width
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DanhSachDangKyDuLich_${new Date().getTime()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file Excel thành công');
  }

  onConfirmAll(): void {
    if (this.unconfirmedList.length === 0) return;
    this.isConfirming = true;
    const confirmRequests = this.unconfirmedList.map(row =>
      this.travelRegistrationService.confirm(row.EmployeeID || row.OwnerEmployeeID, 1)
    );

    forkJoin(confirmRequests).subscribe({
      next: (responses: any[]) => {
        this.isConfirming = false;
        const successCount = responses.filter(r => r?.status === 1).length;
        if (successCount === responses.length) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận đăng ký du lịch thành công');
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xác nhận ${successCount}/${responses.length} đăng ký`);
        }
        this.loadData();
      },
      error: (err: any) => {
        this.isConfirming = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
