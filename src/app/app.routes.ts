import { Routes } from '@angular/router';
import { SearchProductTechSerialComponent } from './pages/TB/Technical/search-product-tech-serial/search-product-tech-serial.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { TsAssetManagementPersonalComponent } from './pages/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetAllocationPersonalComponent } from './pages/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetRecoveryPersonalComponent } from './pages/ts-asset-recovery-personal/ts-asset-recovery-personal.component';
import { TsAssetUnitcountComponent } from './pages/ts-asset-unitcount/ts-asset-unitcount.component';
import { TsAssetTypeComponent } from './pages/ts-asset-type/ts-asset-type.component';
import { TsAssetStatusComponent } from './pages/ts-asset-status/ts-asset-status.component';
import { TsAssetSourceComponent } from './pages/ts-asset-source/ts-asset-source.component';
import { TsAssetManagementComponent } from './pages/ts-asset-management/ts-asset-management.component';
import { TsAssetAllocationComponent } from './pages/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetRecoveryComponent } from './pages/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from './pages/ts-asset-transfer/ts-asset-transfer.component';
import { TbProductRtcComponent } from './pages/tb-product-rtc/tb-product-rtc.component';
import { ProductComponent } from './pages/product/product.component';
import { BillImportTechnicalComponent } from './pages/bill-import-technical/bill-import-technical.component';
import { BillExportTechnicalComponent } from './pages/bill-export-technical/bill-export-technical.component';
import { InventoryDemoComponent } from './pages/inventory-demo/inventory-demo.component';
import { ProductReportNewComponent } from './pages/product-report-new/product-report-new.component';
import { ProductExportAndBorrowComponent } from './pages/TB/Technical/product-export-and-borrow/product-export-and-borrow.component';
import { ProjectItemComponent } from './pages/project/project-item/project-item.component';
import { FilmManagementComponent } from './pages/hr/Film/film-management/film-management.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectSurveyComponent } from './pages/project/project-survey/project-survey.component';
import { ProjectListWorkReportComponent } from './pages/project/project-list-work-report/project-list-work-report.component';
import { ProjectWorkCategoryComponent } from './pages/project/project-work-category/project-work-category.component';
import { ProjectWorkTimelineComponent } from './pages/project/project-work-timeline/project-work-timeline.component';
import { ProjectItemLateComponent } from './pages/project/project-item-late/project-item-late.component';
import { ProjectWorkItemTimelineComponent } from './pages/project/project-work-item-timeline/project-work-item-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from './pages/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProjectSynthesisDepartmentComponent } from './pages/project/project-synthesis-department/project-synthesis-department.component';
import { ProjectWorkPropressComponent } from './pages/project/project-work-propress/project-work-propress.component';
export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'Assetmanagemnetpersonal', component: TsAssetManagementPersonalComponent },
  { path: 'Assetallocationpersonal', component: TsAssetAllocationPersonalComponent },
  { path: 'AssetRecoveryPersonal', component: TsAssetRecoveryPersonalComponent },
  { path: 'AssetsUnit', component: TsAssetUnitcountComponent },
  { path: 'AssetsType', component: TsAssetTypeComponent },
  { path: 'AssetsStatus', component: TsAssetStatusComponent },
  { path: 'AssetSource', component: TsAssetSourceComponent },
  { path: 'AssetsManagemnet', component: TsAssetManagementComponent },
  { path: 'AssetsAllocation', component: TsAssetAllocationComponent },
  { path: 'AssetsRecovery', component: TsAssetRecoveryComponent },
  { path: 'AssetsTransfer', component: TsAssetTransferComponent },
  { path: 'TbProductRtc', component: TbProductRtcComponent },
  { path: 'Product', component: ProductComponent },
  { path: 'BillImportTechnical', component: BillImportTechnicalComponent },
  { path: 'BillExportTechnicalComponent', component: BillExportTechnicalComponent },
  { path: 'InventoryDemoComponent', component: InventoryDemoComponent },
  { path: 'ProductReportNewComponent', component: ProductReportNewComponent },
  { path: 'ProductExportAndBorrowComponent', component: ProductExportAndBorrowComponent },
  { path: 'SearchProductTechSerialComponent', component: SearchProductTechSerialComponent },
  { path: 'ProjectItem', component: ProjectItemComponent },
  { path: 'FilmManagement', component: FilmManagementComponent },
  { path: 'projectWorkTimeline', component: ProjectWorkTimelineComponent }, // TimeLine công việc
  { path: 'projectSurvey', component: ProjectSurveyComponent }, // Khảo sát dự án
  { path: 'projectItemlate', component: ProjectItemLateComponent }, // Hạng mục công việc chậm tiến độ
  {
    path: 'projectListWork/:id',
    component: ProjectListWorkReportComponent,
  },
  { path: 'project/:id', component: ProjectComponent },
  {
    path: 'projectListWork/:id',
    component: ProjectListWorkReportComponent,
  },
  { path: 'projectWorkCategory', component: ProjectWorkCategoryComponent }, // Hạng mục dự án
  {
    path: 'projectWorkPropress/:id',
    component: ProjectWorkPropressComponent,
  },
   {
        path: 'projectWorkItemTimeline',
        component: ProjectWorkItemTimelineComponent,
      }, // Hạng mục công việc chậm tiến độ
      {
        path: 'synthesisOfGeneratedMaterials',
        component: SynthesisOfGeneratedMaterialsComponent,
      }, // Tổng hợp vật tư phát sinh
      {
        path: 'projectSynthesisDepartment',
        component: ProjectSynthesisDepartmentComponent,
      },
];