import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccessPoint } from '../models/accesspoint';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to manage all operations with accesspoints, communicate with the backendservice via http
 */
export class AccesspointService {

  private accessPointsURL = `${environment.accessPointService}/accesspoints` // url from the http endpoint of the backendservice

  constructor(private _http: HttpClient) { }

  /**
   * call get from the backendservice to receive all accesspoints
   * @GET 
   * @returns list of all accesspoints
   */
  getAccessPoints(): Observable<AccessPoint[]> {
    return this._http.get<AccessPoint[]>(this.accessPointsURL);
  }

  /**
   * add new accesspoint in the backendservice
   * @POST
   * @param accessPointData data of the new accesspoint
   * @returns the new accesspoint
   */
  addAccesspoint(accessPointData: AccessPoint): Observable<AccessPoint> {
    return this._http.post<AccessPoint>(this.accessPointsURL, accessPointData);
  }

  /**
   * helper function to build an accesspoint object
   * @param bssid 
   * @param ssid 
   * @param lat 
   * @param lng 
   * @param floor 
   * @param description 
   * @returns the build accesspoint
   */
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

  /**
   * helper function to filter given accesspoints by floor and building
   * @param accessPoints 
   * @param floorLevel 
   * @param building 
   * @returns list of the filtered accesspoints
   */
  filterAccessPoints(accessPoints: any, floorLevel: String, building: String): AccessPoint[] {
    return accessPoints.filter((x: any) => x.floor.toString() === floorLevel.toString() && x.building == building).map(({ id, building, ...rest }: { id: any, building: any, [key: string]: any }) => ({ ...rest }));
  }
}
