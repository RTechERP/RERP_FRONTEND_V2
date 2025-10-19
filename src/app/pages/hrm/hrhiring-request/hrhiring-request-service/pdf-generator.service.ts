import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService {
  constructor() {}

  async generateHiringRequestPDF(data: any): Promise<void> {
    try {
      // Tạo hai trang riêng biệt
      const page1Content = this.createPage1Content(data);
      const page2Content = this.createPage2Content(data);

      // Thêm vào body để render
      document.body.appendChild(page1Content);
      document.body.appendChild(page2Content);

      // Đợi load ảnh logo
      await this.waitForImages(page1Content);
      await this.waitForImages(page2Content);

      // Tạo PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Render trang 1
      const canvas1 = await html2canvas(page1Content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const imgData1 = canvas1.toDataURL('image/png');
      pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297);

      // Thêm trang 2
      pdf.addPage();

      // Render trang 2
      const canvas2 = await html2canvas(page2Content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const imgData2 = canvas2.toDataURL('image/png');
      pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297);

      // Xóa elements tạm
      document.body.removeChild(page1Content);
      document.body.removeChild(page2Content);

      // Mở PDF trong tab mới
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(img);
        } else {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          setTimeout(() => resolve(img), 5000);
        }
      });
    });
    await Promise.all(imagePromises);
  }

  private createPage1Content(data: any): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 794px;
      height: 1123px;
      background: white;
      padding: 40px;
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #000;
      box-sizing: border-box;
      page-break-after: always;
    `;

    container.innerHTML = `
      <!-- Header với logo -->
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px; border: 1px solid #000;">
        <div style="width: 120px; height: 80px; display: flex; align-items: center; justify-content: center; border-right: 1px solid #000; padding: 10px;">
          <img src="logoRTC.png"
               style="max-width: 100px; max-height: 70px; object-fit: contain;" 
               crossorigin="anonymous"
               alt="RTC Logo"
               onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\'width: 80px; height: 60px; background-color: #f0f0f0; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #666;\'>RTC</div>'" />
        </div>
        <div style="flex: 1; text-align: center; font-weight: bold; font-size: 14pt; padding: 20px;">
          <div style="margin-bottom: 5px;">CÔNG TY CỔ PHẦN</div>
          <div>RTC TECHNOLOGY VIỆT NAM</div>
        </div>
      </div>

      <!-- Title -->
      <div style="text-align: center; margin-bottom: 20px; border: 2px solid #000; padding: 15px;">
        <div style="font-weight: bold; font-size: 16pt; margin-bottom: 8px;">PHIẾU ĐỀ NGHỊ TUYỂN DỤNG</div>
        <div style="font-style: italic; font-size: 11pt;">(BM01-RTC.HR-QT01)</div>
      </div>

      <!-- Section I Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-size: 12pt; background-color: #f0f0f0;" colspan="4">
            I- YÊU CẦU CHUNG
          </td>
        </tr>
      </table>

      <!-- Main Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11pt;">
        <!-- Row 1: Phòng ban và Trình độ học vấn -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 25%; vertical-align: top;">Phòng ban/Bộ phận:</td>
          <td style="border: 1px solid #000; padding: 6px; width: 30%; vertical-align: top;">${
            data?.DepartmentName || 'Manufacturing Dept'
          }</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 20%; vertical-align: top;">*Trình độ học vấn*:</td>
          <td style="border: 1px solid #000; padding: 6px; width: 25%; vertical-align: top;">
            ${this.getEducationCheckboxes(data)}
          </td>
        </tr>
        
        <!-- Row 2: Vị trí tuyển dụng -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Vị trí tuyển dụng:</td>
          <td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${
            data?.EmployeeChucVuHDName || 'Nhân viên lắp ráp điện'
          }</td>
          <td style="border: 1px solid #000; padding: 6px; vertical-align: top;"></td>
          <td style="border: 1px solid #000; padding: 6px; vertical-align: top;"></td>
        </tr>
        
        <!-- Row 3: Số lượng cần tuyển -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Số lượng cần tuyển:</td>
          <td style="border: 1px solid #000; padding: 6px;">${
            data?.QuantityHiring || '2'
          }</td>
          <td style="border: 1px solid #000; padding: 6px;"></td>
          <td style="border: 1px solid #000; padding: 6px;"></td>
        </tr>
        
        <!-- Row 4: Lương cơ bản -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Lương cơ bản đề xuất:</td>
          <td style="border: 1px solid #000; padding: 6px;">${this.formatSalaryRange(
            data
          )}</td>
          <td style="border: 1px solid #000; padding: 6px;"></td>
          <td style="border: 1px solid #000; padding: 6px;"></td>
        </tr>
        
        <!-- Row 5: Giới tính và Độ tuổi -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Giới tính:</td>
          <td style="border: 1px solid #000; padding: 6px;">${this.getGenderText(
            data
          )}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Độ tuổi:</td>
          <td style="border: 1px solid #000; padding: 6px;">${this.formatAgeRange(
            data
          )}</td>
        </tr>
        
        <!-- Row 6: Ngoại hình -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Ngoại hình:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">
            ${this.getAppearanceCheckboxes(data)}
          </td>
        </tr>
        
        <!-- Row 7: Địa chỉ làm việc -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Địa chỉ làm việc:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">${
            data?.WorkAddress ||
            'Cụm công nghiệp Dân Phượng GĐ2, xã Dân Phượng, huyện Dân Phượng, Hà Nội.'
          }</td>
        </tr>
        
        <!-- Row 8: Kinh nghiệm làm việc -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Kinh nghiệm làm việc ở vị trí tuyển dụng:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">
            ${this.getExperienceCheckboxes(data)}
          </td>
        </tr>
        
        <!-- Row 9: Yêu cầu chuyên môn -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Yêu cầu chuyên môn:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">${
            data?.ProfessionalRequirement ||
            'Điện tự động hóa, Điện công nghiệp.'
          }</td>
        </tr>
        
        <!-- Row 10: Mô tả công việc -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">Mô tả công việc cơ bản và yêu cầu bổ sung:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">
            <div style="white-space: pre-line; font-size: 10pt; line-height: 1.4;">
              ${this.formatJobDescription(data?.JobDescription)}
            </div>
          </td>
        </tr>
      </table>

      <!-- Section II Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-size: 12pt; background-color: #f0f0f0;" colspan="4">
            II- YÊU CẦU VỀ KỸ NĂNG
          </td>
        </tr>
      </table>

      <!-- Skills Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11pt;">
        <!-- Foreign Language -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 25%; vertical-align: top;">1/ Trình độ ngoại ngữ:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">
            ${this.getLanguageSection(data)}
          </td>
        </tr>
        
        <!-- Computer Skills -->
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">2/ Trình độ vi tính:</td>
          <td colspan="3" style="border: 1px solid #000; padding: 6px; vertical-align: top;">
            ${this.getComputerSkillsSection(data)}
          </td>
        </tr>
      </table>
    `;

    return container;
  }

  private createPage2Content(data: any): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 794px;
      height: 1123px;
      background: white;
      padding: 40px;
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #000;
      box-sizing: border-box;
    `;

    container.innerHTML = `
      <!-- Section III Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-size: 12pt; background-color: #f0f0f0;">
            III- YÊU CẦU VỀ SỨC KHỎE
          </td>
        </tr>
      </table>

      <!-- Health Requirements -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
            ${this.getHealthSection(data)}
          </td>
        </tr>
      </table>

      <!-- Section IV Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-size: 12pt; background-color: #f0f0f0;">
            IV- YÊU CẦU VỀ GIAO TIẾP
          </td>
        </tr>
      </table>

      <!-- Communication Requirements -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
            ${this.getCommunicationSection(data)}
          </td>
        </tr>
      </table>

      <!-- Ghi chú -->
      <div style="margin: 30px 0; font-size: 11pt;">
        <div style="font-weight: bold; margin-bottom: 8px; text-decoration: underline;">* Ghi chú:</div>
        <div style="margin-bottom: 5px;">- Anh/chị điền trực tiếp trên mẫu form</div>
        <div style="margin-bottom: 20px;">- Chọn và đánh dấu (x) vào ô tương ứng</div>
      </div>

      <!-- Date -->
      <div style="text-align: right; margin: 30px 0 20px 0; font-style: italic; font-size: 11pt;">
        Hà Nội, ngày ${new Date()
          .getDate()
          .toString()
          .padStart(2, '0')} tháng ${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}. năm ${new Date().getFullYear()}.
      </div>

      <!-- Signature Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; width: 33.33%;">BỘ PHẬN ĐỀ XUẤT</td>
          <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; width: 33.33%;">PHÒNG HCNS</td>
          <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; width: 33.33%;">PHÊ DUYỆT</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 40px; height: 100px;"></td>
          <td style="border: 1px solid #000; padding: 40px; height: 100px;"></td>
          <td style="border: 1px solid #000; padding: 40px; height: 100px;"></td>
        </tr>
      </table>
    `;

    return container;
  }

  // Helper methods for formatting data
  private getEducationCheckboxes(data: any): string {
    const educationMapping = {
      1: 'Trung học cơ sở',
      2: 'Trung học phổ thông',
      3: 'Trung cấp',
      4: 'Cao đẳng',
      5: 'Đại học',
      6: 'Trên đại học',
    };

    let html = '<div style="font-size: 10pt; line-height: 1.4;">';
    Object.entries(educationMapping).forEach(([value, label]) => {
      const isSelected =
        data?.EducationSelections?.includes(Number(value)) || false;
      html += `<div style="margin-bottom: 2px;">${
        isSelected ? '☑' : '☐'
      } ${label}</div>`;
    });
    html += '</div>';
    return html;
  }

  private getGenderText(data: any): string {
    const genderMapping: Record<number, string> = {
      1: 'Nam',
      2: 'Nữ',
      3: 'Không yêu cầu',
    };

    let selectedGenders = [];
    if (data?.GenderSelections && Array.isArray(data.GenderSelections)) {
      data.GenderSelections.forEach((value: number) => {
        if (genderMapping[value]) {
          selectedGenders.push(genderMapping[value]);
        }
      });
    }

    let html = '';
    Object.entries(genderMapping).forEach(([value, label]) => {
      const isSelected =
        data?.GenderSelections?.includes(Number(value)) || false;
      html += `${isSelected ? '☑' : '☐'} ${label} `;
    });

    return html || '☐ Nam ☐ Nữ ☐ Không yêu cầu';
  }

  private getExperienceCheckboxes(data: any): string {
    const experienceMapping = {
      1: 'Không yêu cầu kinh nghiệm',
      2: 'Dưới 1 năm',
      3: 'Từ 1 đến dưới 2 năm',
      4: 'Từ 2 đến dưới 3 năm',
      5: 'Từ 3 đến 5 năm',
      6: 'Trên 5 năm',
    };

    let html = '<div style="font-size: 10pt; line-height: 1.4;">';
    let currentRow: any = [];

    Object.entries(experienceMapping).forEach(([value, label], index) => {
      const isSelected =
        data?.ExperienceSelections?.includes(Number(value)) || false;
      currentRow.push(`${isSelected ? '☑' : '☐'} ${label}`);

      // Create 2 columns layout
      if (
        (index + 1) % 2 === 0 ||
        index === Object.keys(experienceMapping).length - 1
      ) {
        html += `<div style="margin-bottom: 2px; display: flex;">`;
        html += `<div style="width: 50%; margin-right: 10px;">${
          currentRow[0] || ''
        }</div>`;
        html += `<div style="width: 50%;">${currentRow[1] || ''}</div>`;
        html += `</div>`;
        currentRow = [];
      }
    });

    html += '</div>';
    return html;
  }

  private getLanguageSection(data: any): string {
    let html = '<div style="font-size: 10pt; line-height: 1.4;">';

    // English section
    html += '<div style="margin-bottom: 10px;">';
    html +=
      '<div style="font-weight: bold; margin-bottom: 5px;">+ Tiếng Anh:</div>';

    const englishLevels = ['Level A', 'Level B', 'Level C', 'Không cần thiết'];
    const selectedEnglish = data?.EnglishLevel || '';

    englishLevels.forEach((level) => {
      const isSelected = selectedEnglish === level;
      html += `<span style="margin-right: 15px;">${
        isSelected ? '☑' : '☐'
      } ${level}</span>`;
    });
    html += '</div>';

    // Other language section
    html += '<div style="margin-bottom: 5px;">';
    const otherLanguage = data?.OtherLanguage || '';
    html += `<div style="font-weight: bold; margin-bottom: 5px;">+ Khác ${
      otherLanguage ? otherLanguage : '________________'
    }:</div>`;

    const selectedOther = data?.OtherLanguageLevel || '';
    englishLevels.forEach((level) => {
      const isSelected = selectedOther === level;
      html += `<span style="margin-right: 15px;">${
        isSelected ? '☑' : '☐'
      } ${level}</span>`;
    });
    html += '</div>';

    html += '</div>';
    return html;
  }

  private getComputerSkillsSection(data: any): string {
    let html = '<div style="font-size: 10pt; line-height: 1.4;">';

    const skills = [
      { key: 'SkillWord', name: 'Word' },
      { key: 'SkillPowerpoint', name: 'Powerpoint' },
      { key: 'SkillOutlook', name: 'Outlook' },
      { key: 'SkillExcel', name: 'Excel' },
      { key: 'SkillInternet', name: 'Internet' },
    ];

    // First row
    skills.slice(0, 3).forEach((skill) => {
      const isSelected = data?.[skill.key] || false;
      html += `<span style="margin-right: 15px;">${isSelected ? '☑' : '☐'} ${
        skill.name
      }</span>`;
    });

    html += '<br><br>';

    // Second row
    skills.slice(3).forEach((skill) => {
      const isSelected = data?.[skill.key] || false;
      html += `<span style="margin-right: 15px;">${isSelected ? '☑' : '☐'} ${
        skill.name
      }</span>`;
    });

    html += ` Khác: ${data?.SkillOther || 'Cơ bản'}____________________`;
    html += '</div>';

    return html;
  }

  private getHealthSection(data: any): string {
    let html = '<div style="font-size: 10pt; line-height: 1.6;">';

    const needPhysical = data?.NeedPhysical || false;
    const needSpecialStrength = data?.NeedSpecialStrength || false;
    const ensureHealth = data?.EnsureHealth || false;

    html += `<div style="margin-bottom: 8px;">${
      needPhysical ? '☑' : '☐'
    } Cần thể hình: Cao:>1.6 m; Nặng:>50 kg`;
    if (needPhysical && data?.PhysicalNote) {
      html += `<br>&nbsp;&nbsp;&nbsp;&nbsp;Ghi chú: ${data.PhysicalNote}`;
    }
    html += `</div>`;

    html += `<div style="margin-bottom: 8px;">${
      needSpecialStrength ? '☑' : '☐'
    } Cần sức lực đặc biệt`;
    if (needSpecialStrength && data?.StrengthNote) {
      html += `<br>&nbsp;&nbsp;&nbsp;&nbsp;Ghi chú: ${data.StrengthNote}`;
    }
    html += `</div>`;

    html += `<div style="margin-bottom: 8px;">${
      ensureHealth ? '☑' : '☐'
    } Sức khỏe đủ đảm bảo cho công việc.`;
    if (ensureHealth && data?.HealthNote) {
      html += `<br>&nbsp;&nbsp;&nbsp;&nbsp;Ghi chú: ${data.HealthNote}`;
    }
    html += `</div>`;

    html += '</div>';
    return html;
  }

  private getCommunicationSection(data: any): string {
    const commItems = [
      { key: 'CommNoneExternal', text: 'Không cần giao tiếp với bên ngoài' },
      {
        key: 'CommInternal',
        text: 'Cần giao tiếp với nhiều người trong Công ty',
      },
      {
        key: 'CommDomesticCustomer',
        text: 'Cần giao tiếp với khách hàng trong nước',
      },
      {
        key: 'CommForeignCustomer',
        text: 'Cần giao tiếp với khách hàng nước ngoài. Đặc biệt là nước:',
      },
      {
        key: 'CommMedia',
        text: 'Cần tiếp xúc với các cơ quan báo đài, truyền thông',
      },
      {
        key: 'CommAuthorities',
        text: 'Cần tiếp xúc với các cấp chính quyền địa phương, trung ương',
      },
    ];

    let html = '<div style="font-size: 10pt; line-height: 1.6;">';

    commItems.forEach((item) => {
      const isChecked = data?.[item.key] === true || data?.[item.key] === 1;
      html += `<div style="margin-bottom: 8px;">${isChecked ? '☑' : '☐'} ${
        item.text
      }`;

      if (item.key === 'CommForeignCustomer') {
        const country = data?.CommForeignCountry || '';
        if (country) {
          html += ` ${country}`;
        } else {
          html +=
            '<br>&nbsp;&nbsp;&nbsp;&nbsp;......................................................................................';
        }
      }

      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  // Thêm method cho Appearance
  private getAppearanceCheckboxes(data: any): string {
    const appearanceMapping = {
      1: 'Không yêu cầu',
      2: 'Tương đối',
      3: 'Quan trọng',
    };

    let html = '<div style="line-height: 1.3;">';
    Object.entries(appearanceMapping).forEach(([value, label]) => {
      const isSelected =
        data?.AppearanceSelections?.includes(Number(value)) || false;
      html += `${isSelected ? '☑' : '☐'} ${label}<br>`;
    });
    html += '</div>';
    return html;
  }

  private formatJobDescription(description: string): string {
    if (!description) {
      return `- Nhận, đọc bản vẽ theo thiết kế.( Bản vẽ điện & cơ khí ).

- Lên kế hoạch triển khai lắp ráp điện theo bản vẽ.

- Có kiến thức về các thiết bị đo lường cơ khí, hiệu chỉnh máy và lắp rắp các chi tiết máy, JIG, đồ gá.

- Layout điện khí máy hoàn chỉnh theo bản vẽ.

- Hiểu biết cơ bản lập trình PLC,HMI, lập trình máy công nghiệp.

- Tham gia lắp ráp, lắp đặt máy tại nhà máy khách hàng.

- Hiểu biết thiết bị điện tư động hóa sensor, servo, Inverter..vv

- Thực hiện các công việc liên quan theo yêu cầu của cấp quản lý`;
    }
    return description.replace(/\n/g, '\n\n');
  }

  private formatSalaryRange(data: any): string {
    const min = data?.SalaryMin;
    const max = data?.SalaryMax;

    if (min && max) {
      return `${Number(min).toLocaleString('vi-VN')} -- ${Number(
        max
      ).toLocaleString('vi-VN')}`;
    } else if (min) {
      return `${Number(min).toLocaleString('vi-VN')}+`;
    } else if (max) {
      return `Đến ${Number(max).toLocaleString('vi-VN')}`;
    } else {
      return '8.000.000 -- 13.000.000';
    }
  }

  private formatAgeRange(data: any): string {
    const min = data?.AgeMin;
    const max = data?.AgeMax;

    if (min && max) {
      return `${min}-${max}`;
    } else if (min) {
      return `${min}+`;
    } else if (max) {
      return `Đến ${max}`;
    } else {
      return '22-30';
    }
  }
}
