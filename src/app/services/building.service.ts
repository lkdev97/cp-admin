import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BuildingService {

  private buildingURL = `${environment.buildingService}/buildings`;

  constructor(private _http: HttpClient) { }

  getBuildings(): Observable<any> {
    return this._http.get(this.buildingURL);
  }
}
