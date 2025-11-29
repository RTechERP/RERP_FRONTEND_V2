import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AppUserService } from '../../../services/app-user.service';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = environment.host + 'api/';
  private urlProject = this.apiUrl + 'project/';
  private urlProjectSummary = this.apiUrl + 'ProjectDerpartmentSummary/';
  private urlProjectWorkPropress = this.apiUrl + 'projectworkpropress/';
  private urlProjectWorkTimeline = this.apiUrl + 'projectworktimeline/';
  private urlProjectSurvey = this.apiUrl + 'projectsurvey/';
  private urlProjectItemLate = this.apiUrl + 'projectitemlate/';
  private urlProjectWorkItemTimeline = this.apiUrl + 'projectworkitemtimeline/';
  private urlSynthesisOfGeneratedMaterials =
    this.apiUrl + 'synthesisofgeneratedmaterials/';
  private urlProjectSynthesisDepartment =
    this.apiUrl + 'projectsynthesisdepartment/';
  private urlProjectPartlistPriceRequest =
    this.apiUrl + 'projectpartlistpricerequest/';
  constructor(
    private http: HttpClient,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) {
    this.GlobalEmployeeId = this.appUserService.employeeID || 0;
    this.LoginName = this.appUserService.loginName || '';
    this.ISADMIN = this.appUserService.isAdmin || false;
    this.GlobalDepartmentId = this.appUserService.departmentID || 0;
  }
  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  GlobalDepartmentId: number = 1;
  //save hãng 
  saveFirmBase(data: any): Observable<any> {
    return this.http.post<any>(`${this.urlProject}save-firm-base`, data);
  }
  // Lấy danh sách thư mục dự án
  getFolders(): Observable<any> {
    return this.http.get<any>(this.urlProject + 'get-folders');
  }
  // Danh sách nhân viên khi thêm dự án
  getPms(): Observable<any> {
    return this.http.get<any>(this.urlProject + 'get-pms');
  }
  // Danh sách khách hàng
  getCustomers(): Observable<any> {
    return this.http.get<any>(this.urlProject + 'get-customers');
  }
  // Danh sách nhân viên khi thêm dự án lấy table 2 phụ trách sale/ phụ trách kỹ thuật/ leader
  getUsers(): Observable<any> {
    return this.http.get<any>(this.urlProject + 'get-users');
  }
  // Danh sách loại dự án ProjectType
  getProjectTypes(): Observable<any> {
    return this.http.get<any>(this.urlProject + 'get-project-types');
  }
  // Danh sách loại dự án ProjectTypeLink
  getProjectTypeLinks(id: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-project-type-links?id=${id}`
    );
  }
  // Load Hạng mục công việc
  getProjectItems(): string {
    return this.urlProject + `get-project-items`;
  }
  // Load Hạng mục công việc với Observable
  getProjectItemsData(projectId: number): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-items?id=${projectId}`);
  }
  // Load lĩnh vực kinh doanh dự án
  getBusinessFields(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-business-fields`);
  }
  // Lấy trạng thái dụ án
  getProjectStatus(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-status`);
  }
  // modal lấy danh sách nhóm file
  getGroupFiles(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-group-files`);
  }
  // modal lấy danh sách FirmBase
  getFirmBases(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-firm-bases`);
  }
  // modal lấy kiểu dự án Base
  getProjectTypeBases(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-type-bases`);
  }
  // modal lấy kiểu dự án Base
  getPriorityType(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-priority-type`);
  }
  // modal lấy người dùng dự án
  getProjectUsers(id: number): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-users?id=${id}`);
  }
  //modal lấy dữ liệu FollowProjectBase
  getFollowProjectBases(id: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-follow-project-bases?id=${id}`
    );
  }
  //modal lấy dữ liệu projectprioritydetail
  getprojectprioritydetail(id: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-project-priority-detail?id=${id}`
    );
  }
  //modal lấy dữ liệu projectprioritydetail
  checkProjectPriority(id: number, code: any): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `check-project-priority?id=${id}&code=${code}`
    );
  }
  // Danh sách dự án
  getAPIProjects(): string {
    return this.urlProject + 'get-projects';
  }
  // Danh sách dự án với pagination
  getProjectsPagination(params: any, page: number, size: number): Observable<any> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('dateTimeS', params.dateTimeS || '')
      .set('dateTimeE', params.dateTimeE || '')
      .set('keyword', params.keyword || '')
      .set('customerID', params.customerID?.toString() || '0')
      .set('saleID', params.saleID?.toString() || '0')
      .set('projectType', params.projectType || '')
      .set('leaderID', params.leaderID?.toString() || '0')
      .set('userTechID', params.userTechID?.toString() || '0')
      .set('pmID', params.pmID?.toString() || '0')
      .set('globalUserID', params.globalUserID?.toString() || '0')
      .set('bussinessFieldID', params.bussinessFieldID?.toString() || '0')
      .set('projectStatus', params.projectStatus || '')
      .set('isAGV', params.isAGV?.toString() || 'false');

    return this.http.get<any>(this.urlProject + 'get-projects', { params: httpParams });
  }
  // Lấy chi tiết công việc
  getProjectDetails(id: number): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-details?id=${id}`);
  }
  // lấy chi tiết dự án
  getProject(id: number): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project?id=${id}`);
  }
  // lấy dữ liệu dự án theo ID (API mới)
  getProjectById(id: number): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-id?id=${id}`);
  }
  // lấy chi tiết dự án
  getProjectStatusById(projectId: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-project-statuss?projectId=${projectId}`
    );
  }
  // lấy mã dự án
  getProjectCodeModal(
    projectId: number,
    shortName: string,
    projectType: number
  ): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `get-project-code-modal?projectId=${projectId}&customerShortName=${shortName}&projectType=${projectType}`
    );
  }
  // lấy leader
  getUserTeams(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-user-teams`);
  }
  // lấy dự án
  getProjectModal(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-modal`);
  }
  // lấy ưu tiên dự án
  getProjectPriorityModal(id: any): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-project-priority-modal?projectId=${id}`
    );
  }
  // lấy hiện trạng  dự án
  getProjectCurrentSituation(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `get-project-current-situation?projectId=${projectId}&employeeId=${employeeId}`
    );
  }
  // lấy dữ liệu hiện trạng theo projectID (API mới)
  getDataByProjectID(projectID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectCurrentSituation/get-data-by-projectID?projectID=${projectID}`
    );
  }
  // lấy độ ưu tiên cá nhân
  getPersonalPriority(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `get-personal-priority?projectId=${projectId}&employeeId=${employeeId}`
    );
  }
  // Kiểm tra đã có mã dự án chưa
  checkProjectCode(projectId: number, projectCode: string): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `check-project-code?id=${projectId}&projectCode=${projectCode}`
    );
  }

  // Kiểm tra đã có mã dự án chưa
  saveChangeProject(
    projectIdOld: number,
    projectIdNew: number
  ): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `save-change-project?projectIdOld=${projectIdOld}&projectIdNew=${projectIdNew}`
    );
  }

  getProjectWorkReport(): string {
    return this.urlProject + `get-project-work-report`;
  }

  // láy kiểu tổng hợp nhân công
  getWorkerType(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-worker-type`);
  }

  // Xóa dự án
  deletedProject(ids: number[]): Observable<any> {
    const idArray = ids.join(',');
    return this.http.get<any>(
      this.urlProject + `deleted-project?ids=${idArray}`
    );
  }

  // Lưu dữ liệu dự án
  saveProject(prj: any): Observable<any> {
    return this.http.post<any>(this.urlProject + `save-project`, prj);
  }

  // Chuyển dự án
  saveProjectWorkReport(projectWorkReport: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-work-report`,
      projectWorkReport
    );
  }

  saveProjectPersonalPriority(projectPersonalPriotity: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-personal-priority`,
      projectPersonalPriotity
    );
  }

  // Lưu dữ liệu dự án
  saveProjectTypeLink(projectTypeLink: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-type-link`,
      projectTypeLink
    );
  }

  // Lưu dữ liệu dự án
  saveProjectStatuses(projectStatuses: any[]): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-statuses`,
      projectStatuses
    );
  }

  saveprojectpriority(projectPriority: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-priority`,
      projectPriority
    );
  }

  // Lưu dữ liệu trạng thái dự án
  saveProjectStatus(Stt: any, statusName: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject +
      `save-project-status?Stt=${Stt}&statusName=${statusName}`,
      {}
    );
  }

  deletedProjectPriority(projectPriorityIds: any[]): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `deleted-project-priority`,
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
      // Chỉ lấy dòng được chọn (Selected === true)
      if (row.Selected === true) {
        selected.push({
          ProjectTypeLinkID: row.ProjectTypeLinkID || row.ID || 0,
          ID: row.ID,
          LeaderID: row.LeaderID || 0,
          Selected: row.Selected,
          projectTypeID: row.ProjectTypeID || row.ID
        });
      }
      
      // Đệ quy kiểm tra children
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
      this.urlProject + `get-project-employee?status=${status}`
    );
  }
  getStatusProjectEmployee(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-status-project-employee`);
  }
  getProjectType(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-type`);
  }

  getEmployeeSuggest(projectId: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `get-employee-suggest?projectId=${projectId}`
    );
  }

  getEmployeeMain(projectId: number, isDeleted: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject +
      `get-employee-main?projectId=${projectId}&isDeleted=${isDeleted}`
    );
  }

  saveProjectEmployee(prjEmployees: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `save-project-employee`,
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
      this.urlProjectWorkPropress + `get-work-propress/${projectId}`
    );
  }
  //#endregion

  //#region Timeline công việc
  getDepartment(): Observable<any> {
    return this.http.get<any>(this.urlProjectWorkTimeline + `get-department`);
  }

  getUserTeam(departmentId: number): Observable<any> {
    debugger;
    return this.http.get<any>(
      this.urlProjectWorkTimeline + `get-user-team?depID=${departmentId}`
    );
  }

  getDataWorkTimeline(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectWorkTimeline + `get-data`, {
      params: data,
    });
  }

  getDataWorkTimelineDetail(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectWorkTimeline + `get-data-detail`, {
      params: data,
    });
  }

  //#endregion

  //#region Khảo sát dự án
  getDataProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `get-project-survey`, {
      params: data,
    });
  }

  approvedUrgent(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `approved-urgent`, {
      params: data,
    });
  }

  approved(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `approved-request`, {
      params: data,
    });
  }

  getTbDetail(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `get-tb-detail`, {
      params: data,
    });
  }

  getDetail(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `get-detail`, {
      params: data,
    });
  }

  getFileDetail(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `get-files`, {
      params: data,
    });
  }

  viewFile(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `see-file`, {
      params: data,
    });
  }

  checkStatusDetail(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `check-status-detail`, {
      params: data,
    });
  }

  deletedProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(
      this.urlProjectSurvey + `deleted-project-survey`,
      { params: data }
    );
  }

  openFolder(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `open-folder`, {
      params: data,
    });
  }

  getDetailByid(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSurvey + `get-detail-byid`, {
      params: data,
    });
  }

  saveProjectSurvey(projectSurveyDTO: any): Observable<any> {
    return this.http.post<any>(
      this.urlProjectSurvey + `save-project-survey`,
      projectSurveyDTO
    );
  }

  saveProjectSurveyFiles(data: any): Observable<any> {
    return this.http.post<any>(
      this.urlProjectSurvey + `save-project-survey-files`,
      data
    );
  }

  saveProjectSurveyResult(data: any): Observable<any> {
    return this.http.post<any>(
      this.urlProjectSurvey + `save-project-survey-result`,
      data
    );
  }
  //#endregion

  //#region Hang mục công việc chậm tiến độ
  getProjectItemLate(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectItemLate + `get-data`, {
      params: data,
    });
  }
  //#endregion

  //#region Timeline hạng mục công việc
  getProjectWorkItemTimeline(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectWorkItemTimeline + `get-data`, {
      params: data,
    });
  }
  //#endregion

  //#region Lấy danh sách vật tư phát sinh
  getSynthesisOfGeneratedMaterials(data: any): Observable<any> {
    return this.http.get<any>(
      this.urlSynthesisOfGeneratedMaterials + `get-data`,
      {
        params: data,
      }
    );
  }

  // Lấy dữ liệu vật tư phát sinh với pagination
  getProjectPartlistProblem(params: {
    pageNumber: number;
    pageSize: number;
    dateStart: string;
    dateEnd: string;
    projectId: number;
    keyword?: string;
  }): Observable<any> {
    const httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber.toString())
      .set('pageSize', params.pageSize.toString())
      .set('dateStart', params.dateStart)
      .set('dateEnd', params.dateEnd)
      .set('projectId', params.projectId.toString())
      .set('keyword', params.keyword || '');

    return this.http.get<any>(
      this.urlSynthesisOfGeneratedMaterials + `get-data`,
      { params: httpParams }
    );
  }
  //#endregion

  //#region Tổng hợp dự án theo phòng ban
  getProjectSynthesisDepartment(data: any): Observable<any> {
    return this.http.get<any>(this.urlProjectSynthesisDepartment + `get-data`, {
      params: data,
    });
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
          this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất!');
          return;
        }
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = table.getColumns();

    // tạo danh sách header nhưng bỏ cột có formatter: rowSelection
    const visibleColumns = columns
      .map((col: any) => col.getDefinition())
      .filter((def: any) => def.formatter !== "rowSelection"); // bỏ cột checkbox

    const headers = visibleColumns.map((def: any) => def.title);

    // Thêm vào Excel
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
        const rowData = visibleColumns.map((col: any) => {
          const field = col.field; // dùng field từ visibleColumns
          let value = row[field];

          // Nếu là boolean, chuyển thành checkbox biểu tượng
          if (typeof value === 'boolean') {
            return value ? '☑' : '☐';
          }

          // Format ngày nếu là ISO string
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }

          return value;
        });

        worksheet.addRow(rowData);
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

  //cho leader kiểu dự án
  // Project Tree Folder API
  saveProjectTreeFolder(data: any): Observable<any> {
    return this.http.post<any>(this.urlProject + 'save-folder-project', data);
  }
  // lấy danh sách leader của loại dự án
  getEmployeeProjectType(projectTypeId: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `Project/getemployeeprojecttype/${projectTypeId}`);
  }
  // lưu leader dự án
  saveemployeeprojecttype(
    employeeProjectType: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `Project/saveemployeeprojecttype`, employeeProjectType
    );
  }
  // Chức năng người tham gia dự án theo departmentID
  // Chức năng người tham gia dự án theo departmentID
  getProjectEmployeefilter(departmentID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `Project/get-project-employee-filter/${departmentID}`
    );
  }
  //end
  //tổng hợp dự án
  getProjectSummary(
    dateTimeS: DateTime,
    dateTimeE: DateTime,
    departmentID: number,
    userID: number,
    projectTypeID: string,
    keyword: string,
    userTeamID: number,

  ): Observable<any> {
    const filter: any = {
      dateTimeS: dateTimeS?.toISO() || new Date().toISOString(),
      dateTimeE: dateTimeE?.toISO() || new Date().toISOString(),
      keyword: keyword.trim(),
      userID: userID.toString(),
      projectTypeID: projectTypeID.trim(),
      userTeamID: userTeamID.toString(),
      departmentID: departmentID.toString(),
    };

    return this.http.post(`${this.urlProjectSummary}get-projects`, filter);
  }
  getProjectSituation(projectId: number): Observable<any> {
    return this.http.get<any>(
      `${this.urlProjectSummary}get-project-current-situation/${projectId}`
    );
  }
  // Lưu tình hình hiện tại dự án
  saveProjectCurrentSituation(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.urlProjectSummary}save-project-current-situation`,
      payload
    );
  }
  // Lấy dữ liệu tình hình hiện tại dự án (API mới)
  getProjectCurrentSituationData(projectID: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}ProjectCurrentSituation/get-data?projectID=${projectID}`
    );
  }
  // Lưu tình hình hiện tại dự án (API mới)
  saveProjectCurrentSituationData(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}ProjectCurrentSituation/save-data`,
      payload
    );
  }
  //#region Lịch sử giá
  getSupplierSales(): Observable<any> {
    return this.http.get<any>(
      this.urlProjectPartlistPriceRequest + `get-supplier-sale`
    );
  }

  getPriceHistoryPartlist(data: any): Observable<any> {
    return this.http.get<any>(
      this.urlProjectPartlistPriceRequest + `get-price-history-partlist`,
      {
        params: data,
      }
    );
  }
  

  //#endregion
  //#region kiểu dự án
  getFolderByProjectType(projectTypeID: number): Observable<any> {
    return this.http.get<any>(
      this.urlProject + `getfoldersbyprojecttypes/${projectTypeID}`
    );
  }
  getAPIProjectTypes(): Observable<any> {
    return this.http.get<any>(this.urlProject + `get-project-types`);
  }
  saveProjectType(payload: any): Observable<any> {
    return this.http.post<any>(this.urlProject + `saveprojecttype`, payload);
  }
  getParentProjectTypes(): Observable<any> {
    //lấy kiểu dự án cha
    return this.http.get<any>(this.urlProject + `get-parent-project-types`);
  }
  getProjectTypeByID(projectTypeID: number): Observable<any> {
    //lấy kiểu dự án theo id
    return this.http.get<any>(
      this.urlProject + `get-project-types/${projectTypeID}`
    );
  }
  deleteProjectFolder(payload: any): Observable<any> {
    return this.http.post<any>(
      this.urlProject + `delete-project-folder`,
      payload
    );
  }
  //#end

    //#region Tổng hợp nhân công
    getProjectWorkerSynthetic(projectID:number, projectworkertypeID:number, keyword:string): Observable<any> {
      const filter: any = {
        projectID: projectID.toString(),
        projectworkertypeID: projectworkertypeID.toString(),
        keyword: keyword.trim(),
      };
      return this.http.post<any>(this.urlProjectSummary + `get-project-worker-synthetic`, filter);
    }
    getProjectCombobox(): Observable<any> {
      return this.http.get<any>(this.urlProjectSummary + `get-combobox-project`);
    }
    getProjectWorkerType(): Observable<any> {
      return this.http.get<any>(this.urlProjectSummary + `get-worker-type`);
    }
    //#endregion
    //#region Danh sách báo cáo công việc
    getProjectListWorkReport(projectId: number, keyword: string, page: number, size: number): Observable<any> {
      const filter: any = {
        projectId: projectId.toString()||0,
        keyword: keyword.trim() ||'',
        page: page.toString(),
        size: size.toString(),
      };
      return this.http.get<any>(this.urlProject + `get-project-work-reports`, { params: filter });
    }
    //#endregion

    //#region Leader project
    getLeaderProject(keyword: string): Observable<any> {
      return this.http.get<any>(this.urlProject + `get-project-leader/${keyword}`);
    }
    saveProjectLeader(payload: any): Observable<any> {
      return this.http.post<any>(this.urlProject + `save-data-project-leader`, payload);
    }
    //#endregion

    //#region Upload file
    uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('key', 'MeetingMinutes');  //192.268.1.190/duan/Projects
      if (subPath && subPath.trim()) {
        formData.append('subPath', subPath.trim());
      }
      return this.http.post<any>(this.apiUrl + `home/upload-multiple`, formData);
    }
    //#endregion
}
