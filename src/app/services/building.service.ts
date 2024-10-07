import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to manage all operations with building, communicate with the backendservice via http
 */
export class BuildingService {

  private buildingURL = `${environment.buildingService}/buildings`; // url from the http endpoint of the backendservice

  constructor(private _http: HttpClient) { }

  /**
   * call get from the backendservice to receive object with all buildings
   * @GET
   * @returns list of all buildings
   */
  getBuildings(): Observable<any> {
    return this._http.get(this.buildingURL);
  }
}
