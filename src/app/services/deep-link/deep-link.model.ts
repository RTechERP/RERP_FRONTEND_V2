/**
 * Kiểu dữ liệu của 1 trường filter truyền qua URL.
 * Giá trị trên URL luôn là chuỗi, kiểu này quyết định cách ép về giá trị thật.
 */
export type DeepLinkValueType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'number[]'
    | 'string[]';

/** Khai báo 1 trường filter được phép truyền qua URL. */
export interface DeepLinkField {
    /**
     * Tên key đổ vào `tabData` của component đích.
     * Phải trùng đúng tên biến mà component đang đọc từ `@Inject('tabData')`.
     */
    key: string;

    /** Kiểu dữ liệu để ép từ chuỗi URL. Mặc định 'string'. */
    type?: DeepLinkValueType;

    /** Các tên khác cũng chấp nhận trên URL (không phân biệt hoa/thường). */
    aliases?: string[];

    /** Nhãn tiếng Việt dùng cho thông báo lỗi khi không tra được giá trị. */
    label?: string;

    /**
     * Tên resolver (đăng ký trong DeepLinkResolverService) dùng để đổi
     * giá trị thân thiện trên URL sang giá trị trang thật sự cần.
     * Ví dụ: mã dự án 'RTC-001' -> ProjectID 245.
     */
    resolver?: string;

    /** Key đích sau khi resolve. Mặc định ghi đè chính `key`. */
    resolveTo?: string;

    /** Giữ lại giá trị gốc trong tabData sau khi resolve. Mặc định true. */
    keepRaw?: boolean;
}

/** Khai báo 1 trang hỗ trợ deep-link. */
export interface DeepLinkPage {
    /** Route thật đã khai báo trong app.routes.ts. */
    route: string;

    /** Tên ngắn dùng trên URL, ví dụ 'issuelog'. Có thể khai nhiều tên. */
    alias?: string | string[];

    /** Tiêu đề tab. Bỏ trống thì lấy title của menu. Có thể là hàm nhận bộ lọc để sinh tên động. */
    title?: string | ((filters: Record<string, any>) => string);

    /**
     * Các trường filter cho phép truyền qua URL.
     * Key của object là tên tham số trên URL (nên viết thường).
     */
    fields: Record<string, DeepLinkField>;
}

/** Kết quả parse 1 URL. */
export interface ParsedDeepLink {
    /** Route thật (alias đã được quy đổi). */
    route: string;

    /** Tiêu đề tab lấy từ config, có thể undefined. */
    title?: string;

    /** Config của trang, undefined nếu route không đăng ký deep-link. */
    page?: DeepLinkPage;

    /** Filter đã ép kiểu, key theo `DeepLinkField.key`. */
    filters: Record<string, any>;

    /** true khi route có đăng ký deep-link và URL truyền ít nhất 1 filter hợp lệ. */
    isDeepLink: boolean;
}
