import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ProjectDashboardFilter {
  fromDate?: string | Date | null;
  toDate?: string | Date | null;
  departmentId?: number | null;
  employeeId?: number | null;
  keyword?: string | null;
  gateType?: number | null;
}

export interface ProjectDashboardItem {
  ID: number;
  ProjectCode: string;
  ProjectName: string;
  CustomerID: number;
  CustomerCode: string;
  CustomerName: string;
  EndUserName?: string;
  UserID?: number;
  FullNameSale?: string;
  UserTechnicalID?: number;
  FullNameTech?: string;
  ProjectManager?: number;
  FullNamePM?: string;
  DepartmentID?: number;
  DepartmentName?: string;
  ProjectTypeID?: number;
  ProjectTypeName?: string;
  CurrentGate: string; // G0, G1, G2 ... G13
  CurrentGateType?: number; // 1: Giải pháp, 2: Triển khai
  IsGateCompleted?: boolean;
  ProjectStatus: number; // 0: Chưa thực hiện, 1: Đang thực hiện, 2: Đã hoàn thành, 3: Test, 4: Chờ PO, 5: PO, 6: Hủy/dừng
  ProjectStatusName?: string;
  ProjectStatusText: string;
  StartDate?: string;
  ExpectedPlanDate?: string;
  RealityProjectEndDate?: string;
  CreatedDate: string;
  Progress: number; // 0 - 100
  Priority: number; // 1-5
  IsOverdue: boolean;
  RoleInProject?: string; // PM, Tech Leader, Member
}

export interface GateDistribution {
  gate: string;
  count: number;
}

export interface ProjectTypeDistribution {
  name: string;
  count: number;
}

export interface DepartmentDistribution {
  departmentName: string;
  total: number;
  inProgress: number;
  completed: number;
}

export interface ProjectDashboardSummary {
  totalProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  overdueProjects: number;
  gateDistributions: GateDistribution[];
  projectTypeDistributions: ProjectTypeDistribution[];
  departmentDistributions: DepartmentDistribution[];
  onTrackCount: number;
  delayedCount: number;
  projectList: ProjectDashboardItem[];
  overdueList: ProjectDashboardItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectControlDashboardMockService {

  private mockDepartments = [
    { ID: 1, Name: 'Phòng Thiết Kế Cơ Khí' },
    { ID: 2, Name: 'Phòng Tự Động Hóa & Điện' },
    { ID: 3, Name: 'Phòng Phần Mềm & AGV' },
    { ID: 4, Name: 'Phòng Quản Lý Dự Án (PMO)' },
    { ID: 5, Name: 'Phòng Nghiên Cứu & Phát Triển (R&D)' }
  ];

  private mockEmployees = [
    { ID: 101, FullName: 'Nguyen Van An', DepartmentID: 4 },
    { ID: 102, FullName: 'Tran Thi Binh', DepartmentID: 1 },
    { ID: 103, FullName: 'Le Hoang Cuong', DepartmentID: 2 },
    { ID: 104, FullName: 'Pham Duc Dung', DepartmentID: 3 },
    { ID: 105, FullName: 'Vu Thi Giang', DepartmentID: 1 },
    { ID: 106, FullName: 'Hoang Van Hung', DepartmentID: 5 },
    { ID: 107, FullName: 'Do Minh Khoa', DepartmentID: 4 },
    { ID: 108, FullName: 'Ngo Thanh Long', DepartmentID: 2 }
  ];

  private mockProjectTypes = [
    { ID: 1, Name: 'Dự án PM (Quản lý)' },
    { ID: 2, Name: 'Thiết kế Cơ khí' },
    { ID: 3, Name: 'Hệ thống Điện - Tự động hóa' },
    { ID: 4, Name: 'Phần mềm & Thuật toán AGV' },
    { ID: 5, Name: 'Dự án R&D Sản phẩm mới' }
  ];

  private mockProjects: ProjectDashboardItem[] = [
    {
      ID: 1,
      ProjectCode: 'PRJ-2026-001',
      ProjectName: 'Hệ thống AGV Vận Chuyển Pallet Nhà Máy VinFast',
      CustomerID: 10,
      CustomerCode: 'CUST-VIN',
      CustomerName: 'Tập đoàn VinFast',
      EndUserName: 'VinFast Hải Phòng',
      UserID: 201,
      FullNameSale: 'Nguyễn Văn Minh',
      UserTechnicalID: 103,
      FullNameTech: 'Lê Hoàng Cường',
      ProjectManager: 101,
      FullNamePM: 'Nguyễn Văn An',
      DepartmentID: 3,
      DepartmentName: 'Phòng Phần Mềm & AGV',
      ProjectTypeID: 4,
      ProjectTypeName: 'Phần mềm & Thuật toán AGV',
      CurrentGate: 'G4',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-01-10',
      ExpectedPlanDate: '2026-08-30',
      CreatedDate: '2026-01-05',
      Progress: 65,
      Priority: 5,
      IsOverdue: false,
      RoleInProject: 'Quản lý dự án (PM)'
    },
    {
      ID: 2,
      ProjectCode: 'PRJ-2026-002',
      ProjectName: 'Băng Tải Phân Loại Hàng Hóa Tự Động Viettel Post',
      CustomerID: 11,
      CustomerCode: 'CUST-VTP',
      CustomerName: 'Tổng Công Ty Viettel Post',
      EndUserName: 'Kho Hub Bắc Ninh',
      UserID: 202,
      FullNameSale: 'Phạm Thanh Sơn',
      UserTechnicalID: 102,
      FullNameTech: 'Trần Thị Bình',
      ProjectManager: 107,
      FullNamePM: 'Đỗ Minh Khoa',
      DepartmentID: 1,
      DepartmentName: 'Phòng Thiết Kế Cơ Khí',
      ProjectTypeID: 2,
      ProjectTypeName: 'Thiết kế Cơ khí',
      CurrentGate: 'G2',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-02-01',
      ExpectedPlanDate: '2026-07-15',
      CreatedDate: '2026-01-20',
      Progress: 35,
      Priority: 4,
      IsOverdue: true,
      RoleInProject: 'Trưởng nhóm Kỹ thuật'
    },
    {
      ID: 3,
      ProjectCode: 'PRJ-2026-003',
      ProjectName: 'Tủ Điện Trung Thế & Hệ Thống SCADA Samsung Thái Nguyên',
      CustomerID: 12,
      CustomerCode: 'CUST-SEC',
      CustomerName: 'Samsung Electronics Vietnam',
      EndUserName: 'SEVT Thái Nguyên',
      UserID: 201,
      FullNameSale: 'Nguyễn Văn Minh',
      UserTechnicalID: 103,
      FullNameTech: 'Lê Hoàng Cường',
      ProjectManager: 101,
      FullNamePM: 'Nguyễn Văn An',
      DepartmentID: 2,
      DepartmentName: 'Phòng Tự Động Hóa & Điện',
      ProjectTypeID: 3,
      ProjectTypeName: 'Hệ thống Điện - Tự động hóa',
      CurrentGate: 'G7',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-03-01',
      ExpectedPlanDate: '2026-09-15',
      CreatedDate: '2026-02-15',
      Progress: 80,
      Priority: 5,
      IsOverdue: false,
      RoleInProject: 'Thành viên tham gia'
    },
    {
      ID: 4,
      ProjectCode: 'PRJ-2026-004',
      ProjectName: 'Robot Gắp Sản Phẩm Đóng Thùng Foxconn Bắc Giang',
      CustomerID: 13,
      CustomerCode: 'CUST-FOX',
      CustomerName: 'Foxconn Vietnam',
      EndUserName: 'KCN Quang Châu',
      UserID: 203,
      FullNameSale: 'Trịnh Văn Hà',
      UserTechnicalID: 105,
      FullNameTech: 'Vũ Thị Giang',
      ProjectManager: 107,
      FullNamePM: 'Đỗ Minh Khoa',
      DepartmentID: 1,
      DepartmentName: 'Phòng Thiết Kế Cơ Khí',
      ProjectTypeID: 2,
      ProjectTypeName: 'Thiết kế Cơ khí',
      CurrentGate: 'G0',
      ProjectStatus: 0,
      ProjectStatusText: 'Chưa thực hiện',
      StartDate: '2026-05-01',
      ExpectedPlanDate: '2026-11-30',
      CreatedDate: '2026-04-10',
      Progress: 10,
      Priority: 3,
      IsOverdue: false,
      RoleInProject: 'Kỹ sư Thiết kế'
    },
    {
      ID: 5,
      ProjectCode: 'PRJ-2026-005',
      ProjectName: 'Hệ Thống Quản Lý Kho Thông Minh WMS Sunhouse',
      CustomerID: 14,
      CustomerCode: 'CUST-SUN',
      CustomerName: 'Tập Đoàn Sunhouse',
      EndUserName: 'Sunhouse Hà Nam',
      UserID: 202,
      FullNameSale: 'Phạm Thanh Sơn',
      UserTechnicalID: 104,
      FullNameTech: 'Phạm Đức Dũng',
      ProjectManager: 101,
      FullNamePM: 'Nguyễn Văn An',
      DepartmentID: 3,
      DepartmentName: 'Phòng Phần Mềm & AGV',
      ProjectTypeID: 4,
      ProjectTypeName: 'Phần mềm & Thuật toán AGV',
      CurrentGate: 'G10',
      ProjectStatus: 2,
      ProjectStatusText: 'Đã hoàn thành',
      StartDate: '2025-09-01',
      ExpectedPlanDate: '2026-03-31',
      CreatedDate: '2025-08-20',
      Progress: 100,
      Priority: 4,
      IsOverdue: false,
      RoleInProject: 'Phát triển Phần mềm'
    },
    {
      ID: 6,
      ProjectCode: 'PRJ-2026-006',
      ProjectName: 'Nghiên Cứu Chế Tạo Xe Tự Hành AMR Tải Trọng 2 Tấn',
      CustomerID: 15,
      CustomerCode: 'CUST-RTC',
      CustomerName: 'Nội bộ RTC Technology',
      EndUserName: 'R&D Center',
      UserID: 204,
      FullNameSale: 'Nội bộ',
      UserTechnicalID: 106,
      FullNameTech: 'Hoàng Văn Hùng',
      ProjectManager: 107,
      FullNamePM: 'Đỗ Minh Khoa',
      DepartmentID: 5,
      DepartmentName: 'Phòng Nghiên Cứu & Phát Triển (R&D)',
      ProjectTypeID: 5,
      ProjectTypeName: 'Dự án R&D Sản phẩm mới',
      CurrentGate: 'G3',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-01-15',
      ExpectedPlanDate: '2026-06-30',
      CreatedDate: '2026-01-01',
      Progress: 45,
      Priority: 5,
      IsOverdue: true,
      RoleInProject: 'R&D Leader'
    },
    {
      ID: 7,
      ProjectCode: 'PRJ-2026-007',
      ProjectName: 'Dây Chuyền Lắp Ráp Linh Kiện Ô Tô Honda Phúc Yên',
      CustomerID: 16,
      CustomerCode: 'CUST-HON',
      CustomerName: 'Honda Việt Nam',
      EndUserName: 'Nhà máy Honda 2',
      UserID: 201,
      FullNameSale: 'Nguyễn Văn Minh',
      UserTechnicalID: 108,
      FullNameTech: 'Ngô Thanh Long',
      ProjectManager: 101,
      FullNamePM: 'Nguyễn Văn An',
      DepartmentID: 2,
      DepartmentName: 'Phòng Tự Động Hóa & Điện',
      ProjectTypeID: 3,
      ProjectTypeName: 'Hệ thống Điện - Tự động hóa',
      CurrentGate: 'G5',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-02-15',
      ExpectedPlanDate: '2026-09-30',
      CreatedDate: '2026-02-01',
      Progress: 55,
      Priority: 4,
      IsOverdue: false,
      RoleInProject: 'Kỹ sư Điện'
    },
    {
      ID: 8,
      ProjectCode: 'PRJ-2026-008',
      ProjectName: 'Hệ Thống Kiểm Tra Ngoại Quan AI Vision Panasonic',
      CustomerID: 17,
      CustomerCode: 'CUST-PAN',
      CustomerName: 'Panasonic Industrial Devices',
      EndUserName: 'KCN Thăng Long',
      UserID: 202,
      FullNameSale: 'Phạm Thanh Sơn',
      UserTechnicalID: 104,
      FullNameTech: 'Phạm Đức Dũng',
      ProjectManager: 107,
      FullNamePM: 'Đỗ Minh Khoa',
      DepartmentID: 3,
      DepartmentName: 'Phòng Phần Mềm & AGV',
      ProjectTypeID: 4,
      ProjectTypeName: 'Phần mềm & Thuật toán AGV',
      CurrentGate: 'G1',
      ProjectStatus: 4,
      ProjectStatusText: 'Chờ PO',
      StartDate: '2026-04-01',
      ExpectedPlanDate: '2026-10-15',
      CreatedDate: '2026-03-25',
      Progress: 20,
      Priority: 3,
      IsOverdue: false,
      RoleInProject: 'Chuyên gia AI Vision'
    },
    {
      ID: 9,
      ProjectCode: 'PRJ-2026-009',
      ProjectName: 'Hệ Thống Ép Nhựa Tự Động LG Electronics Hải Phòng',
      CustomerID: 18,
      CustomerCode: 'CUST-LGE',
      CustomerName: 'LG Electronics Vietnam',
      EndUserName: 'LG Tràng Duệ',
      UserID: 201,
      FullNameSale: 'Nguyễn Văn Minh',
      UserTechnicalID: 102,
      FullNameTech: 'Trần Thị Bình',
      ProjectManager: 101,
      FullNamePM: 'Nguyễn Văn An',
      DepartmentID: 1,
      DepartmentName: 'Phòng Thiết Kế Cơ Khí',
      ProjectTypeID: 2,
      ProjectTypeName: 'Thiết kế Cơ khí',
      CurrentGate: 'G6',
      ProjectStatus: 1,
      ProjectStatusText: 'Đang thực hiện',
      StartDate: '2026-01-20',
      ExpectedPlanDate: '2026-07-20',
      CreatedDate: '2026-01-10',
      Progress: 70,
      Priority: 4,
      IsOverdue: true,
      RoleInProject: 'Kỹ sư Cơ khí'
    },
    {
      ID: 10,
      ProjectCode: 'PRJ-2026-010',
      ProjectName: 'Nâng Cấp Hệ Thống Đo Lường Tự Động Canon Bắc Ninh',
      CustomerID: 19,
      CustomerCode: 'CUST-CAN',
      CustomerName: 'Canon Việt Nam',
      EndUserName: 'Canon Quế Võ',
      UserID: 203,
      FullNameSale: 'Trịnh Văn Hà',
      UserTechnicalID: 108,
      FullNameTech: 'Ngô Thanh Long',
      ProjectManager: 107,
      FullNamePM: 'Đỗ Minh Khoa',
      DepartmentID: 2,
      DepartmentName: 'Phòng Tự Động Hóa & Điện',
      ProjectTypeID: 1,
      ProjectTypeName: 'Dự án PM (Quản lý)',
      CurrentGate: 'G12',
      ProjectStatus: 2,
      ProjectStatusText: 'Đã hoàn thành',
      StartDate: '2025-11-01',
      ExpectedPlanDate: '2026-05-15',
      CreatedDate: '2025-10-15',
      Progress: 100,
      Priority: 3,
      IsOverdue: false,
      RoleInProject: 'Quản lý dự án (PM)'
    }
  ];

  constructor() {}

  getDepartments(): Observable<any[]> {
    return of(this.mockDepartments).pipe(delay(100));
  }

  getEmployees(): Observable<any[]> {
    return of(this.mockEmployees).pipe(delay(100));
  }

  getProjectTypes(): Observable<any[]> {
    return of(this.mockProjectTypes).pipe(delay(100));
  }

  getDashboardData(filter: ProjectDashboardFilter): Observable<ProjectDashboardSummary> {
    let filtered = [...this.mockProjects];

    // Filter by keyword (Code, Name, Customer)
    if (filter.keyword && filter.keyword.trim() !== '') {
      const kw = filter.keyword.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.ProjectCode.toLowerCase().includes(kw) ||
        p.ProjectName.toLowerCase().includes(kw) ||
        p.CustomerName.toLowerCase().includes(kw) ||
        p.CustomerCode.toLowerCase().includes(kw)
      );
    }

    // Filter by department
    if (filter.departmentId !== null && filter.departmentId !== undefined) {
      filtered = filtered.filter(p => p.DepartmentID === filter.departmentId);
    }

    // Filter by employee
    if (filter.employeeId !== null && filter.employeeId !== undefined) {
      filtered = filtered.filter(p =>
        p.ProjectManager === filter.employeeId ||
        p.UserTechnicalID === filter.employeeId
      );
    }

    // Filter by date range
    if (filter.fromDate) {
      const from = new Date(filter.fromDate).getTime();
      filtered = filtered.filter(p => new Date(p.CreatedDate).getTime() >= from);
    }
    if (filter.toDate) {
      const to = new Date(filter.toDate).getTime();
      filtered = filtered.filter(p => new Date(p.CreatedDate).getTime() <= to);
    }

    // Calculate KPI Summary
    const totalProjects = filtered.length;
    const inProgressProjects = filtered.filter(p => p.ProjectStatus === 1 || p.ProjectStatus === 0).length;
    const completedProjects = filtered.filter(p => p.ProjectStatus === 2).length;
    const overdueProjects = filtered.filter(p => p.IsOverdue).length;

    // Gate distribution G0 -> G12 + Hoàn thành Gate
    const gates = Array.from({ length: 13 }, (_, i) => `G${i}`);
    const gateDistributions: GateDistribution[] = gates.map(g => ({
      gate: g,
      count: filtered.filter(p => p.CurrentGate === g && !p.IsGateCompleted).length
    }));
    gateDistributions.push({
      gate: 'Hoàn thành Gate',
      count: filtered.filter(p => p.IsGateCompleted).length
    });

    // ProjectType distribution
    const projectTypeDistributions: ProjectTypeDistribution[] = this.mockProjectTypes.map(pt => ({
      name: pt.Name,
      count: filtered.filter(p => p.ProjectTypeID === pt.ID).length
    }));

    // Department distribution
    const departmentDistributions: DepartmentDistribution[] = this.mockDepartments.map(d => {
      const deptProjects = filtered.filter(p => p.DepartmentID === d.ID);
      return {
        departmentName: d.Name,
        total: deptProjects.length,
        inProgress: deptProjects.filter(p => p.ProjectStatus === 1).length,
        completed: deptProjects.filter(p => p.ProjectStatus === 2).length
      };
    });

    const onTrackCount = filtered.filter(p => !p.IsOverdue).length;
    const delayedCount = overdueProjects;

    const overdueList = filtered.filter(p => p.IsOverdue);

    const summary: ProjectDashboardSummary = {
      totalProjects,
      inProgressProjects,
      completedProjects,
      overdueProjects,
      gateDistributions,
      projectTypeDistributions,
      departmentDistributions,
      onTrackCount,
      delayedCount,
      projectList: filtered,
      overdueList
    };

    return of(summary).pipe(delay(200));
  }
}
