import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { Subscription } from 'rxjs';
import { MonitorRecord } from '../data/common/monitor-record';
import { MonitorRecord as HwcMonitorRecord } from '../data/common/hwc/monitor-record';
import { ValidatorElement } from '../directives/validator.directive';
import { ControllerMode } from '../data/common/hwc/boiler-mode';

@Component({
    selector: 'app-boiler-controller',
    templateUrl: 'boiler-controller.component.html',
    styles: [`
    .ng-valid[required], .ng-valid.required  {
        border-left: 5px solid #00ff00; /* green */
      }
      .ng-invalid:not(form)  {
        border-left: 5px solid #ff0000; /* red */
      }
    `]

})
export class BoilerControllerComponent implements OnInit, OnDestroy {

    @Input() config: any;
    @Input() data: any;

    public validatorMode: ValidatorElement<string>;
    public validatorPin: ValidatorElement<string>;
    public currentMode: string;
    public inputs: IInput [] = [];

    private _monitorValuesSubsciption: Subscription;
    private _inputPower: IInput;
    private _inputPin: IInput;
    private _lastMonitorRecord: HwcMonitorRecord;

    constructor (private dataService: DataService) {
        this.currentMode = '?';

        this.validatorMode = new ValidatorElement<string>(
            'off', (e, n, v) => {
                switch (v) {
                    case 'off': {
                        this._inputPower.hidden = true;
                        break;
                    }

                    case 'power': {
                        if (this._lastMonitorRecord) {
                            this._inputPower.validator.value = this._lastMonitorRecord.setpointPower.value;
                        }
                        this._inputPower.hidden = false;
                        break;
                    }

                    case 'test': {
                        if (this._lastMonitorRecord) {
                            this._inputPower.validator.value = this._lastMonitorRecord.setpointPower.value;
                        }
                        this._inputPower.hidden = false;
                        break;
                    }

                }
            });


        this._inputPower = {
            id: 'idPower', type: 'number', key: 'Leistung/W', name: 'power',
            min: 0, max: 2000, hidden: true, validator: null, pattern: '[0-9]*', mode: ''
        };
        this._inputPower.validator = new ValidatorElement<number>(2000, null, (e, n, v) => {
            if (Number.isNaN(+v)) { return false; }
            if (+v < 0) { return false; }
            if (+v > 2000) { return false; }
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

        this.inputs = [
            this._inputPower, this._inputPin
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

    public async onSubmit() {
        try {
            const rv = await this.dataService.setBoilerMode({
                createdAt:        new Date(),
                desiredMode:      <ControllerMode>this.validatorMode.value,
                pin:              this._inputPin.validator.value,
                setpointPower:    this._inputPower.validator.value
            });
            console.log(rv);
        } catch (err) {
            console.log(err);
        }
    }

    private handleMonitorValues (v: MonitorRecord) {
        const m = v.hwcMonitorRecord;
        if (!m || (Date.now() - m.createdAt.getTime() > 10000)) {
            this.currentMode = '?';
            if (m) {
                this.currentMode += ' (' + m.createdAt.toLocaleDateString() + ')';
            }
        } else {
            this.currentMode = m.mode;
            if (!this._lastMonitorRecord) {
                this._inputPower.validator.value = m.setpointPower.value;
            }
            this._lastMonitorRecord = m;
        }
        // console.log(v.hwcMonitorRecord);
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
