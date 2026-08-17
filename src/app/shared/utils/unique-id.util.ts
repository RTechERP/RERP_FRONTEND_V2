/**
 * Sinh chuỗi ID duy nhất (dùng cho gridId, container class...).
 *
 * `crypto.randomUUID()` chỉ tồn tại trong secure context (https hoặc localhost).
 * Khi app chạy qua http trên IP nội bộ thì hàm này undefined -> lỗi
 * "crypto.randomUUID is not a function". Nên fallback lần lượt:
 * crypto.randomUUID -> crypto.getRandomValues -> Math.random.
 */
export function generateUniqueId(): string {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    // Định dạng theo chuẩn UUID v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Trường hợp cuối: không có crypto (môi trường rất cũ)
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random()
    .toString(16)
    .slice(2, 10)}`;
}
