import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalibrationPoint, Fingerprint, WifiData } from '../models/calibrationpoint';
import { AccessPoint } from '../models/accesspoint';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to manage all operations with calibrationpoints, communicate with the backendservice via http
 */
export class CalibrationpointService {

  private calibrationPointURL = `${environment.calibrationPointService}/calibrationPoints`; // url from the http endpoint of the backendservice

  constructor(private _http: HttpClient) { }

  /**
   * call get from the backendservice to receive object with all calibrationpoints
   * @GET
   * @returns list of all calibrationpoints
   */
  getCalibrationPoints(): Observable<CalibrationPoint> {
    return this._http.get<CalibrationPoint>(this.calibrationPointURL);
  }

  /**
   * add new calibrationpoint in the backendservice
   * @POST
   * @param newCalibrationPoint new calibrationpoint that will be added in the backendservice
   * @returns status msg from the server
   */
  addCalibrationPoint(newCalibrationPoint: any): Observable<any> {
    return this._http.post(this.calibrationPointURL, newCalibrationPoint, { responseType: 'text' });
  }

  /**
   * delete calibrationpoint by id
   * @DELETE
   * @param calibrationPointID 
   * @returns status msg from the server
   */
  removeCalibrationPoint(calibrationPointID: number): Observable<any> {
    return this._http.delete(`${this.calibrationPointURL}/${calibrationPointID}`, { responseType: 'text' });
  }

  /**
   * edit a calibrationpoint
   * @PUT
   * @param calibrationPointData edited calibrationpoint
   * @returns status msg from server
   */
  editCalibrationPoint(calibrationPointData: any): Observable<any> {
    return this._http.put(`${this.calibrationPointURL}/${calibrationPointData.id}`, calibrationPointData, { responseType: 'text' })
  }

  /**
   * helper function to build an calibrationpoint object
   * @param lat 
   * @param lng 
   * @param floor 
   * @param building 
   * @param fingerprint 
   * @returns 
   */
  buildCalibrationPoint(lat: number, lng: number, floor: String, building: String, fingerprint: Fingerprint[]): CalibrationPoint {
    return {
      lat,
      lng,
      floor,
      building,
      fingerprints: fingerprint
    };
  }

  /**
   * helper function to build an fingerprint object
   * @param azimuthInDegrees 
   * @param wifiData 
   * @param accessPoints 
   * @returns 
   */
  buildFingerprint(azimuthInDegrees: number, wifiData: WifiData[], accessPoints: AccessPoint[]): Fingerprint {
    return {
      azimuthInDegrees,
      wifiData,
      accessPoints
    }
  }

  /**
   * helper function to build an wifidata object
   * @param bssid 
   * @param frequency 
   * @param level 
   * @param timestamp 
   * @returns 
   */
  buildWifiData(bssid: String, frequency: number, level: number, timestamp: number): WifiData {
    return {
      bssid,
      frequency,
      level,
      timestamp
    }
  }

  /**
   * helper function to add an fingerprint at calibrationpoint object in calibrationpoint
   * @param cp 
   * @param fingerprint 
   */
  addFingerprints(cp: CalibrationPoint, fingerprint: Fingerprint) {
    cp.fingerprints.push(fingerprint);
  }

  /**
   * helper function to add an wifidata at fingerprint object in calibrationpoint
   * @param cp 
   * @param wifiData 
   * @param azimuthInDegrees 
   */
  addWifiData(cp: CalibrationPoint, wifiData: WifiData, azimuthInDegrees: number): void {
    cp.fingerprints.push({
      azimuthInDegrees: azimuthInDegrees,
      wifiData: [wifiData],
      accessPoints: []
    });
  }

  /**
   * helper function to add an accesspoint in the calibrationpoint object
   * @param cp 
   * @param accessPoint 
   * @param index 
   */
  addAccessPoint(cp: CalibrationPoint, accessPoint: AccessPoint, index: number): void {
    cp.fingerprints[index].accessPoints.push(accessPoint);
  }
}
