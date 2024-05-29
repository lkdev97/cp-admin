import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccesspointService {

  private accessPointsURL = 'http://localhost:3000/accesspoints' 

  constructor(private _http: HttpClient) { }

  getAccessPoints(): Observable<any> {
    return this._http.get(this.accessPointsURL);
  }

  addAccesspoint(accessPointData: any): Observable<any> {
    return this._http.post(this.accessPointsURL, accessPointData);
  }
}
