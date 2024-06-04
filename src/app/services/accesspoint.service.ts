import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccessPoint } from '../models/accesspoint';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccesspointService {

  private accessPointsURL = `${environment.accessPointService}/accesspoints`

  constructor(private _http: HttpClient) { }

  getAccessPoints(): Observable<AccessPoint[]> {
    return this._http.get<AccessPoint[]>(this.accessPointsURL);
  }

  addAccesspoint(accessPointData: AccessPoint): Observable<AccessPoint> {
    return this._http.post<AccessPoint>(this.accessPointsURL, accessPointData);
  }

  buildAccessPoint(bssid: String, ssid: String, lat: number, lng: number, floor: number, description: String): AccessPoint {
    return {
      bssid,
      ssid,
      lat,
      lng,
      floor,
      description,
      //building
    };
  }

  filterAccessPointsByFloor(accessPoints: any, floorLevel: String): AccessPoint[] {
    return accessPoints.filter((x: AccessPoint) => x.floor.toString() === floorLevel.toString()).map(({ id, building, ...rest }: { id: any, building: any, [key: string]: any }) => ({ ...rest }));
  }
}
