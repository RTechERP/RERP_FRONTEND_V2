import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FormsModule } from '@angular/forms';
import { OrgChartService } from '../service/org-chart.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TYPE_MAP, NOTIFICATION_TITLE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { WorkplanService } from '../../../person/workplan/workplan.service';
import * as go from 'gojs';

declare var html2canvas: any;
declare var jspdf: any;
const EMPLOYEE_CHUCVUs = ["89", "90", "91", "92", "94", "95", "96", "97", "98"];
const TAGS_COLORS = ["#ffe0b2", "#fff9c4", "#b3e5fc", "#f8bbd0", "#6CBA41", "lime", "indigo", "purple", "green"];



@Component({
  selector: 'app-org-chart-rtc-new',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzSpinModule,
    NzTabsModule,
    FormsModule
  ],
  templateUrl: './org-chart-rtc-new.component.html',
  styleUrl: './org-chart-rtc-new.component.css'
})
export class OrgChartRtcNewComponent implements OnInit, AfterViewInit, OnDestroy {
  departments: any[] = [];
  selectedDepartmentId: number = 0;
  selectedTabIndex: number = 0;
  orgChartData: any[] = [];
  orgChartDetail: any[] = [];
  isLoading: boolean = false;
  selectedNodeKey: string = '';
  nodeOptions: { key: string; label: string }[] = [];

  private diagram: go.Diagram | null = null;

  constructor(
    private orgChartService: OrgChartService,
    private notification: NzNotificationService,
    private workplanService: WorkplanService
  ) { }

  /** Khởi tạo component — load danh sách phòng ban */
  ngOnInit(): void {
    this.loadDepartments();
  }

  /** Sau khi view render xong — khởi tạo GoJS Diagram */
  ngAfterViewInit(): void {
    this.initializeDiagram();
  }

  /** Hủy component — giải phóng tài nguyên GoJS */
  ngOnDestroy(): void {
    if (this.diagram) {
      this.diagram.div = null;
    }
  }

  /** Tải danh sách phòng ban từ API, sau đó tự động load sơ đồ tổ chức */
  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.departments = response.data || [];
          // Tự động load tab đầu tiên (tất cả phòng ban = 0)
          this.loadOrgChart();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  /** Xử lý khi click vào tab phòng ban — load lại sơ đồ theo phòng ban đã chọn */
  onDepartmentTabClick(departmentId: number): void {
    this.selectedDepartmentId = departmentId;
    this.loadOrgChart();
  }

  /** Xử lý khi đổi tab phòng ban — map index tab sang DepartmentID rồi load lại */
  onDepartmentTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Xóa tìm kiếm khi chuyển tab
    this.selectedNodeKey = '';
    // Map index tab sang DepartmentID tương ứng
    if (index === 0) {
      this.selectedDepartmentId = 0; // "Tất cả"
    } else if (index > 0 && this.departments.length >= index) {
      this.selectedDepartmentId = this.departments[index - 1].ID;
    }
    this.loadOrgChart();
  }

  /** Gọi API lấy dữ liệu sơ đồ tổ chức theo phòng ban đã chọn */
  loadOrgChart(): void {
    this.isLoading = true;
    this.orgChartService.getOrgChart(this.selectedDepartmentId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1) {
          this.orgChartData = response.data.dt || [];
          this.orgChartDetail = response.data.dtDetail || [];
          this.renderDiagram();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response?.message || 'Không có dữ liệu');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  /** Khởi tạo GoJS Diagram — cấu hình layout, node template, link template, group template */
  private initializeDiagram(): void {
    const $ = go.GraphObject.make;

    this.diagram = new go.Diagram("myDiagramDiv", {
      initialContentAlignment: go.Spot.Center,
      isReadOnly: true,
      layout: $(go.TreeLayout, {
        angle: 90,
        nodeSpacing: 20,
        layerSpacing: 50,
        layerStyle: go.TreeLayout.LayerUniform,
        treeStyle: go.TreeStyle.LastParents,
        alternateAngle: 90,
        alternateLayerSpacing: 35,
        alternateAlignment: go.TreeLayout.AlignmentBottomRightBus,
        alternateNodeSpacing: 20
      }),
    });

    // Cấu hình group template cho các nhóm nhân viên
    this.setupGroupTemplates($);

    // Cấu hình đường nối giữa các node
    this.diagram.linkTemplate = $(go.Link,
      {
        routing: go.Routing.Orthogonal,
        corner: 5,
        selectable: false
      },
      $(go.Shape, { strokeWidth: 1, stroke: "#aeaeae" })
    );

    // Cấu hình template cho từng node (ô chức danh/team)
    this.diagram.nodeTemplate = $(go.Node, "Auto",
      {
        minSize: new go.Size(180, 60),
      },
      $(go.Shape, "RoundedRectangle",
        {
          strokeWidth: 1,
          portId: "", fromLinkable: true, toLinkable: true
        },
        new go.Binding("fill", "color"),
        new go.Binding("stroke", "colorStroke"),
      ),
      $(go.Panel, "Table",
        {
          padding: 6,
          defaultAlignment: go.Spot.Center
        },
        // Dòng 1: Hiển thị tên chức danh/team (bold) — chỉ hiện khi có cả name
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2,
            font: "bold 12px 'Times New Roman'",
            stroke: "black",
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            margin: new go.Margin(0, 0, 3, 0),
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { font: "12px 'Times New Roman'", margin: 6 },
                new go.Binding("text", "position")
              )
            )
          },
          new go.Binding("visible", "name", (addr: string) => addr !== ""),
          new go.Binding("text", "", (d: any) => (d.position || "") + (d.totalCount > 0 ? ` (${d.totalCount})` : ""))
        ),
        // Dòng 1 (full height): Hiển thị chức danh khi KHÔNG có tên người — chiếm cả 2 row
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2, rowSpan: 2,
            font: "bold 12px 'Times New Roman'",
            stroke: "black",
            alignment: go.Spot.Center,
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { font: "12px 'Times New Roman'", margin: 6 },
                new go.Binding("text", "position")
              )
            )
          },
          new go.Binding("visible", "name", (addr: string) => addr === ""),
          new go.Binding("text", "", (d: any) => (d.position || "") + (d.totalCount > 0 ? ` (${d.totalCount})` : ""))
        ),
        // Dòng 2: Hiển thị tên người (italic) — chỉ hiện khi có chức danh
        $(go.TextBlock,
          {
            row: 1, column: 0, columnSpan: 2,
            font: "italic 12px 'Times New Roman'",
            stroke: "black",
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { font: "12px 'Times New Roman'", margin: 6 },
                new go.Binding("text", "name")
              )
            )
          },
          new go.Binding("visible", "position", (addr: string) => addr !== ""),
          new go.Binding("text", "name"),
        ),
        // Dòng 1 (full height): Hiển thị tên khi KHÔNG có chức danh — chiếm cả 2 row
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2, rowSpan: 2,
            font: "bold 12px 'Times New Roman'",
            stroke: "black",
            alignment: go.Spot.Center,
            width: 200,
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { font: "12px 'Times New Roman'", margin: 6 },
                new go.Binding("text", "name")
              )
            )
          },
          new go.Binding("visible", "position", (addr: string) => addr === ""),
          new go.Binding("text", "", (d: any) => (d.name || "") + (d.totalCount > 0 ? ` (${d.totalCount})` : ""))
        ),
      )
    );
  }

  /** Tạo các group template cho nhóm nhân viên (col1, col2, col4) — khung viền đỏ nét đứt */
  private setupGroupTemplates($: any): void {
    if (!this.diagram) return;

    const createGroupTemplate = (wrappingColumn: number) => {
      return $(go.Group, "Auto",
        {
          background: "transparent",
          margin: 2,
          isSubGraphExpanded: true,
          ungroupable: true,
          layout: $(go.GridLayout,
            {
              alignment: go.GridAlignment.Position,
              wrappingColumn: wrappingColumn
            },
          ),
        },
        $(go.Shape, "RoundedRectangle", {
          fill: "white",
          stroke: "red",
          strokeWidth: 1,
          strokeDashArray: [4, 2]
        }),
        $(go.Panel, "Vertical",
          { padding: 5 },
          $(go.TextBlock,
            {
              font: "bold 12px 'Times New Roman'",
              stroke: "red",
              margin: new go.Margin(0, 0, 5, 0),
              alignment: go.Spot.Center,
              textAlign: "center"
            },
            new go.Binding("text", "", (d) => d.name + (d.totalCount > 0 ? ` (${d.totalCount})` : ""))
          ),
          $(go.Placeholder, { padding: 1 })
        )
      );
    };

    this.diagram.groupTemplateMap.add("col4", createGroupTemplate(Infinity));
    this.diagram.groupTemplateMap.add("col2", createGroupTemplate(2));
    this.diagram.groupTemplateMap.add("col1", createGroupTemplate(1));
  }

  /**
   * Render sơ đồ tổ chức GoJS từ dữ liệu orgChartData + orgChartDetail.
   * - Tab master (departmentId=0): RTC → Phòng ban → Team (ẩn team Manager, hiện leader trên node phòng ban)
   * - Tab phòng ban: Phòng ban → Team → Nhân viên (hiện chi tiết nhân viên trong group)
   */
  private renderDiagram(): void {
    if (!this.diagram) return;

    const data = this.orgChartData;
    const dataDetail = this.orgChartDetail;
    const departmentId = this.selectedDepartmentId;

    const $ = go.GraphObject.make;

    // Cấu hình layout riêng cho tab master (rộng hơn) và tab phòng ban (gọn hơn)
    if (departmentId === 0) {
      this.diagram.layout = $(go.TreeLayout, {
        angle: 90,
        nodeSpacing: 20,
        layerSpacing: 50,
        layerStyle: go.TreeLayout.LayerUniform,
        treeStyle: go.TreeStyle.LastParents,
        alternateAngle: 90,
        alternateLayerSpacing: 35,
        alternateAlignment: go.TreeLayout.AlignmentBottomRightBus,
        alternateNodeSpacing: 20
      });
    } else {
      this.diagram.layout = $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 25,
        treeStyle: go.TreeStyle.LastParents,
        alternateAngle: 90,
        alternateNodeSpacing: 50,
      });
    }

    // Bước 1: Tính tổng số nhân viên đệ quy cho mỗi node từ dữ liệu gốc
    const childrenMapFull = new Map<any, any[]>();
    const localCountsFull = new Map<any, number>();

    data.forEach((item: any) => {
      // Chuẩn hóa ParentID: null/undefined → 0 (node gốc)
      if (item.ParentID === null || item.ParentID === undefined) item.ParentID = 0;

      localCountsFull.set(item.ID, item.EmployeeCount || 0);
      if (item.ParentID !== undefined) {
        if (!childrenMapFull.has(item.ParentID)) childrenMapFull.set(item.ParentID, []);
        childrenMapFull.get(item.ParentID)!.push(item.ID);
      }
    });

    // Hàm đệ quy: tính tổng nhân viên = bản thân + tất cả con cháu
    const totalCountsPre = new Map<any, number>();
    const calculateTotal = (id: any): number => {
      if (totalCountsPre.has(id)) return totalCountsPre.get(id)!;
      const children = childrenMapFull.get(id) || [];
      let total = localCountsFull.get(id) || 0;
      children.forEach(childId => {
        total += calculateTotal(childId);
      });
      totalCountsPre.set(id, total);
      return total;
    };

    // Tính tổng nhân viên toàn bộ công ty (tổng các node gốc)
    const getRootTotal = () => {
      let rootTotal = 0;
      data.forEach(item => {
        if (item.ParentID === 0) rootTotal += calculateTotal(item.ID);
      });
      return rootTotal;
    };

    // Bước 2: Xây dựng danh sách node và link cho diagram
    let assistantBgd = 0;
    let assistantTech = 0;
    const nodeDataArray: any[] = [];
    const linkDataArray: any[] = [];

    // Key gốc ảo cho node phòng ban — chỉ dùng khi xem tab phòng ban cụ thể
    const deptRootKey = departmentId !== 0 ? `dept-root-${departmentId}` : null;

    // Xây dựng map tên leader cho các team quản lý (Manager, Chief Accountant...)
    // Ở tab master: ẩn node team quản lý, hiện tên leader ngay trên node phòng ban
    const managerLeaderMap = new Map<number, string>();
    const managerTeamIds = new Set<number>();
    if (departmentId === 0) {
      // Danh sách tên team được coi là team quản lý (sẽ bị ẩn, leader hiện trên node phòng ban)
      const leaderTeamNames = ['Manager', 'Chief Accountant'];
      data.forEach((item: any) => {
        const teamName = (item.TeamName || item.Name || '').trim();
        if (item.ParentID === 0 && leaderTeamNames.includes(teamName)) {
          managerTeamIds.add(item.ID);
          // Tên leader không có trong dt (luôn rỗng) → tìm từ dtDetail theo OrganizationalChartID
          const leaderDetail = dataDetail.find((d: any) => d.OrganizationalChartID === item.ID);
          if (leaderDetail?.FullName?.trim()) {
            managerLeaderMap.set(item.DepartmentID, leaderDetail.FullName.trim());
          }
        }
      });
    }

    if (data.length > 0) {
      // Tạo node gốc ảo (tên phòng ban) khi xem tab phòng ban cụ thể
      if (deptRootKey) {
        const currentDept = this.departments.find((d: any) => d.ID === departmentId);
        const deptName = currentDept?.Name || '';
        nodeDataArray.push({
          key: deptRootKey,
          name: '',
          position: deptName,
          color: '#e4985dff',
          colorStroke: '#303030ff',
          totalCount: getRootTotal()
        });
      }

      data.forEach((item: any) => {
        if (item.DepartmentID === 1) assistantBgd = item.ID;
        if (item.TeamCode === "KYTHUAT" && item.Level === 1) assistantTech = item.ID;

        let position = "";
        let name = "";

        if (item.TeamName?.trim() && item.FullName?.trim()) {
          position = item.TeamName;
          name = item.FullName;
        } else {
          position = item.TeamName;
        }

        const totalForThisNode = calculateTotal(item.ID);
        const hasSubDepartments = (childrenMapFull.get(item.ID) || []).length > 0;
        const hasEmployees = dataDetail.some((x: any) => x.OrganizationalChartID === item.ID);
        const hasChildren = hasSubDepartments || hasEmployees;
        const displayCount = (hasChildren && (departmentId === 0 || item.Level === 0 || item.Level === 1 || item.Level === 2 || item.Level === 3 || item.Level === 4 || item.Level === 5)) ? totalForThisNode : 0;

        if (departmentId === 0) {
          // ── CHẾ ĐỘ TỔNG QUAN: RTC → Phòng ban → Team ──

          // Bỏ qua team quản lý (Manager...) — tên leader đã hiện trên node phòng ban
          if (managerTeamIds.has(item.ID)) return;

          if (item.ParentID === 0) {
            // Đảm bảo node gốc RTC đã được tạo
            if (!nodeDataArray.some((n: any) => n.key === 0)) {
              nodeDataArray.push({
                key: 0,
                name: "",
                parent: "RTC",
                position: "RTC",
                color: "#e4985dff",
                colorStroke: "#303030ff",
                totalCount: getRootTotal()
              });
            }

            // Tạo node trung gian phòng ban (nếu chưa tồn tại)
            const deptNodeKey = `dept-${item.DepartmentID}`;
            if (!nodeDataArray.some((n: any) => n.key === deptNodeKey)) {
              const deptInfo = this.departments.find((d: any) => d.ID === item.DepartmentID);
              const deptName = deptInfo?.Name || `Phòng ban ${item.DepartmentID}`;
              // Tổng nhân viên phòng ban = tổng các team gốc trong phòng ban
              const deptTotal = data
                .filter((x: any) => x.DepartmentID === item.DepartmentID && x.ParentID === 0)
                .reduce((sum: number, x: any) => sum + calculateTotal(x.ID), 0);

              // Lấy tên leader từ map (hiển thị in nghiêng dưới tên phòng ban)
              const managerLeader = managerLeaderMap.get(item.DepartmentID) || '';

              nodeDataArray.push({
                key: deptNodeKey,
                parent: 0,
                position: deptName,
                name: managerLeader,
                color: TAGS_COLORS[0] || "#fff",
                colorStroke: "black",
                totalCount: deptTotal
              });
              linkDataArray.push({ from: 0, to: deptNodeKey });
            }

            // Tạo node team và liên kết đến node phòng ban
            nodeDataArray.push({
              key: item.ID,
              parent: deptNodeKey,
              position: position,
              name: name,
              color: TAGS_COLORS[item.Level + 1] || "#fff",
              colorStroke: "black",
              totalCount: displayCount
            });
            linkDataArray.push({ from: deptNodeKey, to: item.ID });

          } else {
            if (item.DepartmentID === 22) return;
            if (item.Level >= 4) return;

            nodeDataArray.push({
              key: item.ID,
              parent: item.ParentID,
              position: position,
              name: name,
              color: TAGS_COLORS[item.Level + 1] || "#fff",
              colorStroke: "black",
              stt: item.STT,
              totalCount: displayCount
            });
            linkDataArray.push({ from: item.ParentID, to: item.ID });
          }
        } else {
          // ── CHẾ ĐỘ XEM THEO PHÒNG BAN ──
          if (item.DepartmentID === 22 && departmentId === 0) return;
          if (item.Level >= 4 && departmentId === 0) return;
          const parentKey = (item.ParentID === 0 && deptRootKey) ? deptRootKey : item.ParentID;
          nodeDataArray.push({
            key: item.ID,
            parent: parentKey,
            position: position,
            name: name,
            color: TAGS_COLORS[item.Level] || "#fff",
            colorStroke: "black",
            stt: item.STT,
            totalCount: displayCount
          });

          linkDataArray.push({
            from: parentKey,
            to: item.ID
          });
        }

        if (departmentId !== 0) {
          const child = dataDetail.filter((x: any) => x.OrganizationalChartID === item.ID);

          if (child.length > 0) {
            let tagGroup = child.length < 5 ? "col1" : "col2";
            if (departmentId === 1) tagGroup = "col4";

            const groupKey = `${item.TeamName}-${item.ID}`;
            nodeDataArray.push({
              key: groupKey,
              parent: item.ID,
              position: "",
              name: item.TeamName,
              category: tagGroup,
              isGroup: true,
              stt: item.STT,
              totalCount: child.length
            });

            linkDataArray.push({
              from: item.ID,
              to: groupKey
            });

            child.forEach((itemChild: any) => {
              let fullName = itemChild.FullName;
              let colorCard = "#e0e0e0";

              if (itemChild.EmployeeCode === "GM00") fullName += " - CEO";
              if (itemChild.EmployeeCode === "PD00") fullName += " - COO";
              if (itemChild.EmployeeCode === "BD00") fullName = "Đinh Việt Hoàng - CCO";
              if (itemChild.EmployeeCode === "CTO00") fullName += " - CTO";
              if (item.TeamCode === "Temporary") colorCard = "#FBE2D5";
              if (EMPLOYEE_CHUCVUs.includes(itemChild.EmployeeChucVuCode)) colorCard = "#ffb6fce6";

              nodeDataArray.push({
                key: `${itemChild.Name}-${itemChild.ID}-${itemChild.EmployeeID}`,
                group: groupKey,
                position: "",
                name: fullName,
                color: colorCard,
                colorStroke: "black",
                stt: item.STT
              });
            });
          }
        }
      });
    }

    // Thêm các node trợ lý đặc biệt (hardcode)
    if (departmentId === 2) {
      nodeDataArray.push({
        key: "Admin",
        parent: deptRootKey,
        position: "Admin of the Engineering Department",
        name: "Mai Thị Tú Oanh",
        color: "#c8e6c9",
        colorStroke: "black",
        totalCount: 0
      });
      linkDataArray.push({ from: deptRootKey, to: "Admin" });
    }

    if (departmentId === 0) {
      nodeDataArray.push({
        key: "Bob",
        parent: assistantBgd,
        position: "Assistant to the BOD",
        name: "",
        color: "#c8e6c9",
        colorStroke: "black",
        totalCount: 0
      });
      linkDataArray.push({ from: assistantBgd, to: "Bob" });
    }

    // Cập nhật model cho diagram
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: nodeDataArray,
      linkDataArray: linkDataArray
    });

    // Xây dựng danh sách option cho ô tìm kiếm
    this.nodeOptions = nodeDataArray
      .filter((node: any) => node.position !== 'RTC')
      .map((node: any) => {
        let optionText = node.name;
        if (node.name && node.position) {
          optionText = `${node.position} - ${node.name}`;
        } else {
          optionText = node.position || node.name;
        }
        if (node.isGroup) optionText += ' - Group';
        if (node.totalCount > 0) optionText += ` (${node.totalCount})`;

        return { key: String(node.key), label: optionText };
      });

    // Căn giữa diagram vào node đầu tiên sau khi layout xong
    this.diagram.addDiagramListener("InitialLayoutCompleted", () => {
      const firstNode = this.diagram?.nodes.first();
      if (firstNode && this.diagram) {
        this.diagram.centerRect(firstNode.actualBounds);
      }
    });
  }

  /** Tìm kiếm và highlight node trên diagram theo key */
  searchDiagram(nodeKey: string): void {
    if (!this.diagram) return;

    this.diagram.focus();
    this.diagram.startTransaction('highlight search');
    this.diagram.clearHighlighteds();

    if (nodeKey) {
      const safe = nodeKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');

      const results = this.diagram.findNodesByExample({ key: regex });
      this.diagram.highlightCollection(results);

      if (results.count > 0) {
        const firstNode = results.first();
        if (firstNode) {
          this.diagram.select(firstNode);
          this.diagram.centerRect(firstNode.actualBounds);
        }
      } else {
        this.diagram.clearSelection();
      }
    } else {
      this.diagram.clearHighlighteds();
      this.diagram.clearSelection();
    }

    this.diagram.commitTransaction('highlight search');
  }

  /** Xuất sơ đồ tổ chức ra file PDF chất lượng cao (scale 2x-4x tùy kích thước) */
  exportToPDF(): void {
    if (typeof jspdf === 'undefined') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thư viện xuất PDF (jsPDF) chưa được tải');
      return;
    }

    try {
      if (!this.diagram) return;

      const bounds = this.diagram.documentBounds;
      let width = bounds.width;
      let height = bounds.height;

      if (width <= 0 || height <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể tạo ảnh từ sơ đồ trống');
        return;
      }

      // Tăng scale để PDF hiển thị ảnh sắc nét khi Zoom
      // (Chụp ảnh gốc nét gấp 3-4 lần rồi chèn vào khung tài liệu bé đi 3-4 lần để có mật độ pixel siêu đặc)
      const maxDim = Math.max(width, height);
      let scale = 4;
      if (maxDim > 2000) scale = 3;
      if (maxDim > 4000) scale = 2; // Giới hạn scale nếu diagram quá to để tránh overload memory của trình duyệt
      if (maxDim > 8000) scale = 1.5;

      const imgData = this.diagram.makeImageData({
        scale: scale,
        background: "white",
        type: "image/png",
        maxSize: new go.Size(Infinity, Infinity) // Cho phép export ảnh lớn
      });

      if (!imgData) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể sinh mã vẽ đồ thị');
        return;
      }

      const padding = 20;
      const finalWidth = width + padding * 2;
      const finalHeight = height + padding * 2;

      const pdf = new jspdf.jsPDF({
        orientation: finalWidth > finalHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [finalWidth, finalHeight]
      });

      // Chèn ảnh vào PDF với size thật nhưng mật độ Pixel (do scale) là 4x
      pdf.addImage(imgData, "PNG", padding, padding, width, height, undefined, 'FAST');
      pdf.save("SoDoToChuc_RTC.pdf");

      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xuất PDF:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xuất file: ' + error.message);
    }
  }
}
