# Scout Report: Layout Left-Right for Project Gate Step Checklist

## Exploration Scope
- Target: Convert layout of `ProjectGateStepChecklistComponent` from top-bottom to left-right.
- Boundaries: 
  - [project-gate-step-checklist.component.html](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.html)
  - [project-gate-step-checklist.component.css](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.css)
  - [project-gate-step-checklist.component.ts](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.ts)

## Patterns Discovered
### Pattern: PrimeNG Splitter Usage
- **Location**: [project-gate-step-checklist.component.html](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.html#L31-L225)
- **Usage**: Uses `<p-splitter layout="horizontal" [panelSizes]="[25, 75]" ...>` to separate left and right panels.
- **Problem**: Even with `layout="horizontal"`, if the splitter library doesn't render properly due to CSS bundling or component integration, it defaults to vertical layout (block stacked).
- **Alternative/Must Follow**: For reliable left-right layouts, we can replace the PrimeNG splitter with standard Flexbox layout or Bootstrap CSS grid (`row` and `col` classes).

### Pattern: Component CSS Styling
- **Location**: [project-gate-step-checklist.component.css](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.css)
- **Usage**: Controls the sizes of panels, tables, and overrides PrimeNG splitter styles with `::ng-deep`.
- **Constraint**: Custom CSS needs to be updated to match the new flex-row layout and ensure the left panel and right panel stack properly side-by-side.

## Integration Points
| Point | File | Function | New Code Location |
|---|---|---|---|
| HTML Layout | `project-gate-step-checklist.component.html` | Template structure | Replace `<p-splitter>` with flexbox container and regular divs for left and right panels. |
| CSS Layout | `project-gate-step-checklist.component.css` | Styles overrides | Remove splitter styles, style left and right panels using flexbox and proper widths. |

## Conventions
- Use standard Bootstrap/Flexbox classes (`d-flex`, `flex-row`, `h-100`, `w-100`, `overflow-hidden`).
- Keep templates clean and semantic.

## Warnings
- Ensure both panels have scrolling enabled independently so the tables don't stretch the container vertically.
