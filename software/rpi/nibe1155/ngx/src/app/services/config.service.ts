import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ConfigService {

    private _configMap: { [ key: string ]: any } = {};

    constructor (private http: HttpClient) { }

    public push (key: string, value: any) {
        this._configMap[key] = value;
    }

    public pop (key: string): any {
        return this._configMap[key];
    }

}
