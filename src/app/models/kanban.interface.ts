export interface IAPIResponse<T> {
    status: number;
    message: string;
    data: T;
    error: string;
}

export interface IProject {
    ID: number;
    CustomerID?: number;
    ProjectCode?: string;
    ProjectName: string;
    ProjectShortName?: string;
    ProjectStatus?: number;
    UserID?: number;
    UserTechnicalID?: number;
    Note?: string;
    IsApproved?: boolean | null;
    ContactID?: number | null;
    PO?: string | null;
    ProjectType?: number | null;
    ListCostID?: string | null;
    PlanDateStart?: Date | null;
    PlanDateEnd?: Date | null;
    ActualDateStart?: Date | null;
    ActualDateEnd?: Date | null;
    EU?: string | null;
    ProjectManager?: number;
    CurrentState?: string | null;
    Priotity?: number;
    PODate?: Date | null;
    EndUser?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    BusinessFieldID?: number;
    TypeProject?: number;
    IsDeleted?: boolean;
}

export interface IProjectTask {
    ID: number;
    ProjectID?: number;
    UserID?: number;
    Mission?: string;
    Description?: string;
    EmployeeIDRequest?: number;
    AssignedToEmployeeID?: number; // ID nhân viên được giao việc
    ActualStartDate?: Date;
    ActualEndDate?: Date;
    PlanStartDate?: Date;
    PlanEndDate?: Date;
    Priority?: number;
    Status?: number;
    Code?: string;
    OrderIndex?: number;
    ParentID?: number;
    IsApproved?: number; // 0/null: chưa duyệt, 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối
    TaskComplexity?: number;
    IsAdditional?: boolean;
    TypeProjectItem?: number;
    ProjectTaskTypeID?: number;
    ProjectTaskResult?: string;
    PercentOverTime?: number;
    Deadline?: Date;
    DescriptionSolution?: string;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsPersonalProject?: boolean | null;
    Files?: number[]; // IDs of file attachments
    Links?: number[]; // IDs of link attachments
    CompletionRating?: number | null;
    // Client-side additions if needed
    tasks?: IProjectTask[];
    checklists?: IProjectTaskChecklist[];
    attachments?: IProjectTaskAttachment[];
    additionals?: IProjectTaskAdditional[];
}

export interface IProjectTaskAdditional {
    ID: number;
    ProjectTaskID?: number;
    Description?: string;
    CreatedDate?: Date;
    CreatedBy?: string;
    UpdatedDate?: Date;
    UpdatedBy?: string;
    IsDeleted?: boolean;
}

export interface IProjectTaskGroup {
    ID: number;
    ProjectID?: number;
    TaskGroupName?: string;
    OrderIndex?: number;
    Color?: string;
    // Client-side additions
    tasks?: IProjectTask[];
}

export interface IProjectTaskChecklist {
    ID: number;
    ProjectTaskID?: number;
    ChecklistTitle?: string;
    OrderIndex?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;
    IsDone?: boolean; // Recommended: add this to backend model for tracking completion
}

export interface IProjectTaskAttachment {
    ID: number;
    ProjectTaskID?: number;
    FileName?: string;
    FilePath?: string;
    FileSize?: number;
    Type?: number; // 1: File, 2: Link
    EmployeeUploadID?: number;
    UploadedDate?: Date;
    IsDeleted?: boolean;
}

export interface IProjectSubtask {
    ID: number;
    ParentTaskID: number;           // ID của task cha
    Title?: string;
    Description?: string;
    AssigneeID?: number;            // Người thực hiện
    AssigneeName?: string;          // Tên người thực hiện (để hiển thị)
    ApproverID?: number;            // Người phê duyệt
    ApproverName?: string;          // Tên người phê duyệt
    StartDate?: Date;
    DueDate?: Date;
    Status?: number;                // 0: Chưa làm, 1: Đang làm, 2: Hoàn thành
    OrderIndex?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    IsDeleted?: boolean;
}

export interface IProjectTaskEmailBand {
    ID: number;
    EmployeeID?: number;
    EmployeeEmail?: string;
    IsActive?: boolean;
    CreatedDate?: Date;
    CreatedBy?: string;
    UpdatedDate?: Date;
    UpdatedBy?: string;
    IsDeleted?: boolean;
}

export interface IProjectTaskSetting {
    ID: number;
    EmployeeID?: number;
    EmployeeEmail?: string;
    SendMailCreateProjectTask?: boolean;
    SendFinishProjectTask?: boolean;
    SendApproveProjectTask?: boolean;
    CreatedDate?: Date;
    CreatedBy?: string;
    UpdatedDate?: Date;
    UpdatedBy?: string;
    IsDeleted?: boolean;
}
