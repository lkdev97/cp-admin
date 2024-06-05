import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccesspointValidatorService } from '../validators/accesspoint-validator.service';
import { BuildingService } from '../services/building.service';
import { CalibrationpointService } from '../services/calibrationpoint.service';
import { AccesspointService } from '../services/accesspoint.service';
import { CalibrationPoint, Fingerprint, WifiData } from '../models/calibrationpoint';
import { AccessPoint } from '../models/accesspoint';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  buildings: any[] = [];
  private map!: L.Map;
  private currentPolygon: L.Polygon | null = null;
  private centerLatLng : L.LatLngExpression = [50.58693, 8.68239];
  private circles: any[] = [];
  private accessPointCircles: any[] = [];
  private selectedAccessPointCircles: any[] = [];
  isVisible: boolean = false;
  selectedBuilding: String = '';
  selectedFloor: String = '';
  calibrationPoints: any[] = [];
  accesspointForm: FormGroup;
  accessPoints: any[] = [];
  

  constructor(private modalController: ModalController, 
    private fb: FormBuilder, 
    private _buildingService: BuildingService, 
    private _accessPointService: AccesspointService,
    private _calibrationPointService: CalibrationpointService) {
    this.accesspointForm = this.fb.group({
      bssid: ['', [Validators.required, AccesspointValidatorService.bssidValidator]],
      ssid: ['', Validators.required],
      lat: ['', [Validators.required, AccesspointValidatorService.latitudeValidator]],
      lng: ['', [Validators.required, AccesspointValidatorService.longitudeValidator]],
      description: [''],
      floor: [''],
      building: ['']
    });
   }

  ngOnInit() {
    this.initMap();
  }

  ionViewDidEnter() {
    this._buildingService.getBuildings().subscribe(
      (data: any) => {
        console.log('Data:', data);
  
        this.buildings = data?.buildings?.content;
  
        if (this.buildings && this.buildings.length > 0) {
          this.buildings.forEach((building: any) => {
            if (building.shell && building.shell.points) {
              const buildingCoordinates: L.LatLngExpression[] = building.shell.points.map((point: any) => [point.lat, point.lng]);
              const polygon = L.polygon(buildingCoordinates, { color: 'blue', weight: 1 })
                .addTo(this.map)
                .on('click', () => {
                  this.map.setView(buildingCoordinates[0], 20);
                  console.log(`clicked on building ${building.name}`);
                  console.log(`Building: "${building.levels}`);
                  this.loadFloorButtons(building);
                  this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
                    this.selectedFloor = "0";
                    this.selectedBuilding = building.name.replace(/\s/g, '');
                    this.drawRooms(building, 0); 
                    this.drawCalibrationPoints(0, calibrationPoints);
                    this.drawAccessPoints();
                  });
                })
                .on('mouseover', function () {
                  polygon.setStyle({ color: 'rgba(0, 0, 255, 0.7)' });
                })
                .on('mouseout', function () {
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

  drawAccessPoints(): void {
    const wifiIcon = L.icon({
      iconUrl: './assets/icon/wifi-outline.png',
      iconSize: [20, 20],
    });
  
    this.removeAccessPoints();
    this._accessPointService.getAccessPoints().subscribe((accessPoints: AccessPoint[]) => {
      this.accessPoints = accessPoints; 
      const filteredAccessPoints = this._accessPointService.filterAccessPoints(accessPoints, this.selectedFloor, this.selectedBuilding);
      filteredAccessPoints.forEach((filteredAccessPoint: any) => {
        const accessPointCircle = L.marker([filteredAccessPoint.lat, filteredAccessPoint.lng], { icon: wifiIcon }).addTo(this.map).bindTooltip(`Accesspoint: ${filteredAccessPoint.bssid}`);
        this.accessPointCircles.push(accessPointCircle);
      })
    });
  }

  drawAccessPoint(latlng: L.LatLngExpression, bssid: number): L.Marker { 
    const wifiIcon = L.icon({
      iconUrl: './assets/icon/wifi-outline.png',
      iconSize: [20, 20],
    });
    return L.marker(latlng, { icon: wifiIcon }).addTo(this.map).bindTooltip(`Accesspoint: ${bssid}`);
  }

  removeAccessPoints(): void {
    this.accessPointCircles.forEach((accessCircle) => { 
      this.map.removeLayer(accessCircle);
    });
    this.accessPointCircles = [];
  }

  drawRooms(building: any, selectedLevel: number): void {
    const selectedFloor = building.levels.find((level: any) => level.level === selectedLevel);
    if (!selectedFloor) {
      console.error(`Level ${selectedLevel} not found for the building.`);
      return;
    }

    this.accesspointForm.patchValue({
      floor: this.selectedFloor,
      building: this.selectedBuilding
    });

    this.isVisible = true;
    const rooms = selectedFloor.rooms;

    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
    }

    const roomCoordinates: L.LatLngExpression[][] = rooms.map((room: any) =>
      room.points.map((point: any) => [point.lat, point.lng])
    );
    
    this.currentPolygon = L.polygon(roomCoordinates, { color: 'grey'})
      .addTo(this.map)
      .on('click', (e) => {
        e.target.bindPopup(`Add new Calibrationpoint! <br>Building: ${this.selectedBuilding}<br>Floor: ${this.selectedFloor} <br> Latitude: ${e.latlng.lat} <br> Longitude: ${e.latlng.lng} <br> <ion-button id="closePopupBtn" color="danger" fill="outline"><ion-icon name="close-outline"></ion-icon></ion-button><ion-button id="addCpBtn" color="success" fill="outline"><ion-icon name="checkmark-outline"></ion-icon></ion-button>`).openPopup();
        this.map.setView([e.latlng.lat, e.latlng.lng], this.map.getZoom(), {animate: false});
        setTimeout(() => {
          document.getElementById("addCpBtn")?.addEventListener("click", () => {
            const filterAccesspoints = this._accessPointService.filterAccessPoints(this.accessPoints, this.selectedFloor, this.selectedBuilding);
            const WifiData: WifiData[] = [];
            filterAccesspoints.forEach((filterAccesspoint: AccessPoint) => {
              WifiData.push(this._calibrationPointService.buildWifiData(filterAccesspoint.bssid, 2472, 0, 0));
            });
            const newCalibrationPoint: CalibrationPoint[] = [this._calibrationPointService.buildCalibrationPoint(e.latlng.lat, e.latlng.lng, this.selectedFloor, this.selectedBuilding, [
                              this._calibrationPointService.buildFingerprint(0, WifiData, filterAccesspoints), 
                              this._calibrationPointService.buildFingerprint(90, WifiData, filterAccesspoints),
                              this._calibrationPointService.buildFingerprint(180, WifiData, filterAccesspoints),
                              this._calibrationPointService.buildFingerprint(270, WifiData, filterAccesspoints)])];
            console.log("newCalibrationPoint ", newCalibrationPoint);
            this._calibrationPointService.addCalibrationPoint(newCalibrationPoint).subscribe(
              response => {
                console.log('Calibration point added successfully:', response);
                this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
                  this.removeCalibrationPoints();
                  this.drawCalibrationPoints(selectedLevel, calibrationPoints);
                  this.currentPolygon?.closePopup();
                });
                //TODO: add toast 
              },
              error => {
                console.error('Error adding calibration point:', error);
              }
            );
            console.log("ADD: ", e);
          });
          document.getElementById("closePopupBtn")?.addEventListener("click", () => {
            this.currentPolygon?.closePopup();
          });
        }, 0);
        console.log("Add CP ", e);
    });

  }

  drawCalibrationPoints(selectedLevel: number, calibrationPoints: any): void {
    this.removeCalibrationPoints();
    this.calibrationPoints = calibrationPoints.filter((x: any) => x.floor == selectedLevel && x.building == this.selectedBuilding);
    console.log(this.calibrationPoints);
    this.calibrationPoints.forEach((data: any) => {
      let color = 'grey';
      if (data.fingerprints && data.fingerprints.length > 0) { 
        if(data.fingerprints[0].accessPoints.length == 0) color = 'grey';
        else if(data.fingerprints[0].accessPoints.length <= 2) color = 'red';
        else if(data.fingerprints[0].accessPoints.length <= 3) color = 'yellow';
        else color = 'green';
      } 

      const circle = L.circle([data.lat, data.lng], 0.5, { color: color, fillOpacity: 1 })
      .addTo(this.map)
      .bindTooltip(`ID: ${data.id} <br> Latitude: ${data.lat} <br> Longitude: ${data.lng} <br>Accesspoints: ${data.fingerprints[0].accessPoints.length}`)
      .bindPopup(`ID: ${data.id} <br> Latitude: ${data.lat} <br> Longitude: ${data.lng} <br>Accesspoints: ${data.fingerprints[0].accessPoints.length}<br> <ion-button id="edit-cp" fill="clear"><ion-icon name="create-outline"></ion-icon></ion-button><ion-button id="delete-cp" fill="clear"><ion-icon name="trash-outline"></ion-icon></ion-button>`, { closeOnClick: false, autoClose: true })
      .on('click', (e) => {
        this.map.setView([data.lat, data.lng],this.map.getZoom() , { animate: false });
        console.log("clicked calibrationpoint: ", e.target);
        e.target.openPopup();
        setTimeout(() => {
          document.getElementById('edit-cp')?.addEventListener("click", () => {
            const editCP = this.calibrationPoints.find(cp => cp.id === data.id);
            const newAccessPoints = this._accessPointService.filterAccessPoints(this.accessPoints, this.selectedFloor, this.selectedBuilding).filter(filterAccesspoints => 
              !editCP.fingerprints[0].accessPoints.some((existingAP: AccessPoint) => existingAP.bssid === filterAccesspoints.bssid)
            );
            for (let i = 0; i < editCP.fingerprints.length; i++) {
              newAccessPoints.forEach((accesspoint: AccessPoint) => {
                this._calibrationPointService.addAccessPoint(editCP, accesspoint, i); 
              })
            }
            this._calibrationPointService.editCalibrationPoint(editCP).subscribe(
              response => {
                console.log(response); // TODO: add success Toast
                this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: CalibrationPoint) => {
                  e.target.closePopup();
                  this.removeCalibrationPoints();
                  this.drawCalibrationPoints(selectedLevel, calibrationPoints);
                });
              }
            );
            //TODO: ngx-modal-dialog, modalcontroller
            console.log("edit cp");
            
        
          });
          document.getElementById('delete-cp')?.addEventListener("click", () => {
            this._calibrationPointService.removeCalibrationPoint(data.id).subscribe(
              response => {
                this.map.removeLayer(e.target);
                console.log(response); 
                //TODO: add toast
              }
            );
          });
        }, 0);
        if (data.fingerprints && data.fingerprints.length > 0) {
          data.fingerprints[0].accessPoints.forEach((x: any) => {
            this.selectedAccessPointCircles.push(this.drawAccessPoint([x.lat, x.lng], x.bssid)); 
            const accessPointCircle = L.circle([x.lat, x.lng], 0.5, { color: 'rgba(99, 197, 199, 0.8)', fillOpacity: 1 }).addTo(this.map).bindTooltip(`Accesspoint: ${x.bssid}`);
            this.selectedAccessPointCircles.push(accessPointCircle);
          });
        }
      })
      .on('popupclose', () => { 
        this.selectedAccessPointCircles.forEach((accessCircle) => { 
          this.map.removeLayer(accessCircle);
        });
        this.selectedAccessPointCircles = [];
      });
      
      this.circles.push(circle);
    });
  }

  loadFloorButtons(building: any) {
    const floorButtonsContainer = document.getElementById('floor-buttons');
    if (!floorButtonsContainer) return;

    floorButtonsContainer.innerHTML = '';
    this.selectedFloor = "0";
    building.levels.forEach((level: any, index: number) => {
      const button = document.createElement('ion-button');
      button.setAttribute("class", "select-btn");
      level.level == this.selectedFloor ? button.setAttribute("color", "primary") : button.setAttribute("color", "dark");
      level.level >= 0 ? button.innerText = `OG ${level.level}` : button.innerText = `UG ${Math.abs(level.level)}`;
      button.addEventListener('click', () => {
        console.log(`Floor ${index}`);
        const selectBtns = document.querySelectorAll('.select-btn'); 
        selectBtns.forEach((floorButton: Element) => { 
          floorButton.setAttribute("color", "dark");
        });
        button.setAttribute("color", "primary");
        this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
          this.selectedFloor = level.level;
          this.selectedBuilding = building.name.replace(/\s/g, '');
          this.drawRooms(building, level.level);
          this.drawCalibrationPoints(level.level, calibrationPoints);
          this.drawAccessPoints();
        });
        
      });
      floorButtonsContainer.prepend(button);
    });
    floorButtonsContainer.appendChild(this.createExitBtn());
  }

  createExitBtn(): HTMLIonButtonElement {
    const exitBtn = document.createElement('ion-button');
    const exitIcon = document.createElement('ion-icon');
    exitBtn.setAttribute("color", "danger");
    exitIcon.setAttribute("name", "exit-outline");
    exitBtn.appendChild(exitIcon);
    exitBtn.addEventListener("click", this.clearRooms.bind(this));
    return exitBtn;
  }
  
  removeCalibrationPoints(): void {
    if (this.circles) {
      this.circles.forEach(x => {
        this.map.removeLayer(x);
      });
      this.circles = [];
    }
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
      this.removeAccessPoints();
    }
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  centerView() {
    if(this.currentPolygon) {
      this.buildings.filter((x: any) => this.selectedBuilding === x.name.replace(/\s/g, '')).forEach((data: any) => {
        this.map.setView(data.shell.points[0], 20);
      });
    }
    else this.map.setView(this.centerLatLng, 19);
  }

  addAccesspoint(): void {
    if (this.accesspointForm.valid) {
      const formValues = this.accesspointForm.value;
      if(!formValues.floor) formValues.floor = this.selectedFloor;
      if(!formValues.building) formValues.building = this.selectedBuilding;
      const accessPointData = {
        ...formValues,
      };

      this._accessPointService.addAccesspoint(accessPointData).subscribe(
        response => { //TODO: test if working and if needed @add new accesspoint to all calibrationpoints on same floor
          delete accessPointData.building;
          this.calibrationPoints.forEach((calibrationPoint: any) => {
            for (let i = 0; i < calibrationPoint.fingerprints.length; i++) {
              this._calibrationPointService.addAccessPoint(calibrationPoint, accessPointData, i);
            }
            this._calibrationPointService.editCalibrationPoint(calibrationPoint).subscribe();
          });      

          this.removeCalibrationPoints();
          this.drawCalibrationPoints(formValues.floor, this.calibrationPoints);
          this.drawAccessPoints();
          this.dismissModal();
          alert(`SUCCESS: ${response}`); // TODO: add toast here instead of alert
        }, 
        error => {
          alert(`ERROR: ${error.error}`); // TODO: add toast here instead of alert
        }
      );
    }
  }
}
