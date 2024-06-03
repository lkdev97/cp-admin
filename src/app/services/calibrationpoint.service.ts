import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalibrationPoint, Fingerprint, WifiData } from '../models/calibrationpoint';
import { AccessPoint } from '../models/accesspoint';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalibrationpointService {

  private calibrationPointURL = `${environment.calibrationPointService}/calibrationPoints`;

  constructor(private _http: HttpClient) { }

  getCalibrationPoints(): Observable<CalibrationPoint> {
    return this._http.get<CalibrationPoint>(this.calibrationPointURL);
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

  buildCalibrationPoint(lat: number, lng: number, floor: String, building: String, fingerprint: Fingerprint[]): CalibrationPoint {
    return {
      lat,
      lng,
      floor,
      building,
      fingerprints: fingerprint
    };
  }

  buildFingerprint(azimuthInDegrees: number, wifiData: WifiData[], accessPoints: AccessPoint[]) {
    return {
      azimuthInDegrees,
      wifiData,
      accessPoints
    }
  }

  addFingerprints(cp: CalibrationPoint, fingerprint: Fingerprint) {
    cp.fingerprints.push(fingerprint);
  }

  addWifiData(cp: CalibrationPoint, wifiData: WifiData, azimuthInDegrees: number): void {
    cp.fingerprints.push({
      azimuthInDegrees: azimuthInDegrees,
      wifiData: [wifiData],
      accessPoints: []
    });
  }

  addAccessPoint(cp: CalibrationPoint, accessPoint: AccessPoint, index: number): void {
    cp.fingerprints[index].accessPoints.push(accessPoint);
  }
}
