// readonly-long-text-editor.ts
import { LongTextEditor } from 'angular-slickgrid';
import type { EditorArguments } from 'angular-slickgrid';

export class ReadOnlyLongTextEditor extends LongTextEditor {
    constructor(args: EditorArguments) {
        super(args);
    }

    override init(): void {
        // Gọi init của parent
        super.init();

        // Sau khi init xong, disable textarea
        // Chúng ta set chiều cao ngay lập tức (không cần setTimeout dài) để SlickGrid có thể tính toán vị trí tốt hơn 
        // mặc dù SlickGrid thường tính vị trí ngay sau init.
        if (this['_textareaElm']) {
            this['_textareaElm'].readOnly = true;
            this['_textareaElm'].style.backgroundColor = '#f5f5f5';
            this['_textareaElm'].style.cursor = 'default';
            this['_textareaElm'].style.minHeight = '300px';
        }

        // Ẩn nút Save
        if (this['_wrapperElm']) {
            const saveBtn = this['_wrapperElm'].querySelector('.btn-save') as HTMLElement;
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
            // Style nút Cancel thành nút Đóng
            const cancelBtn = this['_wrapperElm'].querySelector('.btn-cancel') as HTMLElement;
            if (cancelBtn) {
                cancelBtn.style.width = '30%';
                cancelBtn.style.backgroundColor = '#1890ff';
                cancelBtn.style.color = 'white';
                cancelBtn.style.border = 'none';
                cancelBtn.style.borderRadius = '4px';
                cancelBtn.style.fontWeight = '600';
                cancelBtn.textContent = 'Đóng';
            }
        }
    }

    /**
     * Override position to handle case where editor is near the bottom of the screen.
     * If it overflows the bottom, we shift it up.
     */
    override position(parentOffsets: any): void {
        super.position(parentOffsets);

        if (this['_wrapperElm']) {
            const rect = this['_wrapperElm'].getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;

            // If the editor bottom goes beyond the window height, shift it up
            if (rect.bottom > windowHeight) {
                const overlap = rect.bottom - windowHeight + 10; // 10px buffer
                const currentTop = parseFloat(this['_wrapperElm'].style.top || '0');
                this['_wrapperElm'].style.top = (currentTop - overlap) + 'px';
            }

            // Also check if it's too high (extremely rare with 300px but good for robustness)
            if (rect.top < 0) {
                this['_wrapperElm'].style.top = '10px';
            }
        }
    }

    // Override các method để không cho save
    override save(): void {
        // Không làm gì cả - không save
        this.cancel();
    }

    override applyValue(_item: any, _state: any): void {
        // Không apply value - chỉ đọc
    }

    override isValueChanged(): boolean {
        // Luôn trả về false - không có thay đổi
        return false;
    }

    override validate(): any {
        // Luôn valid
        return { valid: true, msg: '' };
    }
}
