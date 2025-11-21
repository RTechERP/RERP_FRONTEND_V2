import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../tabulator-default.config';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectWorkerService } from '../project/project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectRequestServiceService } from './project-request-service/project-request-service.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectSolutionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-detail/project-solution-detail.component';
import { ProjectRequestDetailComponent } from '../project-request-detail/project-request-detail.component';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
@Component({
  selector: 'app-project-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    HasPermissionDirective,
  ],
  templateUrl: './project-request.component.html',
  styleUrl: './project-request.component.css'
})
export class ProjectRequestComponent implements OnInit, AfterViewInit {
  @Input() projectID: number = 0;
  sizeSearch: string = '22%';
  searchKeyword: string = '';
  
  dataProject: any[] = [];
  dataRequest: any[] = [];
  dataSolution: any[] = [];
  dataRequestFile: any[] = [];
  dataSolutionFile: any[] = [];
  
  selectedRequest: any = null;
  selectedSolution: any = null;

  @ViewChild('tb_request', { static: false }) tb_requestContainer!: ElementRef;
  @ViewChild('tb_solution', { static: false }) tb_solutionContainer!: ElementRef;
  @ViewChild('tb_requestFile', { static: false }) tb_requestFileContainer!: ElementRef;
  @ViewChild('tb_solutionFile', { static: false }) tb_solutionFileContainer!: ElementRef;

  tb_request: any;
  tb_solution: any;
  tb_requestFile: any;
  tb_solutionFile: any;

  projectRequestID: number = 0;
  projectSolutionID: number = 0;

  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private projectRequestService: ProjectRequestServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal,
    //private modalService: NgbModal,  
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit() {
    this.getProject();
    this.getProjectRequest();
    // Không gọi getProjectRequest và getSolution ở đây vì cần projectID
    // Sẽ được gọi khi user chọn project và click tìm kiếm
  }

  ngAfterViewInit() {
    this.drawTbRequest();
    this.drawTbSolution();
    this.drawTbRequestFile();
    this.drawTbSolutionFile();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectID = 0;
    this.searchKeyword = '';
    this.searchData();
  }

  onProjectChange() {
    if (this.projectID > 0) {
      this.searchData();
    } else {
      this.clearData();
    }
  }

  searchData() {
    if (this.projectID > 0) {
      this.getProjectRequest();
      // Không gọi getSolution ở đây vì giải pháp phụ thuộc vào request được chọn
      // getSolution sẽ được gọi khi user click vào một request
    } else {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án!');
    }
  }

  clearData() {
    this.dataRequest = [];
    this.dataSolution = [];
    this.dataRequestFile = [];
    this.dataSolutionFile = [];
    if (this.tb_request) this.tb_request.setData([]);
    if (this.tb_solution) this.tb_solution.setData([]);
    if (this.tb_requestFile) this.tb_requestFile.setData([]);
    if (this.tb_solutionFile) this.tb_solutionFile.setData([]);
  }

  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }

  getProjectRequest() {
    if (this.projectID <= 0) return;
    
    this.projectRequestService.getProjectRequest2(this.projectID, this.searchKeyword || '').subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let requestData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!requestData) {
            this.dataRequest = [];
          } else if (Array.isArray(requestData)) {
            // Nếu là array, sử dụng trực tiếp
            this.dataRequest = requestData;
          } else if (typeof requestData === 'object') {
            // Nếu là object, kiểm tra xem có chứa array bên trong không
            // Hoặc convert object thành array với 1 phần tử
            if (requestData.constructor === Object && Object.keys(requestData).length > 0) {
              // Nếu object có các key giống với structure của một record, wrap vào array
              this.dataRequest = [requestData];
            } else {
              this.dataRequest = [];
            }
          } else {
            this.dataRequest = [];
          }
          
          if (this.tb_request) {
            this.tb_request.setData(this.dataRequest);
          }
          this.projectRequestID = this.dataRequest[0].ID;
          this.getSolution(this.projectRequestID);
          this.getRequestFile(this.projectRequestID);
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu yêu cầu!');
          this.dataRequest = [];
          if (this.tb_request) {
            this.tb_request.setData([]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading project request:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu yêu cầu!');
        this.dataRequest = [];
        if (this.tb_request) {
          this.tb_request.setData([]);
        }
      },
    });
  }

  getSolution(projectRequestID?: number) {
    if (this.projectID <= 0) {
      // Nếu không có projectID, clear data
      this.dataSolution = [];
      if (this.tb_solution) {
        this.tb_solution.setData([]);
      }
      return;
    }
    
    // Nếu không có projectRequestID, không gọi API (giải pháp phụ thuộc vào request)
    if (!projectRequestID || projectRequestID <= 0) {
      this.dataSolution = [];
      if (this.tb_solution) {
        this.tb_solution.setData([]);
      }
      return;
    }
    
    this.projectRequestService.getProjectSolution(this.projectID, projectRequestID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let solutionData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!solutionData) {
            this.dataSolution = [];
          } else if (Array.isArray(solutionData)) {
            // Nếu là array, sử dụng trực tiếp
            this.dataSolution = solutionData;
          } else if (typeof solutionData === 'object') {
            // Nếu là object, kiểm tra xem có chứa array bên trong không
            // Hoặc convert object thành array với 1 phần tử
            if (solutionData.constructor === Object && Object.keys(solutionData).length > 0) {
              // Nếu object có các key giống với structure của một record, wrap vào array
              this.dataSolution = [solutionData];
            } else {
              this.dataSolution = [];
            }
          } else {
            this.dataSolution = [];
          }
          
          if (this.tb_solution) {
            this.tb_solution.setData(this.dataSolution);
          }
          this.projectSolutionID = this.dataSolution[0].ID;
          this.getSolutionFile(this.projectSolutionID);
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu giải pháp!');
          this.dataSolution = [];
          if (this.tb_solution) {
            this.tb_solution.setData([]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading project solution:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu giải pháp!');
        this.dataSolution = [];
        if (this.tb_solution) {
          this.tb_solution.setData([]);
        }
      },
    });
  }

  getRequestFile(projectRequestId: number) {
    if (!projectRequestId || projectRequestId <= 0) {
      this.dataRequestFile = [];
      if (this.tb_requestFile) {
        this.tb_requestFile.setData([]);
      }
      return;
    }

    this.projectRequestService.getRequestFile(projectRequestId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let fileData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!fileData) {
            this.dataRequestFile = [];
          } else if (Array.isArray(fileData)) {
            // Nếu là array, sử dụng trực tiếp
            this.dataRequestFile = fileData;
          } else if (typeof fileData === 'object') {
            // Nếu là object, wrap vào array
            if (fileData.constructor === Object && Object.keys(fileData).length > 0) {
              this.dataRequestFile = [fileData];
            } else {
              this.dataRequestFile = [];
            }
          } else {
            this.dataRequestFile = [];
          }
          
          if (this.tb_requestFile) {
            this.tb_requestFile.setData(this.dataRequestFile);
          }
        } else {
          this.dataRequestFile = [];
          if (this.tb_requestFile) {
            this.tb_requestFile.setData([]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading request file:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu file đính kèm yêu cầu!');
        this.dataRequestFile = [];
        if (this.tb_requestFile) {
          this.tb_requestFile.setData([]);
        }
      },
    });
  }

  getSolutionFile(projectSolutionId: number) {
    if (!projectSolutionId || projectSolutionId <= 0) {
      this.dataSolutionFile = [];
      if (this.tb_solutionFile) {
        this.tb_solutionFile.setData([]);
      }
      return;
    }

    this.projectRequestService.getSolutionFile(projectSolutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let fileData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!fileData) {
            this.dataSolutionFile = [];
          } else if (Array.isArray(fileData)) {
            // Nếu là array, sử dụng trực tiếp
            this.dataSolutionFile = fileData;
          } else if (typeof fileData === 'object') {
            // Nếu là object, wrap vào array
            if (fileData.constructor === Object && Object.keys(fileData).length > 0) {
              this.dataSolutionFile = [fileData];
            } else {
              this.dataSolutionFile = [];
            }
          } else {
            this.dataSolutionFile = [];
          }
          
          if (this.tb_solutionFile) {
            this.tb_solutionFile.setData(this.dataSolutionFile);
          }
        } else {
          this.dataSolutionFile = [];
          if (this.tb_solutionFile) {
            this.tb_solutionFile.setData([]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading solution file:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu file giải pháp!');
        this.dataSolutionFile = [];
        if (this.tb_solutionFile) {
          this.tb_solutionFile.setData([]);
        }
      },
    });
  }

  drawTbRequest() {
    if (!this.tb_requestContainer) return;
    
    this.tb_request = new Tabulator(this.tb_requestContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: false,
      layout: 'fitDataStretch',
      locale: 'vi',
      index: 'ID',
      rowHeader: false,
      paginationMode: 'local',
      selectableRows: 1,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          headerHozAlign: 'center',
        
          headerSort: false,
          visible: false,
        },
        {
          title: 'STT',
          field:'STT',
          headerHozAlign: 'center',
          
          headerSort: false,
          hozAlign: 'center',
        },
        {
          title: 'Ngày yêu cầu',
          field: 'DateRequest',
          headerHozAlign: 'center',
          
          hozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            return date.toLocaleDateString('vi-VN');
          },
        },
        {
          title: 'Mã yêu cầu',
          field: 'CodeRequest',
          headerHozAlign: 'center',
         
          hozAlign: 'left',
        },
        {
          title: 'Nội dung',
          field: 'ContentRequest',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
      ],
    });

    this.tb_request.on('rowClick', (e: any, row: any) => {
      const data = row.getData();
      this.selectedRequest = data;
      if (data.ID) {
        this.projectRequestID = data.ID;
        this.getRequestFile(data.ID);
        // Load giải pháp khi chọn yêu cầu
        this.getSolution(this.projectRequestID);
      }
    });
  }

  drawTbSolution() {
    if (!this.tb_solutionContainer) return;
    
    // Context menu cho bảng giải pháp
    const contextMenuSolution = [
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/action_approved_16.png" alt="Duyệt báo giá" class="me-1" /> Duyệt báo giá</span>',
        menu: [
          {
            label: '<span style="font-size: 0.75rem;">Duyệt</span>',
            action: (e: any, row: any) => {
              this.approveSolution(row, 1, true);
            },
          },
          {
            label: '<span style="font-size: 0.75rem;">Hủy duyệt</span>',
            action: (e: any, row: any) => {
              this.approveSolution(row, 1, false);
            },
          },
        ],
      },
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/action_approved_16.png" alt="Duyệt PO" class="me-1" /> Duyệt PO</span>',
        menu: [
          {
            label: '<span style="font-size: 0.75rem;">Duyệt</span>',
            action: (e: any, row: any) => {
              this.approveSolution(row, 2, true);
            },
          },
          {
            label: '<span style="font-size: 0.75rem;">Hủy duyệt</span>',
            action: (e: any, row: any) => {
              this.approveSolution(row, 2, false);
            },
          },
        ],
      },
    ];
    
    this.tb_solution = new Tabulator(this.tb_solutionContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: false,
      layout: 'fitDataStretch',
      locale: 'vi',
      index: 'ID',
      rowHeader: false,
      paginationMode: 'local',
      selectableRows: 1,
      rowContextMenu: contextMenuSolution,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          headerHozAlign: 'center',
        
          headerSort: false,
          visible: false,
        },
        {
          title: 'STT',
          field:'STT',
          headerHozAlign: 'center',
          hozAlign:'center',
          headerSort: false,
          frozen: true,
        },
        {
          title: 'PO',
          field: 'StatusSolution',
          headerHozAlign: 'center',
        
          hozAlign: 'center',
          formatter: (cell) => `<input type="checkbox" ${(cell.getValue() === 1 ? 'checked' : '')} onclick="return false;">`
        },
        {
          title: 'Duyệt báo giá',
          field: 'IsApprovedPrice',
          headerHozAlign: 'center',
          
          hozAlign: 'center',
          formatter: (cell) => `<input type="checkbox" ${(cell.getValue() === true ? 'checked' : '')} onclick="return false;">`
        },
        {
          title: 'Duyệt PO',
          field: 'IsApprovedPO',
          headerHozAlign: 'center',
        
          hozAlign: 'center',
          formatter: (cell) => `<input type="checkbox" ${(cell.getValue() === true ? 'checked' : '')} onclick="return false;">`
        },

        {
          title: 'Mô tả',
          field: 'Description',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày lên giải pháp',
          field: 'DateSolution',
          headerHozAlign: 'center',
     
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            return date.toLocaleDateString('vi-VN');
          },
        },
        {
          title: 'Deadline báo giá',
          field: 'PriceReportDeadline',
          headerHozAlign: 'center',
        
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            return date.toLocaleDateString('vi-VN');
          },
        },
        {
          title: 'Mã giải pháp',
          field: 'CodeSolution',
          headerHozAlign: 'center',
         
          hozAlign: 'left',
        },
        {
          title: 'Nội dung',
          field: 'ContentSolution',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
      ],
    });

    this.tb_solution.on('rowClick', (e: any, row: any) => {
      const data = row.getData();
      this.selectedSolution = data;
      if (data.ID) {
        // Load file đính kèm khi chọn giải pháp
        this.projectSolutionID = data.ID;
        this.getSolutionFile(this.projectSolutionID);
      }
    });
  }

  drawTbRequestFile() {
    if (!this.tb_requestFileContainer) return;
    
    this.tb_requestFile = new Tabulator(this.tb_requestFileContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: false,
      layout: 'fitDataStretch',
      locale: 'vi',
      index: 'ID',
      rowHeader: false,
      paginationMode: 'local',
      columns: [
        {
          title: 'Tên file',
          field: 'FileNameOrigin',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
      ],
    });
  }

  drawTbSolutionFile() {
    if (!this.tb_solutionFileContainer) return;
    
    this.tb_solutionFile = new Tabulator(this.tb_solutionFileContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: false,
      layout: 'fitDataStretch',
      locale: 'vi',
      index: 'ID',
      rowHeader: false,
      paginationMode: 'local',
      columns: [
        {
          title: 'Tên file',
          field: 'FileNameOrigin',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
      ],
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  addRequest() {
    if (this.projectID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectRequestDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    // Set các Input properties
    modalRef.componentInstance.projectId = this.projectID;
    modalRef.componentInstance.isEdit = false;
    modalRef.componentInstance.requestId = 0;
    modalRef.componentInstance.dataRequest = this.dataRequest;

    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          // Reload danh sách yêu cầu sau khi lưu thành công
          if (this.projectID > 0) {
            this.getProjectRequest();
          }
        }
      })
      .catch((error: any) => {
        console.log('Modal dismissed:', error);
      });
  }

  editRequest() {
    if (!this.selectedRequest) {
      this.notification.warning('Thông báo', 'Vui lòng chọn yêu cầu để sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectRequestDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    // Set các Input properties
    modalRef.componentInstance.projectId = this.projectID;
    modalRef.componentInstance.isEdit = true;
    modalRef.componentInstance.requestId = this.selectedRequest.ID;
    modalRef.componentInstance.requestData = this.selectedRequest;
    modalRef.componentInstance.dataRequest = this.dataRequest;

    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          // Reload danh sách yêu cầu sau khi lưu thành công
          if (this.projectID > 0) {
            this.getProjectRequest();
          }
        }
      })
      .catch((error: any) => {
        console.log('Modal dismissed:', error);
      });
  }

  deleteRequest() {
    const selectedRows = this.tb_request?.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất 1 yêu cầu để xóa!');
      return;
    }

    const selectedData = selectedRows.map((row: any) => row.getData());
    const requestCount = selectedData.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${requestCount} yêu cầu đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // Xóa từng yêu cầu bằng cách set IsDeleted = true
        let deleteCount = 0;
        let errorCount = 0;

        selectedData.forEach((request: any, index: number) => {
          // Tạo payload tương tự như save, nhưng set IsDeleted = true
          const payload: any = {
            ID: request.ID || 0,
            ProjectID: request.ProjectID || this.projectID,
            STT: request.STT || 1,
            DateRequest: request.DateRequest ? new Date(request.DateRequest).toISOString() : null,
            CodeRequest: request.CodeRequest || '',
            ContentRequest: request.ContentRequest || '',
            Note: request.Note || '',
            IsDeleted: true, // Set IsDeleted = true để xóa
            projectRequestFile: [], // Không cần xử lý file khi xóa
            deletedFileID: [], // Không cần xóa file khi xóa yêu cầu
          };

          this.projectRequestService.saveRequest(payload).subscribe({
            next: (response: any) => {
              deleteCount++;
              if (response.status === 1) {
                if (deleteCount === requestCount) {
                  // Tất cả đã xóa thành công
                  this.notification.success('Thành công', `Đã xóa ${deleteCount} yêu cầu thành công!`);
                  // Reload danh sách yêu cầu
                  this.getProjectRequest();
                  // Reset các bảng liên quan
                  this.projectRequestID = 0;
                  this.dataSolution = [];
                  this.dataRequestFile = [];
                  if (this.tb_solution) {
                    this.tb_solution.setData([]);
                  }
                  if (this.tb_requestFile) {
                    this.tb_requestFile.setData([]);
                  }
                }
              } else {
                errorCount++;
                if (deleteCount + errorCount === requestCount) {
                  this.notification.warning('Thông báo', `Đã xóa ${deleteCount} yêu cầu, ${errorCount} yêu cầu lỗi!`);
                  this.getProjectRequest();
                }
              }
            },
            error: (error: any) => {
              errorCount++;
              console.error('Error deleting request:', error);
              if (deleteCount + errorCount === requestCount) {
                this.notification.error('Lỗi', `Xóa thất bại! ${errorCount} yêu cầu không thể xóa.`);
                this.getProjectRequest();
              }
            }
          });
        });
      },
      nzCancelText: 'Hủy',
    });
  }

  addSolution(isEdit: boolean) {
    if (this.projectID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }
     //#region open modal giải pháp
    let selectedData: any = null;
    let selectedRequestID: number = 0;

    if (isEdit === true) {
      const data = this.tb_solution.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp');
        return;
      }
      selectedData = data[0];
        this.projectSolutionID = selectedData.ID;
    } else {
      this.projectSolutionID = 0;
      // Nếu là thêm mới, kiểm tra xem có dòng nào được chọn trong bảng yêu cầu không
      const selectedRequest = this.tb_request?.getSelectedData();
      if (selectedRequest && selectedRequest.length > 0) {
        selectedRequestID = selectedRequest[0].ID || 0;
      }
    }

    const modalRef = this.ngbModal.open(ProjectSolutionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    // Set các Input properties
    modalRef.componentInstance.projectId = this.projectID;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.solutionId = this.projectSolutionID;
    
    // Nếu là thêm mới và có yêu cầu được chọn, truyền projectRequestID
    if (!isEdit && selectedRequestID > 0) {
      modalRef.componentInstance.projectRequestID = selectedRequestID;
    }

    // Nếu là edit mode, truyền dữ liệu vào modal
    if (isEdit === true && selectedData) {
      modalRef.componentInstance.solutionData = selectedData;
    }

    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          this.getSolution(this.projectRequestID);
        }
      })
      .catch((error: any) => {
        console.error('Error opening project solution detail:', error);
      });
  }

  deleteSolution() {
    const selectedRows = this.tb_solution?.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất 1 giải pháp để xóa!');
      return;
    }

    const selectedData = selectedRows.map((row: any) => row.getData());
    const selectedIDs = selectedData.map((data: any) => data.ID);
    const deletedSolutionID = selectedIDs[0]; // Lưu ID của giải pháp bị xóa

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa giải pháp đã chọn không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const payload = {
          ID: deletedSolutionID,
          IsDeleted: true,
        };
        this.projectWorkerService.saveSolution(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Đã xóa giải pháp!');
              
              // Nếu giải pháp bị xóa là giải pháp đang được chọn, clear bảng file giải pháp
              if (this.projectSolutionID === deletedSolutionID) {
                this.projectSolutionID = 0;
                this.dataSolutionFile = [];
                if (this.tb_solutionFile) {
                  this.tb_solutionFile.setData([]);
                }
              }
              
              // Reload bảng giải pháp
              if (this.projectID > 0 && this.projectRequestID > 0) {
                this.getSolution(this.projectRequestID);
              } else {
                this.dataSolution = [];
                if (this.tb_solution) {
                  this.tb_solution.setData([]);
                }
              }
            } else {
              this.notification.error('Lỗi', response.message || 'Xóa không thành công!');
            }
          },
          error: (error) => {
            this.notification.error('Lỗi', 'Không thể xóa giải pháp!');
          },
        });
      },
      nzCancelText: 'Hủy',
    });
  }
  onClose() {
    this.activeModal.close();
  }

  //#region Duyệt báo giá / Duyệt PO
  approveSolution(row: any, approveStatus: number, isApproveAction: boolean) {
    const data = row.getData();
    const solutionId = data.ID;

    if (!solutionId || solutionId <= 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy giải pháp!');
      return;
    }

    // Validate: Nếu duyệt PO nhưng giải pháp không có PO
    if (isApproveAction && approveStatus === 2 && data.StatusSolution !== 1) {
      this.notification.warning('Thông báo', 'Bạn không thể duyệt PO cho giải pháp không có PO!');
      return;
    }

    // Validate: Kiểm tra trạng thái hiện tại
    if (approveStatus === 1) {
      // Duyệt báo giá
      if (isApproveAction && data.IsApprovedPrice === true) {
        this.notification.warning('Thông báo', 'Giải pháp này đã được duyệt báo giá trước đó.');
        return;
      }
      if (!isApproveAction && data.IsApprovedPrice === false) {
        this.notification.warning('Thông báo', 'Giải pháp này chưa được duyệt báo giá để hủy.');
        return;
      }
    } else if (approveStatus === 2) {
      // Duyệt PO
      if (isApproveAction && data.IsApprovedPO === true) {
        this.notification.warning('Thông báo', 'Giải pháp này đã được duyệt PO trước đó.');
        return;
      }
      if (!isApproveAction && data.IsApprovedPO === false) {
        this.notification.warning('Thông báo', 'Giải pháp này chưa được duyệt PO để hủy.');
        return;
      }
    }

    const actionText = isApproveAction ? 'duyệt' : 'hủy duyệt';
    const statusText = approveStatus === 1 ? 'báo giá' : 'PO';
    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} ${statusText} cho giải pháp này không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmMessage,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        const payload = {
          ID: solutionId,
          ApproveStatus: approveStatus, // 1: Báo giá, 2: PO
          IsApproveAction: isApproveAction, // true: Duyệt, false: Hủy duyệt
        };

        this.projectWorkerService.saveSolution(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${statusText} thành công!`);
              // Reload danh sách giải pháp
              if (this.projectRequestID > 0) {
                this.getSolution(this.projectRequestID);
              }
            } else {
              this.notification.error('Lỗi', response.message || `Không thể ${actionText} ${statusText}!`);
            }
          },
          error: (error: any) => {
            console.error('Error approving solution:', error);
            const errorMessage = error?.error?.message || error?.message || `Không thể ${actionText} ${statusText}!`;
            this.notification.error('Lỗi', errorMessage);
          },
        });
      },
    });
  }
  //#endregion
}
