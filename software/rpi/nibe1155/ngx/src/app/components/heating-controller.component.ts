import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { Subscription } from 'rxjs';
import { MonitorRecord } from '../data/common/monitor-record';
import { ValidatorElement } from '../directives/validator.directive';

@Component({
    selector: 'app-heating-controller',
    templateUrl: 'heating-controller.component.html',
    styles: [`
    .ng-valid[required], .ng-valid.required  {
        border-left: 5px solid #00ff00; /* green */
      }
      .ng-invalid:not(form)  {
        border-left: 5px solid #ff0000; /* red */
      }
    `]

})
export class HeatingControllerComponent implements OnInit, OnDestroy {

    @Input() config: any;
    @Input() data: any;

    public validatorMode: ValidatorElement<string>;
    public validatorPin: ValidatorElement<string>;
    public currentMode: string;
    public inputs: IInput [] = [];
    public inputTest: IInput;

    private _monitorValuesSubsciption: Subscription;
    private _inputFrequency: IInput;
    private _inputFrequencyMin: IInput;
    private _inputFrequencyMax: IInput;
    private _inputTemp: IInput;
    private _inputTempMin: IInput;
    private _inputTempMax: IInput;
    private _inputPin: IInput;

    constructor (private dataService: DataService) {
        const fMin = 25, fMax = 90, tempMin = 20, tempMax = 60;
        this.currentMode = '?';

        this.validatorMode = new ValidatorElement<string>(
            'off', (e, n, v) => {
                switch (v) {
                    case 'off': {
                        this._inputFrequency.hidden = true;
                        this._inputFrequencyMin.hidden = true;
                        this._inputFrequencyMax.hidden = true;
                        this._inputTemp.hidden = true;
                        this._inputTempMin.hidden = true;
                        this._inputTempMax.hidden = true;
                        break;
                    }

                    case 'frequency': {
                        this._inputFrequency.hidden = false;
                        this._inputFrequencyMin.hidden = true;
                        this._inputFrequencyMax.hidden = true;
                        this._inputTemp.hidden = true;
                        this._inputTempMin.hidden = true;
                        this._inputTempMax.hidden = true;
                        break;
                    }
                    case 'economy': {
                        this._inputFrequency.hidden = true;
                        this._inputFrequencyMin.hidden = false;
                        this._inputFrequencyMax.hidden = false;
                        this._inputTemp.hidden = true;
                        this._inputTempMin.hidden = false;
                        this._inputTempMax.hidden = false;
                        break;
                    }

                    case 'temperature':  {
                        this._inputFrequency.hidden = true;
                        this._inputFrequencyMin.hidden = false;
                        this._inputFrequencyMax.hidden = false;
                        this._inputTemp.hidden = false;
                        this._inputTempMin.hidden = true;
                        this._inputTempMax.hidden = true;
                        break;
                    }
                    case 'test': {
                        this._inputFrequency.hidden = true;
                        this._inputFrequencyMin.hidden = true;
                        this._inputFrequencyMax.hidden = true;
                        this._inputTemp.hidden = true;
                        this._inputTempMin.hidden = true;
                        this._inputTempMax.hidden = true;
                    }
                }
            });


        this._inputFrequency = {
            id: 'idFrequency', type: 'number', key: 'Frequenz/Hz', name: 'frequency',
            min: fMin, max: fMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputFrequency.validator = new ValidatorElement<number>(30, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < fMin) { return false; }
            if (+v > fMax) { return false; }
            return true;
        });

        this._inputFrequencyMin = {
            id: 'idFrequencyMin', type: 'number', key: 'Frequenz-Min', name: 'frequencyMin',
            min: fMin, max: fMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputFrequencyMin.validator = new ValidatorElement<number>(25, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < fMin) { return false; }
            if (+v > fMax) { return false; }
            if (+v > this._inputFrequencyMax.validator.value) { return false; }
            return true;
        });

        this._inputFrequencyMax = {
            id: 'idFrequencyMax', type: 'number', key: 'Frequenz-Max', name: 'frequencyMax',
            min: fMin, max: fMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputFrequencyMax.validator = new ValidatorElement<number>(68, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < fMin) { return false; }
            if (+v > fMax) { return false; }
            if (+v < this._inputFrequencyMin.validator.value) { return false; }
            return true;
        });

        this._inputTemp = {
            id: 'idTemp', type: 'number', key: 't-Puffer', name: 'temp',
            min: tempMin, max: tempMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputTemp.validator = new ValidatorElement<number>(50, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < tempMin) { return false; }
            if (+v > tempMax) { return false; }
            return true;
        });

        this._inputTempMin = {
            id: 'idTempMin', type: 'number', key: 't-Puffer-Min', name: 'tempMin',
            min: tempMin, max: tempMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputTempMin.validator = new ValidatorElement<number>(20, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < tempMin) { return false; }
            if (+v > tempMax) { return false; }
            if (+v > this._inputTempMax.validator.value) { return false; }
            return true;
        });

        this._inputTempMax = {
            id: 'idTempMax', type: 'number', key: 't-Puffer-Max', name: 'tempMax',
            min: tempMin, max: tempMax, hidden: true, validator: null, pattern: '', mode: ''
        };
        this._inputTempMax.validator = new ValidatorElement<number>(60, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < tempMin) { return false; }
            if (+v > tempMax) { return false; }
            if (+v < this._inputTempMin.validator.value) { return false; }
            return true;
        });

        this._inputPin = {
            id: 'idPin', type: 'password', key: 'PIN', name: 'pin',
            min: '', max: '', hidden: false, validator: null, pattern: '[0-9]*', mode: 'numeric'
        };
        this._inputPin.validator = new ValidatorElement<string>('', null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            const rv = !(+v < 0  || +v > 9999 || (typeof v === 'string' && v.length !== 4));
            return rv;
        });

        this.inputTest = {
            id: 'idTest', type: 'password', key: 'Test', name: 'test',
            min: '', max: '', hidden: false, validator: null, pattern: '', mode: ''
        };
        this.inputTest.validator = new ValidatorElement<string>('', null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            const rv = !(+v < 0  || +v > 9999 || (typeof v === 'string' && v.length !== 4));
            console.log(rv);
            return rv;
        });

        this.inputs = [
            this._inputFrequency, this._inputFrequencyMin, this._inputFrequencyMax,
            this._inputTemp, this._inputTempMin, this._inputTempMax, this._inputPin
        ];

    }

    public ngOnInit () {
        this._monitorValuesSubsciption =
            this.dataService.monitorObservable.subscribe((value) => this.handleMonitorValues(value));
    }

    public ngOnDestroy() {
        this._monitorValuesSubsciption.unsubscribe();
        this._monitorValuesSubsciption = null;
    }

    public onSubmit() {
        this.dataService.setHeatPumpMode({
            createdAt:        new Date(),
            desiredMode:      this.validatorMode.value,
            pin:              this._inputPin.validator.value,
            fSetpoint:        this._inputFrequency.validator.value,
            fMin:             this._inputFrequencyMin.validator.value,
            fMax:             this._inputFrequencyMax.validator.value,
            tempSetpoint:     this._inputTemp.validator.value,
            tempMin:          this._inputTempMin.validator.value,
            tempMax:          this._inputTempMax.validator.value
        }).then( (rv) =>  {
            console.log(rv);
        }).catch( (err) => {
            console.log(err);
        });
    }

    private handleMonitorValues (v: MonitorRecord) {
        const n = this.dataService.nibe1155;
        if (!n || !n.controller) { return; }
        this.currentMode = n.controller.state;
        // nv = n.values[43136]; const compressorFrequency = this.isValueOk(nv, 10000) ? nv.value : null;
    }

}

interface IInput {
    id: string;
    key: string;
    type: string;
    name: string;
    min: string | number;
    max: string | number;
    hidden: boolean;
    pattern: string;
    mode: string;
    validator: ValidatorElement<any>;
}
