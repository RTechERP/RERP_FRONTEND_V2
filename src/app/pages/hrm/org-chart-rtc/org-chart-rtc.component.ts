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
import { NOTIFICATION_TITLE, NOTIFICATION_TYPE_MAP, NOTIFICATION_TITLE_MAP, RESPONSE_STATUS } from '../../../app.config';
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
        private workplanService: WorkplanService
    ) { }

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
                    padding: 6,
                    defaultAlignment: go.Spot.Center
                },
                // Position text
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
                // Position only (no name)
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
                // Name text
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
                // Name only (no position)
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

    private renderDiagram(): void {
        if (!this.diagram) return;

        const data = this.orgChartData;
        const dataDetail = this.orgChartDetail;
        const departmentId = this.selectedDepartmentId;

        // 1. Pre-calculate recursive totals from ALL raw data
        const childrenMapFull = new Map<any, any[]>();
        const localCountsFull = new Map<any, number>();

        data.forEach((item: any) => {
            localCountsFull.set(item.ID, item.EmployeeCount || 0);
            if (item.ParentID !== undefined) {
                if (!childrenMapFull.has(item.ParentID)) childrenMapFull.set(item.ParentID, []);
                childrenMapFull.get(item.ParentID)!.push(item.ID);
            }
        });

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

        // Root key 0 calculation if applicable
        const getRootTotal = () => {
            let rootTotal = 0;
            data.forEach(item => {
                if (item.ParentID === 0) rootTotal += calculateTotal(item.ID);
            });
            return rootTotal;
        };

        // 2. Build diagram nodes
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

                const totalForThisNode = calculateTotal(item.ID);
                const hasSubDepartments = (childrenMapFull.get(item.ID) || []).length > 0;
                const hasEmployees = dataDetail.some((x: any) => x.OrganizationalChartID === item.ID);
                const hasChildren = hasSubDepartments || hasEmployees;
                const displayCount = (hasChildren && (departmentId === 0 || item.Level === 1 || item.Level === 2 || item.Level === 3 || item.Level === 4 || item.Level === 5)) ? totalForThisNode : 0;

                if (item.ParentID === 0 && departmentId === 0) {
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

                    nodeDataArray.push({
                        key: item.ID,
                        parent: item.ParentID,
                        position: position,
                        name: name,
                        color: TAGS_COLORS[item.Level] || "#fff",
                        colorStroke: "black",
                        totalCount: displayCount
                    });

                    linkDataArray.push({
                        from: item.ParentID,
                        to: item.ID
                    });
                } else {
                    if (item.DepartmentID === 22 && departmentId === 0) return;
                    // Removed Level 4 restriction so "Project Team 2" shows up
                    if (item.Level >= 4 && departmentId === 0) return;
                    nodeDataArray.push({
                        key: item.ID,
                        parent: item.ParentID,
                        position: position,
                        name: name,
                        color: TAGS_COLORS[item.Level] || "#fff",
                        colorStroke: "black",
                        stt: item.STT,
                        totalCount: displayCount
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

        // Add Assistant nodes
        if (departmentId === 2) {
            nodeDataArray.push({
                key: "Admin",
                parent: assistantTech,
                position: "Admin of the Engineering Department",
                name: "Mai Thị Tú Oanh",
                color: "#c8e6c9",
                colorStroke: "black",
                totalCount: 0
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
                totalCount: 0
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
                if (node.totalCount > 0) optionText += ` (${node.totalCount})`;

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
            pdf.save("SĐTC_RTC.pdf");

            this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file thành công!');
        } catch (error: any) {
            console.error('Lỗi khi xuất PDF:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xuất file: ' + error.message);
        }
    }
}
