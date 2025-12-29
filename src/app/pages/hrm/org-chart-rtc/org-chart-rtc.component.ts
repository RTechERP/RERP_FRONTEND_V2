import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FormsModule } from '@angular/forms';
import { OrgChartService } from './service/org-chart.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { WorkplanService } from '../../person/workplan/workplan.service';
import * as go from 'gojs';

declare var html2canvas: any;
declare var jspdf: any;

const EMPLOYEE_CHUCVUs = ["89", "90", "91", "92", "94", "95", "96", "97", "98"];
const TAGS_COLORS = ["#ffe0b2", "#fff9c4", "#b3e5fc", "#f8bbd0", "#6CBA41", "lime", "indigo", "purple", "green"];

@Component({
  selector: 'app-org-chart-rtc',
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
  templateUrl: './org-chart-rtc.component.html',
  styleUrls: ['./org-chart-rtc.component.css']
})
export class OrgChartRtcComponent implements OnInit, AfterViewInit, OnDestroy {
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
    private workplanService:WorkplanService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    this.initializeDiagram();
  }

  ngOnDestroy(): void {
    if (this.diagram) {
      this.diagram.div = null;
    }
  }

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.departments = response.data || [];
          // Auto load first tab (all departments = 0)
          this.loadOrgChart();
        }
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  onDepartmentTabClick(departmentId: number): void {
    this.selectedDepartmentId = departmentId;
    this.loadOrgChart();
  }

  onDepartmentTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Clear search when changing tab
    this.selectedNodeKey = '';
    // Map tab index to department ID
    if (index === 0) {
      this.selectedDepartmentId = 0; // "Tất cả"
    } else if (index > 0 && this.departments.length >= index) {
      this.selectedDepartmentId = this.departments[index - 1].ID;
    }
    this.loadOrgChart();
  }

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
      error: (error: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải sơ đồ tổ chức: ' + error.message);
      }
    });
  }

  private initializeDiagram(): void {
    const $ = go.GraphObject.make;

    this.diagram = new go.Diagram("myDiagramDiv", {
      initialContentAlignment: go.Spot.Center,
      isReadOnly: true,
      layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 25,
        treeStyle: go.TreeStyle.LastParents,
        alternateAngle: 90,
        alternateNodeSpacing: 50,
      }),
    });

    // Group templates
    this.setupGroupTemplates($);
    
    // Link template
    this.diagram.linkTemplate = $(go.Link,
      {
        routing: go.Routing.Orthogonal,
        corner: 5,
        selectable: false,
        fromSpot: go.Spot.Bottom,
        toSpot: go.Spot.Top
      },
      $(go.Shape, { strokeWidth: 1, stroke: "#aeaeae" })
    );

    // Node template
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
          padding: 2,
          defaultAlignment: go.Spot.Center
        },
        // Position text
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2,
            font: "bold 16px 'Times New Roman'",
            stroke: "black",
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            margin: new go.Margin(0, 0, 3, 0),
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { margin: 6, font: "14px 'Times New Roman'" },
                new go.Binding("text", "position")
              )
            )
          },
          new go.Binding("visible", "name", (addr: string) => addr !== ""),
          new go.Binding("text", "position")
        ),
        // Position only (no name)
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2, rowSpan: 2,
            font: "bold 16px 'Times New Roman'",
            stroke: "black",
            alignment: go.Spot.Center,
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { margin: 6, font: "12px 'Times New Roman'" },
                new go.Binding("text", "position")
              )
            )
          },
          new go.Binding("visible", "name", (addr: string) => addr === ""),
          new go.Binding("text", "position")
        ),
        // Name text
        $(go.TextBlock,
          {
            row: 1, column: 0, columnSpan: 2,
            font: "italic 14px 'Times New Roman'",
            stroke: "black",
            maxSize: new go.Size(200, NaN),
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { margin: 6, font: "12px 'Times New Roman'" },
                new go.Binding("text", "name")
              )
            )
          },
          new go.Binding("visible", "position", (addr: string) => addr !== ""),
          new go.Binding("text", "name"),
        ),
        // Name only (no position)
        $(go.TextBlock,
          {
            row: 0, column: 0, columnSpan: 2, rowSpan: 2,
            font: "bold 16px 'Times New Roman'",
            stroke: "black",
            alignment: go.Spot.Center,
            width: 200,
            overflow: go.TextOverflow.Ellipsis,
            wrap: go.Wrap.None,
            textAlign: "center",
            toolTip: $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFF" }),
              $(go.TextBlock, { margin: 6, font: "12px 'Times New Roman'" },
                new go.Binding("text", "name")
              )
            )
          },
          new go.Binding("visible", "position", (addr: string) => addr === ""),
          new go.Binding("text", "name")
        ),
      )
    );
  }

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
              font: "bold 16px 'Times New Roman'",
              stroke: "red",
              margin: new go.Margin(0, 0, 5, 0),
              alignment: go.Spot.Center,
              textAlign: "center"
            },
            new go.Binding("text", "name")
          ),
          $(go.Placeholder, { padding: 1 })
        )
      );
    };

    this.diagram.groupTemplateMap.add("col4", createGroupTemplate(Infinity));
    this.diagram.groupTemplateMap.add("col2", createGroupTemplate(2));
    this.diagram.groupTemplateMap.add("col1", createGroupTemplate(1));
  }

  private renderDiagram(): void {
    if (!this.diagram) return;

    const data = this.orgChartData;
    const dataDetail = this.orgChartDetail;
    const departmentId = this.selectedDepartmentId;

    let assistantBgd = 0;
    let assistantTech = 0;
    const nodeDataArray: any[] = [];
    const linkDataArray: any[] = [];

    if (data.length > 0) {
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

        if (item.ParentID === 0 && departmentId === 0) {
          if (!nodeDataArray.some((n: any) => n.key === 0)) {
            nodeDataArray.push({
              key: 0,
              name: "",
              parent: "RTC",
              position: "RTC",
              color: "#e4985dff",
              colorStroke: "#303030ff"
            });
          }

          nodeDataArray.push({
            key: item.ID,
            parent: item.ParentID,
            position: position,
            name: name,
            color: TAGS_COLORS[item.Level] || "#fff",
            colorStroke: "black"
          });

          linkDataArray.push({
            from: item.ParentID,
            to: item.ID
          });
        } else {
          if (item.DepartmentID === 22 && departmentId === 0) return;
          if (item.Level >= 4 && departmentId === 0) return;

          nodeDataArray.push({
            key: item.ID,
            parent: item.ParentID,
            position: position,
            name: name,
            color: TAGS_COLORS[item.Level] || "#fff",
            colorStroke: "black",
            stt: item.STT
          });

          linkDataArray.push({
            from: item.ParentID,
            to: item.ID
          });
        }

        if (departmentId !== 0) {
          const child = dataDetail.filter((x: any) => x.OrganizationalChartID === item.ID);

          if (child.length > 0 && (item.ParentID !== 0 || departmentId === 1)) {
            let tagGroup = child.length < 5 ? "col1" : "col2";
            if (departmentId === 1) tagGroup = "col4";

            nodeDataArray.push({
              key: `${item.TeamName}-${item.ID}`,
              parent: item.ID,
              position: "",
              name: item.TeamName,
              category: tagGroup,
              isGroup: true,
              stt: item.STT
            });

            linkDataArray.push({
              from: item.ID,
              to: `${item.TeamName}-${item.ID}`
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
                group: `${item.TeamName}-${item.ID}`,
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

    // Add Assistant nodes
    if (departmentId === 2) {
      nodeDataArray.push({
        key: "Admin",
        parent: assistantTech,
        position: "Admin of the Engineering Department",
        name: "Nguyễn Thị Lan Hương",
        color: "#c8e6c9",
        colorStroke: "black",
        isAssistant: true,
      });
      linkDataArray.push({ from: assistantTech, to: "Admin" });
    }

    if (departmentId === 0) {
      nodeDataArray.push({
        key: "Bob",
        parent: assistantBgd,
        position: "Assistant to the BOD",
        name: "",
        color: "#c8e6c9",
        colorStroke: "black",
        isAssistant: true,
      });
      linkDataArray.push({ from: assistantBgd, to: "Bob" });
    }

    // Update diagram model
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: nodeDataArray,
      linkDataArray: linkDataArray
    });

    // Build search options
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

        return { key: String(node.key), label: optionText };
      });

    // Center on first node
    this.diagram.addDiagramListener("InitialLayoutCompleted", () => {
      const firstNode = this.diagram?.nodes.first();
      if (firstNode && this.diagram) {
        this.diagram.centerRect(firstNode.actualBounds);
      }
    });
  }

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

  exportToPDF(): void {
    const diagramDiv = document.getElementById("myDiagramDiv");
    if (!diagramDiv) return;

    if (typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
      html2canvas(diagramDiv).then((canvas: any) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jspdf.jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, "PNG", 0, 0);
        pdf.save("diagram.pdf");
      });
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thư viện xuất PDF chưa được tải');
    }
  }
}
