export interface SalaryIncreaseMailData {
  EmployeeName: string;
  Position: string;
  OldMonth: string;
  NewMonth: string;
  OldSalary: string;
  NewSalary: string;
  EffectiveDate: string;
}

const SALARY_INCREASE_MAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Quyết định điều chỉnh lương</title>
</head>

<body style="margin:0;background:#f5f5f5;font-family:'Times New Roman',Times,serif;">

    <table align="left" cellpadding="0" cellspacing="0" style="width:760pt;background:#fff;padding:10px;border:none">
        <tr>
            <td>

                <div style="text-align:center;line-height:1.5">
                    <div style="font-size:16px;font-weight:700;">
                        GIÁM ĐỐC
                    </div>

                    <div style="font-size:16px;font-weight:700;">
                        CÔNG TY CỔ PHẦN RTC TECHNOLOGY VIỆT NAM
                    </div>
                </div>

                <br>

                <div style="font-size:16px;font-style:italic;line-height:1.8">

                    Căn cứ vào Bộ luật lao động số 45/2019/QH14 và các văn bản sửa đổi, bổ sung;<br>

                    Căn cứ Điều lệ tổ chức hoạt động của Công ty;<br>

                    Căn cứ Quy chế lương, thưởng của Công ty;<br>

                    Căn cứ tính chất công việc của ông/bà
                    {{EmployeeName}} - {{Position}};

                </div>

                <br>

                <div style="text-align:center;font-size:16px;font-weight:700;">
                    QUYẾT ĐỊNH:
                </div>

                <br>

                <div style="font-size:16px;">
                    <b>Điều 1.</b>
                    Điều chỉnh lương đối với ông/bà
                    {{EmployeeName}} -
                    {{Position}}:
                </div>

                <br>

                <table width="100%" cellspacing="0" cellpadding="8"
                    style="border-collapse:collapse;font-size:16px;">

                    <tr style="font-weight:700;text-align:center;">
                        <td style="border:1px solid #000;width:50px;">TT</td>

                        <td style="border:1px solid #000;width:340px;">
                            Họ và tên
                        </td>

                        <td style="border:1px solid #000;width:300px;">
                            Chức vụ
                        </td>

                        <td style="border:1px solid #000;background:#f6d7c8;width:122pt">
                            Lương cơ bản <br> hiện tại
                        </td>

                        <td style="border:1px solid #000;background:#b8e69e;width:122pt">
                            Lương cơ bản <br> mới
                        </td>
                    </tr>

                    <tr align="center">

                        <td style="border:1px solid #000;">1</td>

                        <td style="border:1px solid #000;">
                            {{EmployeeName}}
                        </td>

                        <td style="border:1px solid #000;">
                            {{Position}}
                        </td>

                        <td style="border:1px solid #000;font-weight:700;text-align:right;">
                            {{OldSalary}}
                        </td>

                        <td style="border:1px solid #000;font-weight:700;text-align:right;">
                            {{NewSalary}}
                        </td>

                    </tr>

                </table>

                <br>

                <div style="font-size:16px;line-height:1.8">

                    <b>Điều 2.</b>
                    Thời gian áp dụng lương cơ bản mới kể từ ngày {{EffectiveDate}}.

                    <br>

                    <b>Điều 3.</b>
                    Phòng Hành chính Nhân sự, Tài chính Kế toán,
                    Phòng ban liên quan và ông/bà
                    {{EmployeeName}}
                    căn cứ Quyết định thi hành.

                </div>

                <br><br>

                <table width="100%">
                    <tr>

                        <td width="60%"></td>

                        <td align="center">

                            <div style="font-size:16px;font-weight:700;">
                                GIÁM ĐỐC
                            </div>

                            <div style="font-size:16px;font-style:italic;color:#777;">
                                (Đã ký)
                            </div>

                        </td>

                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>

</html>`;

function renderPlaceholders(template: string, data: SalaryIncreaseMailData): string {
  return template
    .replace(/\{\{EmployeeName\}\}/g, data.EmployeeName || '')
    .replace(/\{\{Position\}\}/g, data.Position || '')
    .replace(/\{\{OldSalary\}\}/g, data.OldSalary || '')
    .replace(/\{\{NewSalary\}\}/g, data.NewSalary || '')
    .replace(/\{\{EffectiveDate\}\}/g, data.EffectiveDate || '');
}

export function buildSalaryIncreaseMailBody(data: SalaryIncreaseMailData): string {
  return renderPlaceholders(SALARY_INCREASE_MAIL_TEMPLATE, data);
}

export function buildSalaryIncreaseMailSubject(data: SalaryIncreaseMailData): string {
  return `RTC_QĐ điều chỉnh lương CBNV_${data.EmployeeName || ''}_${data.Position || ''}`;
}
