import { Type } from '@angular/core';

// Import toàn bộ component dùng trong menu
import { HrhiringRequestComponent } from '../../hrm/hrhiring-request/hrhiring-request.component';
import { VehicleRepairTypeComponent } from '../../hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { VehicleRepairComponent } from '../../hrm/vehicle/vehicle-repair/vehicle-repair.component';
import { TrainingRegistrationComponent } from '../../training-registration/training-registration.component';
import { ContractComponent } from '../contract/contract.component';
import { CustomerComponent } from '../customer/customer.component';
import { DepartmentComponent } from '../department/department.component';
import { EmployeeComponent } from '../employee/employee.component';
import { VehicleManagementComponent } from '../../hrm/vehicle/vehicle-management/vehicle-management.component';
import { PositionsComponent } from '../../hrm/employee/posittion/positions.component';
import { ProjectItemLateComponent } from '../project/project-item-late/project-item-late.component';
import { ProjectSurveyComponent } from '../project/project-survey/project-survey.component';
import { ProjectWorkItemTimelineComponent } from '../project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProductSaleComponent } from '../Sale/ProductSale/product-sale.component';
import { TbProductRtcComponent } from '../tb-product-rtc/tb-product-rtc.component';
import { TeamComponent } from '../../hrm/employee/team/team.component';
import { TsAssetAllocationPersonalComponent } from '../ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetManagementPersonalTypeComponent } from '../ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { HolidayComponent } from '../holiday/holiday.component';
import { FoodOrderComponent } from '../food-order/food-order.component';
import { DayOffComponent } from '../day-off/day-off.component';
import { EarlyLateComponent } from '../early-late/early-late.component';
import { OverTimeComponent } from '../over-time/over-time.component';
import { EmployeeBussinessComponent } from '../employee-bussiness/employee-bussiness.component';
import { NightShiftComponent } from '../night-shift/night-shift.component';
import { EmployeeAttendanceComponent } from '../employee-attendance/employee-attendance.component';
import { FactoryVisitRegistrationComponent } from '../../general-category/visit-factory-registation/factory-visit-registration.component';
import { ProposeVehicleRepairComponent } from '../../hrm/vehicle/propose-vehicle-repair/propose-vehicle-repair.component';
import { VehicleRepairHistoryComponent } from '../../hrm/vehicle/vehicle-repair-history/vehicle-repair-history.component';
import { InventoryComponent } from '../Sale/Inventory/inventory.component';

export type BaseItem =
    {
        key: string;
        title: string;
        isOpen: boolean;
        icon?: string | null
    };

export type LeafItem = BaseItem & {
    kind: 'leaf';
    comp: Type<any>;
};

export type GroupItem = BaseItem & {
    kind: 'group';
    children: MenuItem[];
};

export type MenuItem = LeafItem | GroupItem;

export const menus: MenuItem[] = [
    //#region menu CRM
    {
        kind: 'group',
        key: 'crm',
        title: 'CRM',
        isOpen: true,
        icon: 'assets/icon/menu_crm_24.png',
        children: [
            {
                kind: 'group',
                key: 'CustomerComponent',
                title: 'Khách hàng',
                isOpen: true,
                    icon: 'assets/icon/menu_hrm_24.png',
                //   icon: 'assets/images/icons8-overview-20.png',
                children: [
                    {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                            icon: 'assets/icon/menu_hrm_24.png',
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                     {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        //   icon: 'assets/images/icons8-overview-20.png',
                        comp: CustomerComponent,
                    },
                    
                ],
            },
        ],
    },
    //#region menu KHO
    {
        kind: 'group',
        key: 'warehouse',
        title: 'KHO',
        isOpen: true,
        icon: 'assets/icon/menu_warehouse_24.png',
        children: [
            {
                kind: 'leaf',
                key: 'ProductSaleComponent',
                title: 'SẢN PHẨM KHO SALE',
                isOpen: true,
                comp: ProductSaleComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'TbProductRtcComponent',
                title: 'SẢN PHẨM KHO DEMO',
                isOpen: true,
                comp: TbProductRtcComponent /* không icon */,
            },
        ],
    },
    //#endregion

    //#region menu Nhân sự
    {
        kind: 'group',
        key: 'hrm',
        title: 'HRM',
        isOpen: true,
        icon: 'assets/icon/menu_hrm_24.png',
        children: [
            {
                kind: 'leaf',
                key: 'HrhiringRequestComponent',
                title: 'TUYỂN DỤNG',
                isOpen: true,
                comp: HrhiringRequestComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'TsAssetManagementPersonalComponent',
                title: 'Danh sách tài sản cá nhân',
                isOpen: true,
                comp: TsAssetManagementPersonalComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'InventoryComponent',
                title: 'InventoryComponent',
                isOpen: true,
                comp: InventoryComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'TsAssetManagementPersonalTypeComponent',
                title: 'Danh sách loại tài sản cá nhân',
                isOpen: true,
                comp: TsAssetManagementPersonalTypeComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'VehicleManagementComponent',
                title: 'Danh sách xe nội bộ',
                isOpen: true,
                comp: VehicleManagementComponent,
                icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'ProposeVehicleRepairComponent',
                title: 'Đề xuất sửa chữa xe nội bộ',
                isOpen: true,
                comp: ProposeVehicleRepairComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'VehicleRepairHistoryComponent',
                title: 'Theo dõi sửa chữa xe nội bộ',
                isOpen: true,
                comp: VehicleRepairHistoryComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'TsAssetAllocationPersonalComponent',
                title: 'Cấp phát tài sản cá nhân',
                isOpen: true,
                comp: TsAssetAllocationPersonalComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'TsAssetRecoveryPersonalComponent',
                title: 'Thu hồi tài sản cá nhân',
                isOpen: true,
                comp: TsAssetRecoveryPersonalNewComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'VehicleRepairComponent',
                title: 'Danh sách xe sửa chữa',
                isOpen: true,
                comp: VehicleRepairComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'VehicleRepairComponent',
                title: 'Danh sách loại sửa chữa',
                isOpen: true,
                comp: VehicleRepairTypeComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'DepartmentComponent',
                title: 'Phòng ban',
                isOpen: true,
                comp: DepartmentComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'TeamComponent',
                title: 'Team',
                isOpen: true,
                comp: TeamComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'PositionsComponent',
                title: 'Chức vụ',
                isOpen: true,
                comp: PositionsComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'EmployeeComponent',
                title: 'Nhân viên',
                isOpen: true,
                comp: EmployeeComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'ContractComponent',
                title: 'Hợp đồng',
                isOpen: true,
                comp: ContractComponent,
                //   icon: 'assets/icon/layers.png',
            },

            //   {
            //     kind: 'leaf',
            //     key: 'EmployeeScheduleWorkComponent',
            //     title: 'Quá trình công tác',
            //     isOpen: true,
            //     comp: EmployeeScheduleWorkComponent,
            //     //   icon: 'assets/icon/layers.png',
            //   },

            {
                kind: 'leaf',
                key: 'HolidayComponent',
                title: 'Ngày nghỉ',
                isOpen: true,
                comp: HolidayComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'FoodOrderComponent',
                title: 'Cơm ca',
                isOpen: true,
                comp: FoodOrderComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'DayOffComponent',
                title: 'Quản lý nghỉ',
                isOpen: true,
                comp: DayOffComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'EarlyLateComponent',
                title: 'Đi muộn - về sớm',
                isOpen: true,
                comp: EarlyLateComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'OverTimeComponent',
                title: 'Làm thêm',
                isOpen: true,
                comp: OverTimeComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'EmployeeBussinessComponent',
                title: 'Công tác',
                isOpen: true,
                comp: EmployeeBussinessComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'NightShiftComponent',
                title: 'Làm đêm',
                isOpen: true,
                comp: NightShiftComponent,
                //   icon: 'assets/icon/layers.png',
            },

            {
                kind: 'leaf',
                key: 'EmployeeAttendanceComponent',
                title: 'Vân tay',
                isOpen: true,
                comp: EmployeeAttendanceComponent,
                //   icon: 'assets/icon/layers.png',
            },


            {
                kind: 'leaf',
                key: 'VehicleManagementComponent',
                title: 'Danh sách xe',
                isOpen: true,
                comp: VehicleManagementComponent,
                //   icon: 'assets/icon/layers.png',
            },
        ],
    },
    //#endregion

    //#region menu DANH MỤC DUNG
    {
        kind: 'group',
        key: 'categories',
        title: 'DANH MỤC CHUNG',
        isOpen: true,
        icon: 'assets/icon/menu_categories_24.png',
        children: [
            {
                kind: 'leaf',
                key: 'TrainingRegistrationComponent',
                title: 'ĐÀO TẠO',
                isOpen: true,
                comp: TrainingRegistrationComponent,
                //   icon: 'assets/icon/layers.png',
            },
            {
                kind: 'leaf',
                key: 'FactoryVisitRegistrationComponent',
                title: 'THĂM NHÀ MÁY',
                isOpen: true,
                comp: FactoryVisitRegistrationComponent,
                //   icon: 'assets/icon/layers.png',
            },
        ],
    },

    //#endregion

    //#region menu dự án
    {
        kind: 'group',
        key: 'project',
        title: 'DỰ ÁN',
        isOpen: true,
        icon: 'assets/icon/menu_project_24.png',
        children: [
            {
                kind: 'leaf',
                key: 'ProjectComponent',
                title: 'Danh sách dự án',
                isOpen: true,
                comp: ProjectComponent,
            },
            {
                kind: 'leaf',
                key: 'ProjectWorkPropressComponent',
                title: 'Tiến độ công việc',
                isOpen: true,
                comp: ProjectWorkPropressComponent,
            },
            {
                kind: 'leaf',
                key: 'ProjectWorkTimelineComponent',
                title: 'Timeline công việc',
                isOpen: true,
                comp: ProjectWorkTimelineComponent,
            },
            {
                kind: 'leaf',
                key: 'ProjectSurveyComponent',
                title: 'Khảo sát dự án',
                isOpen: true,
                comp: ProjectSurveyComponent,
            },
            {
                kind: 'leaf',
                key: 'ProjectItemLateComponent',
                title: 'Hạng mục công việc chậm tiến độ',
                isOpen: true,
                comp: ProjectItemLateComponent,
            },
            {
                kind: 'leaf',
                key: 'ProjectWorkItemTimelineComponent',
                title: 'Timeline hạng mục công việc',
                isOpen: true,
                comp: ProjectWorkItemTimelineComponent,
            },
            {
                kind: 'leaf',
                key: 'SynthesisOfGeneratedMaterialsComponent',
                title: 'Báo cáo vật tư phát sinh',
                isOpen: true,
                comp: SynthesisOfGeneratedMaterialsComponent,
            },
        ],
    },
    //#endregion
];