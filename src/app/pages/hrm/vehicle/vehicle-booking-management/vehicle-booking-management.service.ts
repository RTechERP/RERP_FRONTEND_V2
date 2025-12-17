import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class VehicleBookingManagementService {

  private url = `${environment.host}api/vehiclebookingmanagement/`;
  constructor(private http: HttpClient) { }

  getVehicleBookingManagement(request: any) {
    return this.http.post<any>(`${this.url + `get-vehicle-booking-management`}`, request);
  }
  getVehicleSchedule(request: any) {
    return this.http.post<any>(`${this.url + `get-vehicle-schedule`}`, request);
  }
  getListImage(request: any[]) {
    return this.http.post<any[]>(`${this.url + `get-list-image`}`, request);
  }

  postVehicleBookingManagement(request: any) {
    return this.http.post<any>(`${this.url + `save-data`}`, request);
  }

  createVehicleBooking(request: any) {
    return this.http.post<any>(`${this.url + `create`}`, request);
  }

  approveBooking(request: any) {
    return this.http.post<any>(`${this.url + `save-data`}`, request);
  }
  getVehicleManagement() {
    return this.http.get<any>(`${this.url + `get-vehicle`}`);
  }

  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),

    }));

  }

  getEmployee() {
    return this.http.get<any>(`${this.url + `get-employees`}`);
  }

  getEmployeeById(id: number) {
    return this.http.get<any>(`${this.url + `get-employee-by-id`}`, { params: { employeeId:id } });
  }

  // Get provinces for arrival (tỉnh đến)
  getProvinceArrives(employeeId: number = 0) {
    return this.http.get<any>(`${this.url + `get-province-arrives`}`, { params: { employeeId: employeeId } });
  }

  // Get provinces for departure (điểm xuất phát)
  getProvinceDeparture(employeeId: number = 0) {
    return this.http.get<any>(`${this.url + `get-province-departure`}`, { params: { employeeId: employeeId } });
  }

  // Get projects
  getProjects() {
    return this.http.get<any>(`${this.url + `get-projects`}`);
  }

  // Get approved list (người duyệt)
  getApprovedList() {
    return this.http.get<any>(`${this.url + `get-approved-list`}`);
  }

  // Upload files for vehicle booking
  uploadFiles(vehicleBookingId: number, files: FormData) {
    return this.http.post<any>(`${this.url + `upload-file`}?vehicleBookingId=${vehicleBookingId}`, files);
  }

  // Get images for vehicle booking
  getImages(vehicleBookingId: number) {
    return this.http.get<any>(`${this.url + `get-files`}`, { params: { vehicleBookingId: vehicleBookingId } });
  }

  // Remove file
  removeFile(fileIds: number[]) {
    return this.http.post<any>(`${this.url + `remove-file`}`, fileIds);
  }

  // Send email notification
  sendEmail(bookingData: any) {
    return this.http.post<any>(`${this.url + `send-email`}`, bookingData);
  }

  // Cancel booking (Đăng ký hủy)
  cancelBooking(vehicleBookingId: number) {
    return this.http.post<any>(`${this.url + `vehicle-booking-cancel`}`,   vehicleBookingId  );
  }
}


