# Implementation Plan: Layout Left-Right for Project Gate Step Checklist

## 📌 User Request (VERBATIM)
> hiện tại layout bảng trên bảng dưới , bạn hãy chuyển trành layout trái phải cho tôi

## 🎯 Acceptance Criteria (Derived from User Request)
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC1 | Convert layout of `ProjectGateStepChecklistComponent` from top-bottom to left-right (horizontal split) | Verify visually or via template code that elements are organized in a horizontal flex layout (`flex-row`) |
| AC2 | Left panel occupies approximately 25% (or min-width 250px) to show CheckList master | Verify CSS/inline style setting flex-basis or width to 25% |
| AC3 | Right panel occupies remaining space to show CheckListDetail | Verify right panel wraps the details table and grows to fill remaining width (`flex-grow-1`) |
| AC4 | Independent scroll is preserved for both tables | Verify tables scroll inside their respective panels without expanding the whole page |

## 📋 Context Summary
- **Architecture**: Angular 17+ component `ProjectGateStepChecklistComponent`.
- **Patterns**: Replacing PrimeNG `<p-splitter>` with clean, lightweight CSS Flexbox layout (`d-flex flex-row`) to ensure 100% reliability, eliminating dependency on third-party PrimeNG Splitter CSS which may not render correctly.
- **Constraints**: Maintain all existing logic, event bindings (`(click)`, `(ngModelChange)`), component APIs, and table configurations.

## Prerequisites
- [x] Context Scan complete (patterns and structure checked)

## Phase 1: HTML & CSS Refactoring
### Tasks
- [ ] Task 1.1: Modify HTML layout
  - Agent: `frontend-engineer`
  - File(s): [project-gate-step-checklist.component.html](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.html)
  - Details: Replace `<p-splitter>` and its `<ng-template>` tags with a flex container (`d-flex flex-row`) containing two divs for the left and right panels.
- [ ] Task 1.2: Update component styles
  - Agent: `frontend-engineer`
  - File(s): [project-gate-step-checklist.component.css](file:///d:/RTechERP/RERP_FRONTEND_V2/src/app/pages/project/project-gate-step/project-gate-step-checklist/project-gate-step-checklist.component.css)
  - Details: Clean up unused `p-splitter` styles, define clear layout structures for left and right panels with flex styles.

### Exit Criteria
- [ ] Left and right panels are correctly separated horizontally.
- [ ] Component compiles successfully.

## Risks
| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| Tables stretch layout vertically | Medium | Set container height to `100%`, use `overflow-hidden` and `scrollHeight="flex"` on table. | Revert git changes via `git checkout` |

## Rollback Strategy
- Run `git checkout src/app/pages/project/project-gate-step/project-gate-step-checklist/` to discard changes.
