import { SlickGrid } from '@slickgrid-universal/common';

/**
 * Cho phép bôi đen text trong cell SlickGrid để copy.
 *
 * SlickGrid gắn Draggable lên container với allowDragFrom = 'div.slick-cell',
 * nên khi mousedown rơi đúng vào chính thẻ div.slick-cell thì handleDragInit
 * chạy và bắn event onDragInit. SlickHybridSelectionModel (được đăng ký cho mọi
 * lưới có enableSelection / enableRowSelection / enableCheckboxSelector) lắng
 * nghe event này và gọi e.preventDefault() để "chặn bôi đen text khi kéo dòng"
 * -> trình duyệt không bắt đầu được thao tác bôi đen.
 *
 * Vì mousedown chỉ trúng div.slick-cell khi cell render text trần, triệu chứng
 * là các cột không có formatter thì không bôi đen được, còn cột nào formatter
 * bọc nội dung trong thẻ con (span, div...) thì lại bôi đen bình thường.
 *
 * Patch dưới đây bỏ qua handleDragInit cho cell thường (trả false đúng như giá
 * trị SlickGrid trả khi không ai nhận xử lý drag), nên không còn preventDefault.
 * Cell của Row Move Manager (.dnd / .cell-reorder) và tay kéo drag-extend vẫn đi
 * đường cũ nên kéo thả dòng không bị ảnh hưởng.
 *
 * Lưu ý: app không dùng dragToSelect hay selectionOptions.selectionType: 'cell'
 * nên lưới không có cell-range-selector; thao tác kéo trong cell thường trước
 * giờ không làm gì cả ngoài việc chặn bôi đen.
 */

interface SlickGridDragPatch {
    handleDragInit?: (this: unknown, e: Event, dd: unknown) => boolean;
    __rerpKeepTextSelection?: boolean;
}

const proto = SlickGrid.prototype as unknown as SlickGridDragPatch;

if (typeof proto.handleDragInit === 'function' && !proto.__rerpKeepTextSelection) {
    const handleDragInit = proto.handleDragInit;

    proto.handleDragInit = function (this: unknown, e: Event, dd: unknown): boolean {
        const target = e?.target;
        if (
            target instanceof HTMLElement &&
            target.classList.contains('slick-cell') &&
            !target.classList.contains('dnd') &&
            !target.classList.contains('cell-reorder')
        ) {
            return false;
        }
        return handleDragInit.call(this, e, dd);
    };

    proto.__rerpKeepTextSelection = true;
}
