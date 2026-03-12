import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorTableSingleComponent } from '../../_shared/tabulator-table/tabulator-tables.component';
import { Areas } from '../../../models/areas';
import { AreasService } from '../../../services/managers/areas.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faPenToSquare,
  faCopy,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { ColumnDefinition } from 'tabulator-tables';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefreshableDirective } from '../../../directives/refreshData.directive';
import { FormsModule } from '@angular/forms';
import { ToastHelper } from '../../../services/toastHelper.service';
import { NgxSelectModule } from 'ngx-select-ex';
import { TreeNode } from '../../../services/base.service';
// import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'areas',
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.css'],
  imports: [
    CommonModule,
    TabulatorTableSingleComponent,
    FontAwesomeModule,
    RefreshableDirective,
    NgxSelectModule,
    FormsModule,
    // Menubar
  ],
})
export class AreasComponent implements OnInit {
  //#region Properties
  menuBars: any[] = [];
  areas: TreeNode[] = [];
  areasParent: Areas[] = [];
  columnNames: ColumnDefinition[] = [
    { title: 'Mã', field: 'AreaCode', width: 200 },
    { title: 'Tên', field: 'AreaName', widthGrow: 1 },
  ];
  faPlus = faPlus;
  faPenToSquare = faPenToSquare;
  faCopy = faCopy;
  faTrash = faTrash;
  areaFormValue: Areas = new Areas();
  @ViewChild('tblComp', { static: false })
  tblComp!: TabulatorTableSingleComponent;
  @ViewChild('btnDelete', { static: false })
  btnDelete!: ElementRef<HTMLButtonElement>;
  //#endregion

  //#region Constructor
  constructor(
    private areasService: AreasService,
    private modalService: NgbModal,
    private toastHelper: ToastHelper
  ) { }
  //#endregion

  //#region Life cycle
  ngOnInit() {
    this.loadAreas();
  }
  //#endregion
  loadAreas() {
    this.areasService.getAll().subscribe({
      next: (data) => {
        this.areas = this.buildTree(data);
      },
      error: (err) => {
        console.error('Failed to load data', err);
      },
    });
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        visible: true,
        command: () => {
          // this.openModal(content, false);
        }
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        visible: true,
        command: () => {
          // this.openModal(content, true);
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: true,
        command: () => {
          this.onDelete();
        }
      },
    ];
  }

  openModal(content: TemplateRef<any>, isEditing = false) {
    const selected = this.tblComp.getSelectedRow() as Areas;
    if (isEditing && !selected) return;
    this.areaFormValue = isEditing ? new Areas(selected) : new Areas();
    this.areasService.getAll().subscribe({
      next: (data) => {
        this.areasParent = data.filter((d) => !selected || d.Id != selected.Id);
      },
      error: (err) => {
        console.error('Failed to load data', err);
      },
      complete: () => {
        this.modalService.open(content, {
          centered: true,
          modalDialogClass: 'w-50',
        });
      },
    });
  }
  onRefresh() {
    this.loadAreas();
    console.log('data reloaded');
  }
  save(modal: NgbActiveModal) {
    this.areasService.createOrUpdate(this.areaFormValue).subscribe({
      error: (err) => {
        console.error('Failed to call API:', err);
      },
      complete: () => {
        this.loadAreas();
      },
    });
    modal.close();
  }
  onDelete() {
    const selected = this.tblComp.getSelectedRow() as Areas;
    if (!selected) return;
    this.btnDelete.nativeElement.classList.add('disabled');

    this.toastHelper.showToast(
      'error',
      'Xác nhận xóa?',
      '✔',
      () => {
        this.areasService.deleteById(selected.Id).subscribe({
          complete: () => {
            this.loadAreas();
            this.btnDelete.nativeElement.classList.remove('disabled');
          },
        });
      },
      '✖',
      () => {
        this.btnDelete.nativeElement.classList.remove('disabled');
      }
    );
  }

  //#region Utilities (reformat and build tree data)
  private buildTree(data: TreeNode[]) {
    const map: { [key: number]: TreeNode } = {};
    const roots: TreeNode[] = [];

    data.forEach((item) => {
      map[item.Id] = { ...item, children: [] };
    });

    data.forEach((item) => {
      if (item.ParentId && map[item.ParentId]) {
        map[item.ParentId].children!.push(map[item.Id]);
      } else {
        roots.push(map[item.Id]);
      }
    });

    return roots;
  }
  //#endregion
}
