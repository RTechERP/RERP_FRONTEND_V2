import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentOrder } from './model/payment-order';

@Injectable({
    providedIn: 'root'
})
export class PaymentOrderService {

    private url = environment.host + 'api/paymentorder';

    // ====== 1. Danh sách chữ số ======
    private ChuSo = [
        'không',
        'một',
        'hai',
        'ba',
        'bốn',
        'năm',
        'sáu',
        'bảy',
        'tám',
        'chín'
    ];

    // ====== 2. Đơn vị tiền ======
    private currencyMap = new Map<string, CurrencyConfig>(
        CURRENCY_CONFIGS.map(c => [c.id, c])
    );

    constructor(private http: HttpClient) { }

    get(data: any): Observable<any> {
        return this.http.post<any>(this.url, data);
    }

    getDetail(id: number): Observable<any> {
        return this.http.get<any>(this.url + `/${id}`);
    }

    save(payment: any): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, payment);
    }

    uploadFile(files: File[], paymentOrderID: number, paymentOrderFileID: string): Observable<any> {
        const formData = new FormData();
        if (files) {
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });
        }

        formData.append('PaymentOrderID', paymentOrderID.toString());
        formData.append('PaymentOrderFile', paymentOrderFileID.toString());
        return this.http.post<any>(`${this.url}/upload-file`, formData);
    }
// Thêm vào payment-order.service.ts
getDataFromPONCC(ponccID: number): Observable<any> {
    return this.http.get<any>(`${this.url}/get-data-from-poncc/${ponccID}`);
}
    uploadFileBankslip(files: File[], paymentOrderID: string): Observable<any> {
        const formData = new FormData();
        if (files) {
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });
        }

        formData.append('PaymentOrderID', paymentOrderID);
        return this.http.post<any>(`${this.url}/upload-file-bankslip`, formData);
    }

    appovedTBP(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/appoved-tbp`, data);
    }

    appovedHR(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/appoved-hr`, data);
    }

    appovedKTTT(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/appoved-kttt`, data);
    }

    appovedKTT(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/appoved-ktt`, data);
    }

    appovedBGD(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/appoved-bgd`, data);
    }

    uploadFiles(file: any): Observable<any> {
        return this.http.post<any>(`${this.url}/upload-file`, file);
    }

    getDataCombo(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-data-combo`);
    }

    // ====== 4. Đọc 3 chữ số ======
    private readThreeDigits(num: number): string {
        let tram = Math.floor(num / 100);
        let chuc = Math.floor((num % 100) / 10);
        let donvi = num % 10;
        let result = '';

        if (tram > 0) {
            result += this.ChuSo[tram] + ' trăm';
            if (chuc === 0 && donvi > 0) result += ' lẻ';
        }

        if (chuc > 1) {
            result += ' ' + this.ChuSo[chuc] + ' mươi';
            if (donvi === 1) result += ' mốt';
            else if (donvi === 5) result += ' lăm';
            else if (donvi > 0) result += ' ' + this.ChuSo[donvi];
        } else if (chuc === 1) {
            result += ' mười';
            if (donvi === 1) result += ' một';
            else if (donvi === 5) result += ' lăm';
            else if (donvi > 0) result += ' ' + this.ChuSo[donvi];
        } else if (chuc === 0 && donvi > 0 && tram === 0) {
            result += this.ChuSo[donvi];
        }

        return result.trim();
    }

    // ====== 5. HÀM CHÍNH đọc tiền ======
    readMoney(value: number | string, currencyId: string): string {
        const amount = Number(value);
        if (isNaN(amount)) return '';

        const currency = this.currencyMap.get(currencyId.toLowerCase());
        if (!currency) return '';

        const integerPart = Math.floor(amount);
        const decimalPart = Math.round((amount - integerPart) * 100);

        let result = '';

        // --- phần nguyên
        if (integerPart === 0) {
            result = 'Không ' + currency.unit;
        } else {
            let temp = integerPart;
            let i = 0;
            const units = ['', ' nghìn', ' triệu', ' tỷ'];
            let text = '';

            while (temp > 0) {
                const block = temp % 1000;
                if (block > 0) {
                    text =
                        this.readThreeDigits(block) +
                        units[i] +
                        (text ? ' ' + text : '');
                }
                temp = Math.floor(temp / 1000);
                i++;
            }

            result =
                text.charAt(0).toUpperCase() +
                text.slice(1) +
                ' ' +
                currency.unit;
        }

        // --- phần lẻ
        if (decimalPart > 0 && currency.subUnit) {
            result +=
                ' và ' +
                this.readThreeDigits(decimalPart) +
                ' ' +
                currency.subUnit;
        }

        return result;
    }
}


export interface CurrencyConfig {
    id: string;          // vnd, usd...
    text: string;        // VND, USD (hiển thị combo)
    unit: string;        // đồng, đô la
    subUnit?: string;    // xu, cent...
}

export const CURRENCY_CONFIGS: CurrencyConfig[] = [
    { id: 'vnd', text: 'VND', unit: 'đồng', subUnit: 'xu' },
    { id: 'usd', text: 'USD', unit: 'đô', subUnit: 'cent' },
    { id: 'eur', text: 'EURO', unit: 'euro', subUnit: 'cent' },
    { id: 'jpy', text: 'JPY', unit: 'yên', subUnit: 'sen' },
    { id: 'sgd', text: 'SGD', unit: 'đô', subUnit: 'cent' },
    { id: 'cny', text: 'CNY', unit: 'nhân dân tệ', subUnit: '' },
    { id: 'inr', text: 'INR', unit: 'rupee', subUnit: 'paise' }
];
