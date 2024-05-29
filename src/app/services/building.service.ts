import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildingService {

  private buildingURL = 'http://localhost:32800/api/v2/buildings';

  constructor(private _http: HttpClient) { }

  getBuildings(): Observable<any> {
    return this._http.get(this.buildingURL);
  }
}
