// readonly-long-text-editor.ts
import { LongTextEditor } from "angular-slickgrid";
import type { EditorArguments } from 'angular-slickgrid';

export class ReadOnlyLongTextEditor extends LongTextEditor {
    constructor(args: EditorArguments) {
        super(args);
    }

    override init(): void {
        // Gọi init của parent
        super.init();

        // Sau khi init xong, disable textarea
        if (this._textareaElm) {
            this._textareaElm.readOnly = true;
            this._textareaElm.disabled = true;
            this._textareaElm.style.backgroundColor = '#f5f5f5';
            this._textareaElm.style.cursor = 'default';
            this._textareaElm.style.opacity = '0.8';
        }

        // Ẩn footer (nút Save/Cancel)
        const footerElm = this._wrapperElm.querySelector('.editor-footer') as HTMLElement;
        if (footerElm) {
            footerElm.style.display = 'none';
        }
    }

    // Override các method để không cho save
    override save(): void {
        // Không làm gì cả - không save
        this.cancel();
    }

    override applyValue(item: any, state: any): void {
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