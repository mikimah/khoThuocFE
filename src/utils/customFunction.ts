export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", options).format(date);
}

export function extractLeadingNum(input: string): string {
  // Tìm các chữ số nằm ngay đầu chuỗi
  const match = input.trim().match(/^\d+/);

  // Nếu tìm thấy thì trả về chuỗi số đó, không thấy thì trả về chuỗi rỗng
  return match ? match[0] : "";
}

export function extractLoCode(str: string): string {
  if (!str) return "";

  // Bước 1: Loại bỏ phần từ dấu "/" trở đi (Cắt lấy phần trước dấu "/")
  const beforeSlash = str.split("/")[0].trim();

  // Bước 2: Dùng Regex loại bỏ các chữ số (\d+) nằm ở ngay đầu chuỗi (^)
  const finalCode = beforeSlash.replace(/^\d+/, "");

  return finalCode;
}

export function extractDate(str: string): string {
  if (!str) return "";

  // Tìm dấu / và gom các chữ số (\d+) ngay sau nó vào nhóm capture group [1]
  const match = str.match(/\/(\d+)/);

  // Nếu tìm thấy thì trả về nhóm số đó, không thấy thì trả về chuỗi rỗng
  return match ? match[1] : "";
}

export function extractPrice(str: string): string {
  if (!str || !str.includes("/")) return "";

  // 1. Lấy toàn bộ phần nằm sau dấu "/"
  const afterSlash = str.split("/")[1].trim(); // Ví dụ: "2601012M5" hoặc "2601012M5H1#"

  // 2. Dùng Regex xóa bỏ các chữ số (^\d+) nằm ở ngay đầu của phần này
  const finalSuffix = afterSlash.replace(/^\d+/, "");

  return finalSuffix;
}

export function convertYYMMDDToDate(str: string) {
  if (!str || str.length < 6) return null;

  // 1. Bóc tách chuỗi dựa trên vị trí (Giả định năm thuộc thế kỷ 21: 20xx)
  const year = "20" + str.slice(0, 2); // "26" -> "2026"
  const month = str.slice(2, 4); // "01" -> "01"
  const day = str.slice(4, 6); // "01" -> "01"

  // 2. Tạo chuỗi format chuẩn ISO để HTML Input hoặc các thư viện hiểu (YYYY-MM-DD)
  const dateString = `${year}-${month}-${day}`; // "2026-01-01"

  return dateString;


}

export function addYearsToDate(dateStr: string, yearsToAdd: number): string {
  // 1. Chuyển chuỗi "2026-01-01" thành đối tượng Date
  const date = new Date(dateStr);

  // Kiểm tra xem chuỗi ngày truyền vào có hợp lệ không
  if (isNaN(date.getTime())) return "";

  // 2. Lấy năm hiện tại và cộng thêm số năm mong muốn
  date.setFullYear(date.getFullYear() + yearsToAdd);

  // 3. Định dạng lại thành chuỗi YYYY-MM-DD
  const year = date.getFullYear();
  // Hàm padStart(2, '0') giúp đảm bảo tháng và ngày luôn có 2 chữ số (vd: "01" thay vì "1")
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseMoney(text: string) {
    let total = 0;

    const regex = /([MH])(\d+)(!?)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const type = match[1];
        let value = match[2];
        const hasBang = match[3] === "!";

        if (hasBang) {
            value += "00"; // thêm 2 số 0
        }

        value = Number(value);

        if (type === "M") {
            total += value * 1_000_000;
        } else if (type === "H") {
            total += value * 1_000;
        }
    }

    return total;
}
