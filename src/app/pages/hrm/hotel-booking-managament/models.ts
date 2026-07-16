export interface HotelBookingManagement {
    ID: number;
    STT?: number;
    EmployeeRequestID?: number | null;
    Reason?: string;
    ProjectID?: number | null;
    Location?: string;
    CheckinDate?: any;
    CheckOutDate?: any;
    EmployeeApproverID?: number | null;
    EmployeeBookerID?: number | null;
    DateRequest?: any;
    Note?: string;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;

    // Join fields
    RequesterName?: string;
    Code?: string;
    ProjectName?: string;
    BookerName?: string;
}

export interface HotelBookingProposal {
    ID: number;
    TypeRoom?: string;
    Quantity?: number;
    UnitPrice?: number;
    TotalAmount?: number;
    Note?: string;
    IsHCNSProposal?: boolean;
    ReasonHCNSProposal?: string;
    HotelBookingManagementID?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;
    
    // Approval
    IsApprove?: number; // 0: Chờ duyệt, 1: Duyệt, 2: Không duyệt
    ApproveID?: number | null;
    ReasonDecline?: string;
    ApproverName?: string;
}

export interface HotelBookingEmployee {
    ID: number;
    Type?: number; // 1: CBNV cty, 2: Khách/đối tác
    EmployeeID?: number | null;
    FullName?: string;
    HotelBookingManagementID?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;
}

export interface HotelBookingSaveDTO {
    ID: number;
    EmployeeRequestID?: number | null;
    Reason?: string;
    ProjectID?: number | null;
    Location?: string;
    CheckinDate?: any;
    CheckOutDate?: any;
    EmployeeApproverID?: number | null;
    Note?: string;
    EmployeeBookerID?: number | null;
    TravelerIDs?: number[];
    Employees: HotelBookingEmployee[];
    Proposals: HotelBookingProposal[];
}

export interface HotelBookingRequestParam {
    StartDate?: Date;
    EndDate?: Date;
    Keyword?: string;
    EmployeeID?: number;
    ProjectID?: number;
    EmployeeBookerID?: number;
    SelectedIDs?: number[];
}
