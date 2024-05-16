import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  private apiURL = 'http://localhost:32800/api/v2/buildings';
  private cpURL = 'http://localhost:32811/calibrationPoints'; //
  buildings: any[] = [];
  private map!: L.Map;
  private currentPolygon: L.Polygon | null = null;
  private centerLatLng : L.LatLngExpression = [50.58693, 8.68239];
  private circles: any[] = [];
  isVisible: boolean = false;
  selectedBuilding: String = '';
  selectedFloor: String = '';
  
  
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.initMap();
  }

  ionViewDidEnter() {
    this.getBuildings().subscribe(
      (data: any) => {
        console.log('Data:', data);
  
        const buildings = data?.buildings?.content;
  
        if (buildings && buildings.length > 0) {
          buildings.forEach((building: any) => {
            if (building.shell && building.shell.points) {
              const buildingCoordinates: L.LatLngExpression[] = building.shell.points.map((point: any) => [point.lat, point.lng]);
              const polygon = L.polygon(buildingCoordinates, { color: 'blue', weight: 1 }).addTo(this.map);
  
              polygon.on('click', () => {
                this.map.setView(buildingCoordinates[0], 20);
                console.log(`clicked on building ${building.name}`);
                console.log(`Building: "${building.levels}`);
                this.loadFloorButtons(building);
                this.getCalibrationPoints().subscribe((calibrationPoint: any) => {
                  this.selectedFloor = "0";
                  this.selectedBuilding = building.name;
                  this.drawRooms(building, 0, calibrationPoint.filter((calibrationPoint: any) => calibrationPoint.building.includes(building.name.replace(/\s/g, '')))); 
                });
              });
  
              polygon.on('mouseover', function () {
                polygon.setStyle({ color: 'rgba(0, 0, 255, 0.7)' });
              });
  
              polygon.on('mouseout', function () {
                polygon.setStyle({ color: 'blue' });
              });
            }
          });
        }
      },
    );
  }

  initMap() {
    this.map = L.map('map').setView(this.centerLatLng, 19);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 22,
      maxNativeZoom: 19
    }).addTo(this.map);
  
    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);
  
    const markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41] 
    });
  
    L.marker([50.58693, 8.68239], { icon: markerIcon }).addTo(this.map)
      .bindPopup('THM, Gießen')
      .openPopup();
  }

  removeCalibrationPoints(): void {
    if (this.circles) {
      this.circles.forEach(x => {
        this.map.removeLayer(x);
      });
      this.circles = [];
    }
  }
  drawRooms(building: any, selectedLevel: number, calibrationPoints: any): void {
    const selectedFloor = building.levels.find((level: any) => level.level === selectedLevel);
    if (!selectedFloor) {
      console.error(`Level ${selectedLevel} not found for the building.`);
      return;
    }
    //const calibrationPointByFloor = calibrationPoints.filter((x: any) => x.floor === selectedLevel);
    this.isVisible = true;

    const rooms = selectedFloor.rooms;

    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
    }
    this.removeCalibrationPoints();

    const roomCoordinates: L.LatLngExpression[][] = rooms.map((room: any) =>
      room.points.map((point: any) => [point.lat, point.lng])
    );
    
    this.currentPolygon = L.polygon(roomCoordinates, { color: 'grey' }).addTo(this.map);
    
    calibrationPoints.filter((x: any) => x.floor === selectedLevel).forEach((data: any) => {
      const circle = L.circle([data.lat, data.lng], 0.5, { color: 'yellow', fillOpacity: 1 })
      .addTo(this.map)
      .bindPopup(`ID: ${data.id} <br> Latitude: ${data.lng} <br> Longitude: ${data.lng} <br> <ion-button fill="clear"><ion-icon name="create-outline"></ion-icon></ion-button><ion-button fill="clear"><ion-icon name="trash-outline"></ion-icon></ion-button>`)
      .on('click', (e) => {
        console.log("clicked calibrationpoint: ", e.target);
        e.target.openPopup();
      });
      this.circles.push(circle);
    });

  }

  loadFloorButtons(building: any) {
    const floorButtonsContainer = document.getElementById('floor-buttons');
    if (!floorButtonsContainer) return;

    floorButtonsContainer.innerHTML = '';
    building.levels.forEach((level: any, index: number) => {
      const button = document.createElement('ion-button');
      button.setAttribute("id", `${index}`);
      button.innerText = `OG ${index}`;
      button.addEventListener('click', () => {
        console.log(`Floor ${index}`);
        this.getCalibrationPoints().subscribe((calibrationPoint: any) => {
          this.selectedFloor = level.level;
          this.selectedBuilding = building.name;
          this.drawRooms(building, level.level, calibrationPoint.filter((calibrationPoint: any) => calibrationPoint.building.includes(building.name.replace(/\s/g, ''))));
          //button.disabled = true; // TODO
        });
        
      });
      floorButtonsContainer.appendChild(button);
    });
  }

  clearRooms() {
    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
      this.currentPolygon = null;
      const btns = document.getElementById('floor-buttons');
      if (!btns) return;
      btns.innerHTML = '';
      this.isVisible = false;
      this.centerView();
      this.removeCalibrationPoints();
    }
  }

  centerView() {
    this.map.setView(this.centerLatLng, 19);
  }

  getBuildings(): Observable<any> {
    return this.http.get(this.apiURL);
  }

  getCalibrationPoints(): Observable<any> {
    return this.http.get(this.cpURL);
  }
}
