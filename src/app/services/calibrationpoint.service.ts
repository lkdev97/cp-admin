import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalibrationpointService {

  private calibrationPointURL = 'http://localhost:32811/calibrationPoints';

  constructor(private _http: HttpClient) { }

  getCalibrationPoints(): Observable<any> {
    return this._http.get(this.calibrationPointURL);
  }

  addCalibrationPoint(newCalibrationPoint: any): Observable<any> {
    return this._http.post(this.calibrationPointURL, newCalibrationPoint, { responseType: 'text' });
  }

  removeCalibrationPoint(calibrationPointID: number): Observable<any> {
    return this._http.delete(`${this.calibrationPointURL}/${calibrationPointID}`, { responseType: 'text' });
  }

  editCalibrationPoint(calibrationPointID: number, calibrationPointData: any): Observable<any> {
    return this._http.put(`${this.calibrationPointURL}/${calibrationPointID}`, calibrationPointData, { responseType: 'text' })
  }
}
