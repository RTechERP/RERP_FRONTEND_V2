import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { KpiSaleV2Service, KpiApiResponse, KpiTeam, KpiTeamUpsertRequest, KpiTeamMemberItem, isAutoCreatedTeamCode } from '../kpi-sale-v2.service';
import { EmployeeOption } from '../kpi-sale-v2.component';
import { TabServiceService } from '../../../../../layouts/tab-service.service';

interface KpiTeamRow {
  id: number;
  teamCode: string;
  teamName: string;
  description?: string;
  isActive: boolean;
  createdDate?: Date;
  employeeIDs: KpiTeamMemberItem[];
  leaderEmployeeId?: number | null;
  leaderEmployeeName?: string;
  isAutoCreated: boolean;
}

interface KpiTeamDraft {
  id: number | null;
  teamCode: string;
  teamName: string;
  description: string;
  employeeIDs: KpiTeamMemberItem[];
  leaderEmployeeId?: number | null;
}

@Component({
  selector: 'app-kpi-team-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCheckboxModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
  ],
  templateUrl: './kpi-team-tab.component.html',
  styleUrl: './kpi-team-tab.component.css',
})
export class KpiTeamTabComponent implements OnInit {
  @ViewChild('teamFormTemplate') teamFormTemplate!: TemplateRef<any>;

  isLoading = false;
  isApiMode = false;
  showInactive = false;
  searchText = '';

  teams: KpiTeamRow[] = [];
  employees: EmployeeOption[] = [];

  // Selected team state
  selectedTeamId: number | null = null;

  // Add member dropdown visibility
  showAddMember = false;
  selectedMemberIds: number[] = [];
  isAddingMembers = false;

  draft: KpiTeamDraft = this.getDefaultDraft();
  draftErrors: { teamCode?: string; teamName?: string; employeeIDs?: string } = {};
  teamModalRef?: NzModalRef;

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private modalService: NzModalService,
    private notification: NzNotificationService,
    private tabService: TabServiceService
  ) {}

  // Get selected team object
  get selectedTeam(): KpiTeamRow | undefined {
    return this.teams.find(t => t.id === this.selectedTeamId);
  }

  // Get members of selected team
  get selectedTeamMembers(): EmployeeOption[] {
    const team = this.selectedTeam;
    if (!team) return [];
    return team.employeeIDs
      .map(item => this.employees.find(e => e.id === item.employeeId))
      .filter((e): e is EmployeeOption => !!e);
  }

  // For draft leader dropdown: show only employees already selected as team members
  get selectedTeamMembersForDraft(): EmployeeOption[] {
    return this.draft.employeeIDs
      .map(item => this.employees.find(e => e.id === item.employeeId))
      .filter((e): e is EmployeeOption => !!e);
  }

  // Check if a team is selected
  isTeamSelected(teamId: number): boolean {
    return this.selectedTeamId === teamId;
  }

  // Select team and show members
  selectTeam(teamId: number): void {
    this.selectedTeamId = this.selectedTeamId === teamId ? null : teamId;
    this.showAddMember = false;
    this.selectedMemberIds = [];
  }

  // Get employees not yet in the selected team (for add dropdown)
  get availableEmployees(): EmployeeOption[] {
    const team = this.selectedTeam;
    if (!team) return [];
    const currentIds = team.employeeIDs.map(item => item.employeeId);
    return this.employees.filter(e => !currentIds.includes(e.id));
  }

  // Remove member from selected team
  async removeMember(employeeId: number): Promise<void> {
    const team = this.selectedTeam;
    if (!team) return;

    this.isLoading = true;
    try {
      const updatedEmployeeIds = team.employeeIDs.filter(item => item.employeeId !== employeeId);
      const newLeaderId = team.leaderEmployeeId === employeeId ? null : (team as any).leaderEmployeeId;
      const payload: KpiTeamUpsertRequest = {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        description: team.description,
        employeeIDs: updatedEmployeeIds,
        leaderEmployeeId: newLeaderId ?? undefined,
      };
      const response = await firstValueFrom(this.kpiSaleService.upsertTeam(payload));
      if (response?.status === 1) {
        // Update local data
        team.employeeIDs = updatedEmployeeIds;
        if (team.leaderEmployeeId === employeeId) {
          team.leaderEmployeeId = null;
          team.leaderEmployeeName = undefined;
        }
        this.teams = [...this.teams];
        this.notification.success('Thành công', 'Đã xóa thành viên khỏi team');
        this.tabService.notifyDataSaved('kpi-teams');
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa thành viên');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể xóa thành viên');
    } finally {
      this.isLoading = false;
    }
  }

  toggleAddMember(): void {
    this.showAddMember = !this.showAddMember;
    if (this.showAddMember) {
      this.selectedMemberIds = [];
    }
  }

  onAddMemberChange(memberIds: number[]): void {
    this.selectedMemberIds = memberIds || [];
  }

  // Add multiple members to selected team
  async saveAddMembers(): Promise<void> {
    const team = this.selectedTeam;
    if (!team) return;
    if (this.selectedMemberIds.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }

    this.isAddingMembers = true;
    try {
      const newMembers: KpiTeamMemberItem[] = this.selectedMemberIds.map(id => ({
        employeeId: id,
        isAdmin: false,
        isPM: false
      }));
      const updatedEmployeeIds = [...team.employeeIDs, ...newMembers];
      const payload: KpiTeamUpsertRequest = {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        description: team.description,
        employeeIDs: updatedEmployeeIds,
        leaderEmployeeId: (team as any).leaderEmployeeId ?? undefined,
      };
      const response = await firstValueFrom(this.kpiSaleService.upsertTeam(payload));
      if (response?.status === 1) {
        // Update local data
        team.employeeIDs = updatedEmployeeIds;
        this.teams = [...this.teams];
        this.selectedMemberIds = [];
        this.showAddMember = false;
        this.notification.success('Thành công', `Đã thêm ${newMembers.length} thành viên vào team`);
        this.tabService.notifyDataSaved('kpi-teams');
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể thêm thành viên');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể thêm thành viên');
    } finally {
      this.isAddingMembers = false;
    }
  }

  cancelAddMembers(): void {
    this.selectedMemberIds = [];
    this.showAddMember = false;
  }

  // ============== MEMBER ADMIN/PM TOGGLE ==============
  getMemberIsAdmin(employeeId: number): boolean {
    const team = this.selectedTeam;
    if (!team) return false;
    const member = team.employeeIDs.find(m => m.employeeId === employeeId);
    return member?.isAdmin ?? false;
  }

  getMemberIsPM(employeeId: number): boolean {
    const team = this.selectedTeam;
    if (!team) return false;
    const member = team.employeeIDs.find(m => m.employeeId === employeeId);
    return member?.isPM ?? false;
  }

  async toggleMemberAdmin(employeeId: number, isAdmin: boolean): Promise<void> {
    const team = this.selectedTeam;
    if (!team) return;

    // Nếu check Admin thì uncheck PM
    const member = team.employeeIDs.find(m => m.employeeId === employeeId);
    if (member && isAdmin) {
      member.isPM = false;
    }
    member!.isAdmin = isAdmin;

    await this.saveMemberChanges(team, member!);
  }

  async toggleMemberPM(employeeId: number, isPM: boolean): Promise<void> {
    const team = this.selectedTeam;
    if (!team) return;

    // Nếu check PM thì uncheck Admin
    const member = team.employeeIDs.find(m => m.employeeId === employeeId);
    if (member && isPM) {
      member.isAdmin = false;
    }
    member!.isPM = isPM;

    await this.saveMemberChanges(team, member!);
  }

  private async saveMemberChanges(team: KpiTeamRow, changedMember: KpiTeamMemberItem): Promise<void> {
    const payload: KpiTeamUpsertRequest = {
      id: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      description: team.description,
      employeeIDs: [...team.employeeIDs],
      leaderEmployeeId: team.leaderEmployeeId ?? undefined,
    };
    try {
      const response = await firstValueFrom(this.kpiSaleService.upsertTeam(payload));
      if (response?.status === 1) {
        this.teams = [...this.teams];
        this.notification.success('Thành công', 'Đã cập nhật vai trò thành viên');
        this.tabService.notifyDataSaved('kpi-teams');
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể cập nhật');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể cập nhật vai trò');
    }
  }

  ngOnInit(): void {
    void this.loadInitial();
  }

  // ============== LOAD ==============
  async loadInitial(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getEmployees()));
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.employees = response.data
          .map((item) => this.normalizeEmployee(item))
          .filter((e) => e.fullName);
        this.isApiMode = true;
      } else {
        this.employees = [];
      }
      await this.loadTeams();
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể nạp dữ liệu');
    } finally {
      this.isLoading = false;
    }
  }

  async loadTeams(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.safeApi<any[]>(this.kpiSaleService.getTeams(this.searchText.trim() || undefined))
      );
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.teams = response.data
          .map((item) => this.normalizeTeam(item))
          .filter((t) => this.showInactive || t.isActive);
        this.isApiMode = true;
      } else {
        this.teams = [];
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  onSearchChange(): void {
    void this.loadTeams();
  }

  toggleShowInactive(): void {
    void this.loadTeams();
  }

  // ============== CREATE / EDIT ==============
  openCreateForm(): void {
    this.draft = this.getDefaultDraft();
    this.draftErrors = {};
    this.openModal(false);
  }

  openEditForm(team: KpiTeamRow): void {
    this.draft = {
      id: team.id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      description: team.description || '',
      employeeIDs: team.employeeIDs ? [...team.employeeIDs] : [],
      leaderEmployeeId: team.leaderEmployeeId ?? null,
    };
    this.draftErrors = {};
    this.openModal(true);
  }

  openModal(isEdit: boolean): void {
    this.teamModalRef = this.modalService.create({
      nzTitle: isEdit ? 'Sửa team KPI' : 'Tạo team KPI mới',
      nzContent: this.teamFormTemplate,
      nzFooter: [
        { label: 'Hủy', onClick: () => this.teamModalRef?.destroy() },
        { label: 'Lưu', type: 'primary', onClick: () => this.saveTeam() },
      ],
      nzWidth: 600,
    });
  }

  validateDraft(): boolean {
    this.draftErrors = {};
    let ok = true;
    if (!this.draft.teamCode.trim()) {
      this.draftErrors.teamCode = 'Mã team không được để trống';
      ok = false;
    } else if (this.draft.teamCode.length > 50) {
      this.draftErrors.teamCode = 'Mã team tối đa 50 ký tự';
      ok = false;
    }
    if (!this.draft.teamName.trim()) {
      this.draftErrors.teamName = 'Tên team không được để trống';
      ok = false;
    } else if (this.draft.teamName.length > 200) {
      this.draftErrors.teamName = 'Tên team tối đa 200 ký tự';
      ok = false;
    }
    if (!this.draft.employeeIDs || this.draft.employeeIDs.length === 0) {
      this.draftErrors.employeeIDs = 'Vui lòng chọn ít nhất 1 thành viên';
      ok = false;
    } else if (this.draft.employeeIDs.length > 50) {
      this.draftErrors.employeeIDs = 'Tối đa 50 thành viên';
      ok = false;
    }
    return ok;
  }

  async saveTeam(): Promise<void> {
    if (!this.validateDraft()) {
      this.notification.warning('Cảnh báo', 'Vui lòng kiểm tra lại thông tin');
      return;
    }
    this.isLoading = true;
    try {
      const payload: KpiTeamUpsertRequest = {
        id: this.draft.id,
        teamCode: this.draft.teamCode.trim(),
        teamName: this.draft.teamName.trim(),
        description: this.draft.description.trim() || undefined,
        employeeIDs: [...this.draft.employeeIDs],
        leaderEmployeeId: this.draft.leaderEmployeeId ?? undefined,
      };
      const response = await firstValueFrom(this.kpiSaleService.upsertTeam(payload));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu team thành công');
        this.tabService.notifyDataSaved('kpi-teams');
        this.teamModalRef?.destroy();
        await this.loadTeams();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu team');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể lưu team');
    } finally {
      this.isLoading = false;
    }
  }

  // ============== DELETE ==============
  async deleteTeam(team: KpiTeamRow): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteTeam(team.id));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Đã ngưng sử dụng team');
        await this.loadTeams();
        if (this.selectedTeamId === team.id) {
          this.selectedTeamId = null;
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể ngưng team');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể ngưng team');
    } finally {
      this.isLoading = false;
    }
  }

  async hardDeleteTeam(team: KpiTeamRow): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteTeam(team.id, true));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Đã xóa team');
        await this.loadTeams();
        if (this.selectedTeamId === team.id) {
          this.selectedTeamId = null;
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa team');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể xóa team');
    } finally {
      this.isLoading = false;
    }
  }

  // ============== HELPERS ==============
  getEmployeeNames(ids: number[]): string {
    if (!ids || ids.length === 0) return '(trống)';
    const names = ids
      .map((id) => this.employees.find((e) => e.id === id))
      .filter((e) => !!e)
      .map((e) => `${e!.code} - ${e!.fullName}`);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }

  trackById(_idx: number, item: KpiTeamRow): number {
    return item.id;
  }

  trackByEmployeeId(_idx: number, item: EmployeeOption): number {
    return item.id;
  }

  private getDefaultDraft(): KpiTeamDraft {
    return {
      id: null,
      teamCode: '',
      teamName: '',
      description: '',
      employeeIDs: [],
      leaderEmployeeId: null,
    };
  }

  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private normalizeEmployee(item: any): EmployeeOption {
    return {
      id: this.read<number>(item, 'EmployeeID', 'UserID', 'ID', 'id') || 0,
      code: this.read<string>(item, 'Code', 'EmployeeCode', 'code') || '',
      fullName: this.read<string>(item, 'FullName', 'Name', 'fullName') || '',
      departmentName: this.read<string>(item, 'DepartmentName', 'departmentName') || '',
    };
  }

  private normalizeTeam(item: any): KpiTeamRow {
    const code = this.read<string>(item, 'TeamCode', 'teamCode') || '';
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      teamCode: code,
      teamName: this.read<string>(item, 'TeamName', 'teamName') || '',
      description: this.read<string>(item, 'Description', 'description'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
      createdDate: this.read<any>(item, 'CreatedDate', 'createdDate'),
      employeeIDs: this.normalizeTeamMembers(item.EmployeeIDs ?? item.employeeIDs),
      leaderEmployeeId: this.read<number | null>(item, 'LeaderEmployeeID', 'leaderEmployeeId'),
      leaderEmployeeName: this.read<string>(item, 'LeaderEmployeeName', 'leaderEmployeeName'),
      isAutoCreated: isAutoCreatedTeamCode(code),
    };
  }

  private normalizeTeamMembers(raw: any): KpiTeamMemberItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => {
      if (typeof item === 'number') {
        return { employeeId: item, isAdmin: false, isPM: false };
      }
      return {
        employeeId: item.EmployeeId ?? item.employeeId ?? item.EmployeeID ?? item.employeeId ?? 0,
        isAdmin: item.IsAdmin ?? item.isAdmin ?? false,
        isPM: item.IsPM ?? item.isPM ?? false,
      };
    });
  }

  private read<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }
}
