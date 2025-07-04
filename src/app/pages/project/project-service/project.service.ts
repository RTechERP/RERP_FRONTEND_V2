import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'https://localhost:44365/api/';

  constructor(private http: HttpClient) {}

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

  setDataTree(flatData: any[],valueField:string): any[] {
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
      this.apiUrl + `Project/getprojectemployee/${status}`
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
    return this.http.get<any>(this.apiUrl + `ProjectWorkTimeline/get-data-detail`, {
      params: data,
    });
  }

  //#endregion

  //#region Khảo sát dự án
  getDataProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/get-project-survey`, {
      params: data,
    });
  }

  approvedUrgent(data: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ProjectSurvey/approved-urgent`, {
      params: data,
    });
  }

  approved(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/approved-request`,
     { params: data}
    );
  }

  getTbDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/get-tb-detail`,
     { params: data}
    );
  }

  getDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/get-detail`,
     { params: data}
    );
  }

  getFileDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/get-files`,
     { params: data}
    );
  }

  viewFile(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/see-file`,
     { params: data}
    );
  }

  checkStatusDetail(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/check-status-detail`,
     { params: data}
    );
  }

  deletedProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/deleted-project-survey`,
     { params: data}
    );
  }

  openFolder(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/open-folder`,
     { params: data}
    );
  }

  getDetailByid(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProjectSurvey/get-detail-byid`,
     { params: data}
    );
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
}
