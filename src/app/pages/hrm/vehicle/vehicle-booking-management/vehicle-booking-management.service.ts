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
}


