import { AppUserService } from '../../services/app-user.service';

/**
 * Mã nhóm quyền "Chỉ được xem phiếu nhập/xuất".
 * Người dùng thuộc nhóm này chỉ được xem danh sách + chi tiết phiếu nhập/xuất,
 * mọi thao tác thêm/sửa/xóa/duyệt/quét mã đều bị ẩn.
 *
 * Áp dụng cho các màn: bill-import-new, bill-export-new,
 * bill-import-detail-new, bill-export-detail-new.
 */
export const BILL_VIEW_ONLY_PERMISSION = 'N118';

/**
 * Các mã quyền "thêm/sửa/xóa" phiếu nhập/xuất đang dùng trong 4 màn trên
 * (hợp của 'N27,N1,N33,N34,N69' và 'N27,N1,N33,N34,N69,N35').
 * Dùng để loại trừ: user vừa có N118 vừa có 1 trong các mã này (do thuộc
 * nhiều nhóm quyền cộng dồn) thì vẫn được sửa bình thường, không bị ép về
 * chế độ chỉ xem.
 */
const BILL_EDIT_PERMISSIONS = ['N27', 'N1', 'N33', 'N34', 'N69', 'N35'];

/**
 * Kiểm tra user hiện tại có thuộc nhóm "Chỉ được xem phiếu nhập/xuất" hay không.
 * Chỉ true khi user có mã N118 VÀ không có bất kỳ mã thêm/sửa/xóa nào khác -
 * tức N118 là quyền duy nhất họ có liên quan tới phiếu nhập/xuất.
 * Tách riêng khỏi PermissionService vì đây là quyền loại trừ, ngược logic với
 * hasPermission() (vốn trả về true cho Admin và cộng dồn theo nhóm).
 */
export function isBillViewOnly(appUserService: AppUserService): boolean {
    const currentUser = appUserService.currentUser;
    if (!currentUser || currentUser.IsAdmin) return false;

    const permissions = (currentUser.Permissions ?? '')
        .split(',')
        .map((code) => code.trim());

    const hasViewOnlyCode = permissions.includes(BILL_VIEW_ONLY_PERMISSION);
    if (!hasViewOnlyCode) return false;

    const hasEditPermission = BILL_EDIT_PERMISSIONS.some((code) =>
        permissions.includes(code)
    );
    return !hasEditPermission;
}
