import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'https://localhost:44365/api/Project/';

  constructor(private http: HttpClient) {}

  GlobalEmployeeId: number = 78;
  // Lấy danh sách thư mục dự án
  getFolders(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getfolders');
  }

  // Danh sách nhân viên khi thêm dự án
  getPms(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getpms');
  }

  // Danh sách khách hàng
  getCustomers(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getcustomers');
  }

  // Danh sách nhân viên khi thêm dự án lấy table 2 phụ trách sale/ phụ trách kỹ thuật/ leader
  getUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getusers');
  }

  // Danh sách loại dự án ProjectType
  getProjectTypes(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getprojecttypes');
  }

  // Danh sách loại dự án ProjectTypeLink
  getProjectTypeLinks(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojecttypelinks/${id}`);
  }

  // Load Hạng mục công việc
  getProjectItems(): string {
    return this.apiUrl + `getprojectitems`;
  }

  // Load lĩnh vực kinh doanh dự án
  getBusinessFields(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getbusinessfields`);
  }

  // Lấy trạng thái dụ án
  getProjectStatus(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectstatus`);
  }

  // modal lấy danh sách nhóm file
  getGroupFiles(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getgroupfiles`);
  }

  // modal lấy danh sách FirmBase
  getFirmBases(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getfirmbases`);
  }

  // modal lấy kiểu dự án Base
  getProjectTypeBases(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojecttypeBases`);
  }

  // modal lấy kiểu dự án Base
  getPriorityType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprioritytype`);
  }

  // modal lấy người dùng dự án
  getProjectUsers(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectusers/${id}`);
  }

  //modal lấy dữ liệu FollowProjectBase
  getFollowProjectBases(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getfollowprojectbases/${id}`);
  }

  //modal lấy dữ liệu projectprioritydetail
  getprojectprioritydetail(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectprioritydetail/${id}`);
  }

  //modal lấy dữ liệu projectprioritydetail
  checkProjectPriority(id: number, code: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `checkprojectpriority/${id}/${code}`
    );
  }

  // Danh sách dự án
  getAPIProjects(): string {
    return this.apiUrl + 'getprojects';
  }

  // Lấy chi tiết công việc
  getProjectDetails(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectdetails/${id}`);
  }

  // lấy chi tiết dự án
  getProject(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getproject/${id}`);
  }

  // lấy chi tiết dự án
  getProjectStatusById(projectId: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectstatuss/${projectId}`);
  }

  // lấy mã dự án
  getProjectCodeModal(
    projectId: number,
    shortName: string,
    projectType: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `getprojectcodemodal/${projectId}/${shortName}/${projectType}`
    );
  }

  // lấy leader
  getUserTeams(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getuserteams`);
  }

  // lấy dự án
  getProjectModal(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectmodal`);
  }

  // lấy ưu tiên dự án
  getProjectPriorityModal(id: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectprioritymodal/${id}`);
  }

  // lấy hiện trạng  dự án
  getProjectCurrentSituation(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getprojectcurrentsituation/${projectId}/${employeeId}`
    );
  }

  // lấy độ ưu tiên cá nhân
  getPersonalPriority(projectId: any, employeeId: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getpersonalpriority/${projectId}/${employeeId}`
    );
  }

  // Kiểm tra đã có mã dự án chưa
  checkProjectCode(projectId: number, projectCode: string): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `checkprojectcode/${projectId}/${projectCode}`
    );
  }

  // Kiểm tra đã có mã dự án chưa
  saveChangeProject(
    projectIdOld: number,
    projectIdNew: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `savechangeproject/${projectIdOld}/${projectIdNew}`
    );
  }

  // Lấy tổng hợp nhân công
  getProjectWorkReport(): string {
    return this.apiUrl + `getprojectworkreport`;
  }

  // Lấy tổng hợp danh sách báo cáo
  getProjectWorkerSynthetic(): string {
    return this.apiUrl + `getprojectworkersynthetic`;
  }

  // láy kiểu tổng hợp nhân công
  getWorkerType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getworkertype`);
  }

  // Xóa dự án
  deletedProject(ids: number[]): Observable<any> {
    const idArray = ids.join(',');
    return this.http.get<any>(this.apiUrl + `deletedproject/${idArray}`);
  }

  // Lưu dữ liệu dự án
  saveProject(prj: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + `saveproject`, prj);
  }

  // Chuyển dự án
  saveProjectWorkReport(projectWorkReport: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveprojectworkreport`,
      projectWorkReport
    );
  }

  saveProjectPersonalPriority(projectPersonalPriotity: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveProjectPersonalPriority`,
      projectPersonalPriotity
    );
  }

  // Lưu dữ liệu dự án
  saveProjectTypeLink(projectTypeLink: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveprojecttypelink`,
      projectTypeLink
    );
  }

  // Lưu dữ liệu dự án
  saveProjectStatuses(projectStatuses: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveprojectstatuses`,
      projectStatuses
    );
  }

  saveprojectpriority(projectPriority: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveprojectpriority`,
      projectPriority
    );
  }

  // Lưu dữ liệu trạng thái dự án
  saveProjectStatus(Stt: any, statusName: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `saveprojectstatus?Stt=${Stt}&statusName=${statusName}`,
      {}
    );
  }

  deletedProjectPriority(projectPriorityIds: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `deletedprojectpriority`,
      projectPriorityIds
    );
  }

  setDataTree(flatData: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Map từng item theo ID
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Bước 2: Gắn item vào parent hoặc top-level
    flatData.forEach((item) => {
      const current = map.get(item.ID);
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
  getProjectEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojectemployee`);
  }

  getStatusProjectEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getstatusprojectemployee`);
  }

  getProjectType(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getprojecttype`);
  }

  getEmployeeSuggest(projectId: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `getemployeesuggest/${projectId}`);
  }

  getEmployeeMain(projectId: number, isDeleted: number): Observable<any> {
    debugger;
    return this.http.get<any>(
      this.apiUrl + `getemployeemain/${projectId}/${isDeleted}`
    );
  }

  saveProjectEmployee(prjEmployees: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `save-project-employee`,
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
}
