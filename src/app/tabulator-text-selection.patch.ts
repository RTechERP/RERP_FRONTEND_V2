import { Tabulator } from 'tabulator-tables';

/**
 * Cho phép bôi đen text trong cell Tabulator để copy.
 *
 * Module SelectRow của Tabulator gắn listener 'click' lên mỗi dòng và gọi
 * table._clearSelection() (xoá sạch selection của trình duyệt) mỗi khi click,
 * miễn là lưới có bật selectableRows. Vì gần như toàn bộ lưới trong app dùng
 * selectableRows: 1 hoặc true nên khi người dùng kéo chuột bôi đen text rồi thả
 * ra, event click bắn ra và vệt bôi đen bị xoá ngay -> không copy được.
 *
 * Patch dưới đây giữ lại selection khi người dùng thật sự đang bôi đen text bên
 * trong lưới, và vẫn xoá như cũ với shift-click (chọn range dòng) để không để
 * lại vệt bôi đen thừa. Việc chọn dòng không đổi: toggleRow vẫn chạy như trước.
 */

interface TabulatorSelectionPatch {
    _clearSelection?: (this: { element: HTMLElement }) => void;
    __rerpKeepTextSelection?: boolean;
}

let lastPointerShiftKey = false;

if (typeof document !== 'undefined') {
    document.addEventListener(
        'mousedown',
        (e: MouseEvent) => (lastPointerShiftKey = e.shiftKey),
        true
    );
}

// _clearSelection nằm trên lớp Tabulator gốc, TabulatorFull kế thừa lại nên chỉ
// cần vá một lần ở đây là mọi lưới trong app đều nhận.
const proto = Tabulator.prototype as unknown as TabulatorSelectionPatch;

if (typeof proto._clearSelection === 'function' && !proto.__rerpKeepTextSelection) {
    const clearSelection = proto._clearSelection;

    proto._clearSelection = function (this: { element: HTMLElement }) {
        if (!lastPointerShiftKey) {
            const selection = window.getSelection();
            if (
                selection &&
                !selection.isCollapsed &&
                selection.toString().trim() !== '' &&
                selection.anchorNode &&
                this.element?.contains(selection.anchorNode)
            ) {
                return;
            }
        }
        clearSelection.call(this);
    };

    proto.__rerpKeepTextSelection = true;
}
