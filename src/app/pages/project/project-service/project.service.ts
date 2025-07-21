import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'https://localhost:44365/api/';

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) {}

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  // Lấy danh sách thư mục dự án
  getFolders(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'Project/getfolders');
  }

  // Danh sách nhân viên khi thêm dự án
  getPms(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'Project/getpms');
  }

  // Danh sách khách hàng
  getCustomers(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'Project/getcustomers');
  }

  // Danh sách nhân viên khi thêm dự án lấy table 2 phụ trách sale/ phụ trách kỹ thuật/ leader
  getUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'Project/getusers');
  }

  // Danh sách loại dự án ProjectType
  getProjectTypes(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'Project/getprojecttypes');
  }

  // Danh sách loại dự án ProjectTypeLink
  getProjectTypeLinks(id: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getprojecttypelinks/${id}`
    );
  }

  // Load Hạng mục công việc
  getProjectItems(): string {
    return this.apiUrl + `Project/getprojectitems`;
  }

  // Load lĩnh vực kinh doanh dự án
  getBusinessFields(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getbusinessfields`);
  }

  // Lấy trạng thái dụ án
  getProjectStatus(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojectstatus`);
  }

  // modal lấy danh sách nhóm file
  getGroupFiles(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getgroupfiles`);
  }

  // modal lấy danh sách FirmBase
  getFirmBases(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getfirmbases`);
  }

  // modal lấy kiểu dự án Base
  getProjectTypeBases(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojecttypeBases`);
  }

  // modal lấy kiểu dự án Base
  getPriorityType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprioritytype`);
  }

  // modal lấy người dùng dự án
  getProjectUsers(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojectusers/${id}`);
  }

  //modal lấy dữ liệu FollowProjectBase
  getFollowProjectBases(id: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getfollowprojectbases/${id}`
    );
  }

  //modal lấy dữ liệu projectprioritydetail
  getprojectprioritydetail(id: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getprojectprioritydetail/${id}`
    );
  }

  //modal lấy dữ liệu projectprioritydetail
  checkProjectPriority(id: number, code: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/checkprojectpriority/${id}/${code}`
    );
  }

  // Danh sách dự án
  getAPIProjects(): string {
    return this.apiUrl + 'Project/getprojects';
  }

  // Lấy chi tiết công việc
  getProjectDetails(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojectdetails/${id}`);
  }

  // lấy chi tiết dự án
  getProject(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getproject/${id}`);
  }

  // lấy chi tiết dự án
  getProjectStatusById(projectId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getprojectstatuss/${projectId}`
    );
  }

  // lấy mã dự án
  getProjectCodeModal(
    projectId: number,
    shortName: string,
    projectType: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `Project/getprojectcodemodal/${projectId}/${shortName}/${projectType}`
    );
  }

  // lấy leader
  getUserTeams(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getuserteams`);
  }

  // lấy dự án
  getProjectModal(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojectmodal`);
  }

  // lấy ưu tiên dự án
  getProjectPriorityModal(id: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getprojectprioritymodal/${id}`
    );
  }

  // lấy hiện trạng  dự án
  getProjectCurrentSituation(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `Project/getprojectcurrentsituation/${projectId}/${employeeId}`
    );
  }

  // lấy độ ưu tiên cá nhân
  getPersonalPriority(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getpersonalpriority/${projectId}/${employeeId}`
    );
  }

  // Kiểm tra đã có mã dự án chưa
  checkProjectCode(projectId: number, projectCode: string): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/checkprojectcode/${projectId}/${projectCode}`
    );
  }

  // Kiểm tra đã có mã dự án chưa
  saveChangeProject(
    projectIdOld: number,
    projectIdNew: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/savechangeproject/${projectIdOld}/${projectIdNew}`
    );
  }

  // Lấy tổng hợp nhân công
  getProjectWorkReport(): string {
    return this.apiUrl + `Project/getprojectworkreport`;
  }

  // Lấy tổng hợp danh sách báo cáo
  getProjectWorkerSynthetic(): string {
    return this.apiUrl + `Project/getprojectworkersynthetic`;
  }

  // láy kiểu tổng hợp nhân công
  getWorkerType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getworkertype`);
  }

  // Xóa dự án
  deletedProject(ids: number[]): Observable<any> {
    const idArray = ids.join(',');
    return this.http.get<any>(
      this.apiUrl + `Project/deletedproject/${idArray}`
    );
  }

  // Lưu dữ liệu dự án
  saveProject(prj: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + `Project/saveproject`, prj);
  }

  // Chuyển dự án
  saveProjectWorkReport(projectWorkReport: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveprojectworkreport`,
      projectWorkReport
    );
  }

  saveProjectPersonalPriority(projectPersonalPriotity: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveProjectPersonalPriority`,
      projectPersonalPriotity
    );
  }

  // Lưu dữ liệu dự án
  saveProjectTypeLink(projectTypeLink: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveprojecttypelink`,
      projectTypeLink
    );
  }

  // Lưu dữ liệu dự án
  saveProjectStatuses(projectStatuses: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveprojectstatuses`,
      projectStatuses
    );
  }

  saveprojectpriority(projectPriority: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveprojectpriority`,
      projectPriority
    );
  }

  // Lưu dữ liệu trạng thái dự án
  saveProjectStatus(Stt: any, statusName: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl +
        `Project/saveprojectstatus?Stt=${Stt}&statusName=${statusName}`,
      {}
    );
  }

  deletedProjectPriority(projectPriorityIds: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/deletedprojectpriority`,
      projectPriorityIds
    );
  }

  setDataTree(flatData: any[], valueField: string): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Map từng item theo ID
    flatData.forEach((item) => {
      map.set(item[valueField], { ...item, _children: [] });
    });

    // Bước 2: Gắn item vào parent hoặc top-level
    flatData.forEach((item) => {
      const current = map.get(item[valueField]);
      if (item.ParentID && item.ParentID != 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(current);
        } else {
          tree.push(current);
        }
      } else {
        tree.push(current);
      }
    });

    return tree;
  }

  getSelectedRowsRecursive(data: any[]): any[] {
    let selected: any[] = [];

    data.forEach((row) => {
      selected.push(row);

      if (row._children && Array.isArray(row._children)) {
        selected = selected.concat(
          this.getSelectedRowsRecursive(row._children)
        );
      }
    });

    return selected;
  }

  // Chức năng người tham gia dự án
  getProjectEmployee(status: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/get-project-employee/${status}`
    );
  }

  getStatusProjectEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getstatusprojectemployee`);
  }

  getProjectType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getprojecttype`);
  }

  getEmployeeSuggest(projectId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/getemployeesuggest/${projectId}`
    );
  }

  getEmployeeMain(projectId: number, isDeleted: number): Observable<any> {
    debugger;
    return this.http.get<any>(
      this.apiUrl + `Project/getemployeemain/${projectId}/${isDeleted}`
    );
  }

  saveProjectEmployee(prjEmployees: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/save-project-employee`,
      prjEmployees
    );
  }

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

  //#region Tiến độ công việc dự án
  getWorkPropress(projectId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectWorkPropress/get-work-propress/${projectId}`
    );
  }
  //#endregion

  //#region Timeline công việc
  getDepartment(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectWorkTimeline/get-department`
    );
  }

  getUserTeam(departmentId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectWorkTimeline/get-user-team/${departmentId}`
    );
  }

  getDataWorkTimeline(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectWorkTimeline/get-data`, {
      params: data,
    });
  }

  getDataWorkTimelineDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectWorkTimeline/get-data-detail`,
      {
        params: data,
      }
    );
  }

  //#endregion

  //#region Khảo sát dự án
  getDataProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/get-project-survey`,
      {
        params: data,
      }
    );
  }

  approvedUrgent(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/approved-urgent`, {
      params: data,
    });
  }

  approved(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/approved-request`, {
      params: data,
    });
  }

  getTbDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/get-tb-detail`, {
      params: data,
    });
  }

  getDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/get-detail`, {
      params: data,
    });
  }

  getFileDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/get-files`, {
      params: data,
    });
  }

  viewFile(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/see-file`, {
      params: data,
    });
  }

  checkStatusDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/check-status-detail`,
      { params: data }
    );
  }

  deletedProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/deleted-project-survey`,
      { params: data }
    );
  }

  openFolder(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/open-folder`, {
      params: data,
    });
  }

  getDetailByid(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/get-detail-byid`, {
      params: data,
    });
  }

  saveProjectSurvey(projectSurveyDTO: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `ProjectSurvey/save-project-survey`,
      projectSurveyDTO
    );
  }

  saveProjectSurveyFiles(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `ProjectSurvey/save-project-survey-files`,
      data
    );
  }

  saveProjectSurveyResult(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `ProjectSurvey/save-project-survey-result`,
      data
    );
  }
  //#endregion

  //#region Hang mục công việc chậm tiến độ
  getProjectItemLate(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectItemLate/get-data`, {
      params: data,
    });
  }
  //#endregion

  //#region Timeline hạng mục công việc
  getProjectWorkItemTimeline(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectWorkItemTimeline/get-data`,
      {
        params: data,
      }
    );
  }
  //#endregion

  //#region Lấy danh sách vật tư phát sinh
  getSynthesisOfGeneratedMaterials(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `SynthesisOfGeneratedMaterials/get-data`,
      {
        params: data,
      }
    );
  }
  //#endregion

   //#region Tổng hợp dự án theo phòng ban
   getProjectSynthesisDepartment(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSynthesisDepartment/get-data`,
      {
        params: data,
      }
    );
  }
   //#endregion

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
  async exportExcel(table: any, data: any, sheetName:any, fileName:any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = table.getColumns();
    const headers = columns.map(
      (col: any) => col.getDefinition().title
    );
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
}
