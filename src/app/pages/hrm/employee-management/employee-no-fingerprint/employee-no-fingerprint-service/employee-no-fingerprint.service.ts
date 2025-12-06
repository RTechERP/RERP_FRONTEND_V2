import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { environment } from '../../../../../../environments/environment';

import * as ExcelJS from 'exceljs';

export interface EmployeeNoFingerprintRequestParam {
  Page?: number;
  Size?: number;
  DateStart?: string; // "YYYY-MM-DD" format
  DateEnd?: string; // "YYYY-MM-DD" format
  DepartmentID?: number;
  IDApprovedTP?: number;
  Status?: number;
  KeyWord?: string;
}

// Keep old interface for backward compatibility
interface ENFSearchParams {
  pageNumber?: number;
  pageSize?: number;
  dateStart?: string;
  dateEnd?: string;
  keyword?: string;
  departmentId?: number;
  idApprovedTP?: number;
  status?: number;
  isDelete?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeNofingerprintService {
  private apiUrl = `${environment.host}api/EmployeeNoFingerprint/`;

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) {}

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  GlobalDepartmentId: number = 1;

  /**
   * Get departments list (GET method)
   */
  getDepartments(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'get-department', { headers });
  }

  /**
   * Get ENF list URL for Tabulator AJAX
   * @returns string
   */
  getENFListURL(): string {
    return this.apiUrl + 'get-employee-no-fingerprint';
  }

  /**
   * Get ENF list using POST method (for Tabulator ajaxRequestFunc)
   * @param params Request parameters
   * @returns Promise with response data
   */
  getENFListPost(params: EmployeeNoFingerprintRequestParam): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const requestBody: EmployeeNoFingerprintRequestParam = {
      Page: params.Page || 1,
      Size: params.Size || 100,
      DateStart: params.DateStart || '',
      DateEnd: params.DateEnd || '',
      KeyWord: params.KeyWord || '',
      DepartmentID: params.DepartmentID || 0,
      IDApprovedTP: params.IDApprovedTP || 0,
      Status: params.Status !== null && params.Status !== undefined ? params.Status : -1,
    };

    return this.http
      .post<any>(this.apiUrl + 'get-employee-no-fingerprint', requestBody, { headers })
      .toPromise();
  }

  getEmloyeeApprover(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'get-employee-approver', { headers });
  }

  /**
   * Get ENF list with proper parameters (deprecated - use getENFListPost instead)
   * @deprecated Sử dụng getENFListPost thay thế
   */
  getENFList(params?: ENFSearchParams): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.dateStart) {
      httpParams = httpParams.set('dateStart', params.dateStart);
    }
    if (params?.dateEnd) {
      httpParams = httpParams.set('dateEnd', params.dateEnd);
    }
    if (params?.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }
    if (params?.departmentId) {
      httpParams = httpParams.set(
        'departmentId',
        params.departmentId.toString()
      );
    }
    if (params?.idApprovedTP) {
      httpParams = httpParams.set(
        'idApprovedTP',
        params.idApprovedTP.toString()
      );
    }
    if (params?.status !== null && params?.status !== undefined) {
      httpParams = httpParams.set('status', params.status.toString());
    }
    if (params?.isDelete !== null && params?.isDelete !== undefined) {
      httpParams = httpParams.set('isDelete', params.isDelete.toString());
    }

    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    console.log('ENF API URL:', this.getENFListURL());
    console.log('ENF API Params:', httpParams.toString());

    return this.http.get<any>(this.getENFListURL(), {
      headers,
      params: httpParams,
    });
  }

  saveData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'savedata', data, { headers });
  }

   checkDuplicateENF(
    id: number,
    employeeId: number,
    dayWork: string,
    type: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}check-duplicate-enf/${id}/${employeeId}/${dayWork}/${type}`
    );
  }



  // Keep the existing utility methods
  createdDataTree(
    items: any[],
    parentField: string,
    valueField: string,
    labelField: string,
    rootValue: any = 0
  ): any[] {
    const map = new Map<any, any>();

    // Tạo node dạng tree và lưu tạm vào map
    for (const item of items) {
      const node = {
        title: item[labelField],
        key: item[valueField],
        isLeaf: true,
        children: [],
      };
      map.set(item[valueField], node);
    }

    const tree: any[] = [];

    for (const item of items) {
      const parentId = item[parentField];
      const node = map.get(item[valueField]);

      if (parentId === rootValue || !map.has(parentId)) {
        // Nếu là node gốc
        tree.push(node);
      } else {
        const parentNode = map.get(parentId);
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(node);
      }
    }

    this.removeEmptyChildren(tree);
    console.log('tree', tree);
    return tree;
  }

  removeEmptyChildren(nodes: any[]) {
    for (const node of nodes) {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        delete node.isLeaf;
        this.removeEmptyChildren(node.children);
      }
    }
  }

  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),
    }));
  }

  //#region Xuất excel theo group
  async exportExcelGroup(
    table: any,
    data: any,
    sheetName: string,
    fileName: string,
    groupName: string
  ) {
    if (!data) {
      if (!data || data.length === 0) {
        if (!data || data.length === 0) {
          this.notification.error('Thông báo', 'Không có dữ liệu để xuất!');
          return;
        }
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const headers = columns.map((col: any) => col.getDefinition().title);
    worksheet.addRow(headers);

    let nums: number[] = [];
    const groupedData = new Map<string, any[]>();

    // Nhóm dữ liệu theo ProjectCode
    data.forEach((row: any) => {
      const type = row[groupName] || '';
      if (!groupedData.has(type)) {
        groupedData.set(type, []);
      }
      groupedData.get(type)?.push(row);
    });

    // Duyệt qua từng nhóm và ghi dữ liệu
    groupedData.forEach((rows, grname) => {
      const groupRow = worksheet.addRow([`${grname}`]);
      const groupRowIndex = groupRow.number;
      worksheet.mergeCells(`A${groupRowIndex}:D${groupRowIndex}`);
      nums.push(groupRowIndex);

      groupRow.font = { bold: true };
      groupRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Ghi dữ liệu thực tế của nhóm này
      rows.forEach((row: any) => {
        const rowData = columns.map((col: any, colIndex: number) => {
          const field = col.getField();
          let value = row[field];

          // Nếu là 2 cột đầu và kiểu boolean, chuyển thành checkbox biểu tượng
          if (typeof value === 'boolean') {
            return value ? '☑' : '☐';
          }
          // Format ngày nếu là ISO string
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }

          return value;
        });
        const newRow = worksheet.addRow(rowData);
      });
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any, colIndex: number) => {
      if (colIndex === 0) {
        column.width = 20;
        return;
      }

      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let cellValue = '';

        if (cell.value != null) {
          if (typeof cell.value === 'object') {
            if (cell.value.richText) {
              cellValue = cell.value.richText.map((t: any) => t.text).join('');
            } else if (cell.value.text) {
              cellValue = cell.value.text;
            } else if (cell.value.result) {
              cellValue = cell.value.result.toString();
            } else {
              cellValue = cell.value.toString();
            }
          } else {
            cellValue = cell.value.toString();
          }
        }

        const length = cellValue.length;
        maxLength = Math.max(maxLength, length + 1);
      });

      column.width = Math.min(maxLength, 20);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow({ includeEmpty: true }, (row) => {
      if (row.number === 1) return;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName + `.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion

  //#region Xuất excel thường
  async exportExcel(table: any, data: any, sheetName: any, fileName: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = table.getColumns();
    const headers = columns.map((col: any) => col.getDefinition().title);
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion

  /**
   * Get Employee No Fingerprint person list for summary
   * @param request Request parameters matching EmployeeNoFingerprintRequestParam
   * @returns Observable with response data
   */
  getEmployeeNoFingerprintPerson(request: {
    Page?: number;
    Size?: number;
    Keyword?: string;
    DateStart?: string | null;
    DateEnd?: string | null;
    IDApprovedTP?: number;
    Status?: number;
    DepartmentID?: number;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'get-employee-no-fingerprint-person', request, { headers });
  }

  /**
   * Get Employee No Fingerprint person URL for Tabulator AJAX
   * @returns string
   */
  getEmployeeNoFingerprintPersonAjax(): string {
    return this.apiUrl + 'get-employee-no-fingerprint-person';
  }
}
