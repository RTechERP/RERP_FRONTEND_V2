import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class NewsletterService {
    private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
    constructor(private http: HttpClient) { }

    // Newsletter Type methods
    saveNewsletterType(newsletterType: any): Observable<any> {
        return this.http.post<any>(
            this._url + 'newslettertype/save-data',
            newsletterType
        );
    }

    getNewsletterType(): Observable<any> {
        return this.http.get<any>(
            this._url + `newslettertype`
        );
    }

    // Newsletter methods
    saveNewsletter(newsletterDTO: any): Observable<any> {
        return this.http.post<any>(
            this._url + 'newsletter/save-data',
            newsletterDTO
        );
    }

    getNewsletter(params: any): Observable<any> {
        return this.http.post<any>(
            this._url + 'newsletter',
            params
        );
    }

    getNewsletterFiles(newsletterId: number): Observable<any> {
        return this.http.get<any>(
            this._url + `newsletter/files/${newsletterId}`
        );
    }

    getNewsletterById(id: number): Observable<any> {
        return this.http.get<any>(
            this._url + `newsletter/${id}`
        );
    }

    deleteNewsletter(id: number): Observable<any> {
        return this.http.post<any>(
            this._url + `newsletter/delete/${id}`,
            {}
        );
    }

    // Upload methods using upload-multiple API
    uploadNewsletterImage(file: File): Observable<any> {
        return this.uploadMultipleFiles([file], 'Newsletter', 'images');
    }

    uploadNewsletterFiles(files: File[]): Observable<any> {
        return this.uploadMultipleFiles(files, 'Newsletter', 'files');
    }

    uploadFile(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(
            this._url + `Newsletter/UploadFile?id=${id}`,
            formData
        );
  }
  uploadMultipleFiles(files: File[], key?: string, subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', key || 'Newsletter');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }


  // Get newsletter by ID
  getNewsletterByID(id: number): Observable<any> {
    return this.http.post<any>(
      this._url + `newsletter/get-newsletter-by-id?id=${id}`,
      {}
    );
  }

  // Get newsletter files by newsletter ID
  getNewsletterFileByNewsletterID(newsletterId: number): Observable<any> {
    return this.http.post<any>(
      this._url + `newsletter/get-newsletter-file-by-newsletterid?newsletterid=${newsletterId}`,
      {}
    );
  }

  // Delete newsletter files by IDs (comma-separated string)
  deleteNewsletterFolderByID(ids: string): Observable<any> {
    return this.http.post<any>(
      this._url + `newsletter/delete-newsletter-folder-by-id?ids=${ids}`,
      {}
    );
  }

  // Download file
  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${environment.host}api/home/download`, {
      params,
      responseType: 'blob',
    });
  }

}
