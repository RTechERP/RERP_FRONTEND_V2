import { Component, OnInit, Type } from '@angular/core';
import { MenuService } from './menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FactoryVisitRegistrationComponent } from '../../general-category/visit-factory-registation/factory-visit-registration.component';
import { HrhiringRequestComponent } from '../../hrm/hrhiring-request/hrhiring-request.component';
import { VehicleRepairTypeComponent } from '../../hrm/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { VehicleRepairComponent } from '../../hrm/vehicle-repair/vehicle-repair.component';
import { TrainingRegistrationComponent } from '../../training-registration/training-registration.component';
import { ContractComponent } from '../contract/contract.component';
//import { CustomerComponent } from '../customer/customer.component';
import { DepartmentComponent } from '../department/department.component';
import { EmployeeComponent } from '../employee/employee.component';
import { EmployeeScheduleWorkComponent } from '../holiday/employee-schedule-work/employee-schedule-work.component';
import { PositionsComponent } from '../positions/positions.component';
import { ProjectItemLateComponent } from '../project/project-item-late/project-item-late.component';
import { ProjectSurveyComponent } from '../project/project-survey/project-survey.component';
import { ProjectWorkItemTimelineComponent } from '../project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProductSaleComponent } from '../Sale/ProductSale/product-sale.component';
import { TbProductRtcComponent } from '../tb-product-rtc/tb-product-rtc.component';
import { TeamComponent } from '../team/team.component';
import { TsAssetAllocationPersonalComponent } from '../ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetManagementPersonalTypeComponent } from '../ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetRecoveryPersonalComponent } from '../ts-asset-recovery-personal/ts-asset-recovery-personal.component';
import { HolidayComponent } from '../holiday/holiday.component';
import { FoodOrderComponent } from '../food-order/food-order.component';
import { DayOffComponent } from '../day-off/day-off.component';
import { EarlyLateComponent } from '../early-late/early-late.component';
import { OverTimeComponent } from '../over-time/over-time.component';
import { EmployeeBussinessComponent } from '../employee-bussiness/employee-bussiness.component';
import { NightShiftComponent } from '../night-shift/night-shift.component';
import { EmployeeAttendanceComponent } from '../employee-attendance/employee-attendance.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { VehicleCategoryComponent } from '../../hrm/vehicle-management/vehicle-category/vehicle-category.component';
import { VehicleManagementComponent } from '../../hrm/vehicle-management/vehicle-management.component';
<<<<<<< HEAD
import { CustomerComponent } from '../VisionBase/customer/customer.component';
=======
import { TsAssetManagementComponent } from '../ts-asset-management/ts-asset-management.component';
import { TsAssetAllocationComponent } from '../ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetRecoveryComponent } from '../ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from '../ts-asset-transfer/ts-asset-transfer.component';
import { HandoverComponent } from '../../hrm/handover/handover.component';
import { PermissionService } from '../../../services/permission.service';
>>>>>>> origin/master

@Component({
  selector: 'app-menus',
  imports: [],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css',
  standalone:true,
})
export class MenusComponent implements OnInit {
  //#region Khai báo biến
  menus: any[] = [];
  //#endregion

  constructor(
    private menuService: MenuService,
    private notifi: NzNotificationService,
    public permission: PermissionService
  ) {}

  ngOnInit(): void {
    // this.getMenus(43);
  }
  
}
