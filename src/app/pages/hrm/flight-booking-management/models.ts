export interface FlightBookingManagement {
    ID: number;
    EmployeeID?: number;
    Reason?: string;
    ProjectID?: number;
    DepartureAddress?: string;
    ArrivesAddress?: string;
    DepartureDate?: any;
    DepartureTime?: any;
    EmployeeBookerID?: number;
    BookedDate?: any;
    Note?: string;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;

    // Join fields
    EmployeeName?: string;
    EmployeeCode?: string;
    ProjectName?: string;
    BookerName?: string;
}

export interface FlightBookingProposal {
    ID: number;
    FlightBookingManagementID?: number;
    Airline?: string;
    Price?: number;
    Baggage?: string;
    IsApprove?: number;
    ApproveID?: number;
    ReasonDecline?: string;
    HCNSProposal?: boolean;
    CreatedBy?: string;
    CreatedDate?: Date;
    UpdatedBy?: string;
    UpdatedDate?: Date;
    IsDeleted?: boolean;
}

export interface FlightBookingSaveDTO {
    ID: number;
    Reason?: string;
    ProjectID?: number | null;
    DepartureAddress?: string;
    ArrivesAddress?: string;
    DepartureDate?: any;
    DepartureTime?: any;
    Note?: string;
    EmployeeBookerID?: number;
    TravelerIDs: number[];
    Proposals: FlightBookingProposal[];
}

export interface FlightBookingRequestParam {
    StartDate?: Date;
    EndDate?: Date;
    Keyword?: string;
    EmployeeID?: number;
    ProjectID?: number;
    SelectedIDs?: number[];
}
