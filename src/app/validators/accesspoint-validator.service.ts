import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AccesspointValidatorService {
  static bssidValidator(control: AbstractControl): ValidationErrors | null {
    const regex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return regex.test(control.value) ? null : { invalidBSSID: true };
  }

  static latitudeValidator(control: AbstractControl): ValidationErrors | null {
    const value = parseFloat(control.value);
    return !isNaN(value) ? null : { invalidLatitude: true };
  }

  static longitudeValidator(control: AbstractControl): ValidationErrors | null {
    const value = parseFloat(control.value);
    return !isNaN(value) ? null : { invalidLongitude: true };
  }
}
