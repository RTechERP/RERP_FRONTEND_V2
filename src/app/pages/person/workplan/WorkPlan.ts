export interface WorkPlan {
    ID: number;
    UserID: number;
    WorkContent: string;
    StartDate: Date;
    EndDate: Date;
    TotalDay: number;
    STT: number | 0;
    Location: string;
    ProjectID: number;
    FullName: string | '';
    ProjectCode: string | '';
    ProjectName: string | '';
    RowNumber: number;
    Project: string | '';
}

// export enum WorkPlanFields {
//     ID = 'number',
//     UserID = 'number',
//     WorkContent = 'Nội dung công việc',
//     StartDate = 'Ngày bắt đầu',
//     EndDate = 'Ngày kết thức',
//     TotalDay = 'Tổng số ngày',
//     STT = 'STT',
//     Location = 'Nơi làm việc',
//     ProjectID = 'ProjectID',
//     FullName = 'Người phụ trách',
//     ProjectCode = 'Mã dự án',
//     ProjectName = 'Tên dự án',
//     RowNumber = 'STT',
//     Project = 'Dự án',
// }

export const WorkPlanFields = {
    ID: { name: 'ID', field: 'ID', type: 'number' },
    UserID: { name: 'UserID', field: 'UserID', type: 'number' },
    WorkContent: { name: 'Nội dung công việc', field: 'WorkContent', type: 'string' },
    StartDate: { name: 'Ngày bắt đầu', field: 'StartDate', type: 'date' },
    EndDate: { name: 'Ngày kết thúc', field: 'EndDate', type: 'date' },
    TotalDay: { name: 'Tổng số ngày', field: 'TotalDay', type: 'number' },
    STT: { name: 'STT', field: 'STT', type: 'number' },
    Location: { name: 'Nơi làm việc', field: 'Location', type: 'string' },
    ProjectID: { name: 'ProjectID', field: 'ProjectID', type: 'number' },
    FullName: { name: 'Người phụ trách', field: 'FullName', type: 'string' },
    ProjectCode: { name: 'Mã dự án', field: 'ProjectCode', type: 'string' },
    ProjectName: { name: 'Tên dự án', field: 'ProjectName', type: 'string' },
    RowNumber: { name: 'STT', field: 'RowNumber', type: 'number' },
    Project: { name: 'Dự án', field: 'Project', type: 'string' }
} as const;
