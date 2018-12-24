import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { IFroniusMeterValues } from '../data/common/fronius-meter/fronius-meter-values';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-froniusmeter',
    templateUrl: 'froniusmeter.component.html'
    // template: `
    // <h1>{{title}}</h1>
    // `
})
export class FroniusmeterComponent implements OnInit, OnDestroy {

    private _data: IFroniusMeterValues;
    private _timer: any;
    private _froniusMeterValuesSubsciption: Subscription;
    public show: IShow [];

    public constructor (private dataService: DataService) {

    }

    public ngOnInit () {
        // this._timer = setInterval( () => this.refresh(), 1000);
        this._froniusMeterValuesSubsciption =
            this.dataService.froniusMeterObservable.subscribe((value) => this.handleFroniusMeterValues(value));
    }

    public ngOnDestroy() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        this._data = null;
        this.show = [];
        this._froniusMeterValuesSubsciption.unsubscribe();
        this._froniusMeterValuesSubsciption = null;
    }


    private handleFroniusMeterValues (data: IFroniusMeterValues) {
        this._data = data;
        this.show = [];
        if (data) {
            if (data.currentL1 > 0 && data.activePowerL1 < 0) { data.currentL1 = - data.currentL1; }
            if (data.currentL2 > 0 && data.activePowerL2 < 0) { data.currentL2 = - data.currentL2; }
            if (data.currentL3 > 0 && data.activePowerL3 < 0) { data.currentL3 = - data.currentL3; }
            for (const k in data) {
                if (!data.hasOwnProperty(k)) { continue; }
                const s: IShow = { name: k, value: data[k].toString() };
                switch (k) {
                    case 'activePower':
                    case 'currentL1': case 'currentL2': case 'currentL3':
                    case 'activePowerL1': case 'activePowerL2': case 'activePowerL3':
                        if (data[k] < 0) {
                            s.color = 'green';
                        } else {
                            s.color = 'red';
                        }
                        break;
                }
                this.show.push(s);
            }
        }
    }


}

interface IShow {
    name: string;
    value: string;
    color?: string;
}
