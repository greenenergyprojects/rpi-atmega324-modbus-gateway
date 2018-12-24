import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import * as nibe1155 from '../data/common/nibe1155/nibe1155-values';
import { Subscription } from 'rxjs';
import { sprintf } from 'sprintf-js';
import { MonitorRecord } from '../data/common/monitor-record';

@Component({
    selector: 'app-boiler',
    templateUrl: 'boiler.component.html',
    styles: [ `
        .form-group {
            margin-bottom: 0.5rem;
        }
        .input-group {
            margin-bottom: 1rem;
        }
        .input-group input {
            background-color: white;
        }
        .filter {
            min-width: 1rem;
            text-align: center;
        }
        .table-sm {
            font-size: 0.75rem;
        }
    `]
})
export class BoilerComponent implements OnInit, OnDestroy {

    private _accordionData: {
        panel: IAccordion;
        overview:   IAccordion;
    };

    private _timer: any;
    private _subsciption: Subscription;
    private _monitorValuesSubsciption: Subscription;

    public accordions: IAccordion [];


    public constructor (private _dataService: DataService, private _configService: ConfigService) {
        // console.log('constructor');
        const x = this._configService.pop('boiler:__accordionData');
        if (x) {
            this._accordionData = x;
        } else {
            this._accordionData = {
                panel:      {
                    infos: [], isOpen: true, header: 'Boiler Steuerung',
                    showComponent: [ { name: 'BoilerControllerComponent', config: null, data: null } ]
                },
                overview:   { infos: [], isOpen: false, header: 'Boiler Überblick' }
            };
        }
    }

    public ngOnInit () {
        // console.log('onInit');
        this.accordions = [];
        for (const a in this._accordionData) {
            if (!this._accordionData.hasOwnProperty(a)) { continue; }
            this.accordions.push(this._accordionData[a]);
        }
        this._monitorValuesSubsciption =
            this._dataService.monitorObservable.subscribe((value) => this.handleMonitorValues(value));

    }

    public ngOnDestroy() {
        console.log('onDestroy');
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        if (this._subsciption) {
            this._subsciption.unsubscribe();
            this._subsciption = null;
        }
        this._configService.push('boiler:__accordionData', this._accordionData);
        this._monitorValuesSubsciption.unsubscribe();
        this._monitorValuesSubsciption = null;
    }

    public onAccordionOpenChanged (acc: IAccordion, open: boolean) {
        console.log(acc, open);
    }

    public async onButtonRefresh (a: IAccordion) {
        if (a === this._accordionData.overview) {
        }
    }

    public changeFilter (event, a: IAccordion) {
        a.filter.value = event;
    }

    public onButtonFilter (a: IAccordion) {
        console.log('onButtonFilter', a);
        if (a && a.filter) {
            a.filter.isDisabled = !a.filter.isDisabled;
        }
    }

    private filter (a: IAccordion, items: IInfo []): any [] {
        let rv: any [];
        if (a.filter.isDisabled || !a.filter.value) {
            rv = items;
        } else {
            rv = [];
            for (const i of items) {
                if (typeof i.key !== 'string') { continue; }
                if (i.key === 'createdAt' || i.key.indexOf(a.filter.value) !== -1) {
                    rv.push(i);
                }
            }
        }
        return rv;
    }

    private isExpired (d: Date | string | number, milliSeconds, defaultValue = true): boolean {
        try {
            if (d instanceof Date) {
                return (Date.now() - d.getTime()) > milliSeconds;
            }
            if (typeof d === 'number' && d > 0) {
                return (Date.now() - d) > milliSeconds;
            }
            if (typeof d === 'string') {
                d = new Date(d);
                return (Date.now() - d.getTime()) > milliSeconds;
            }
            throw new Error('not a Date');
        } catch (err) {
            console.log('ERROR: not a valid date/time', d, err);
            return defaultValue;
        }
    }

    private timeStampAsString (d: Date | string | number): string {
        try {
            const x = d instanceof Date ? d : new Date(<any>d);
            return sprintf('%02d:%02d:%02d', x.getHours(), x.getMinutes(), x.getSeconds());
        } catch (err) {
            console.log('ERROR: not a valid date/time', d, err);
            return '?';
        }
    }

    private handleMonitorValues (v: MonitorRecord) {
        // console.log(v.hwcMonitorRecord);
        this.handleOverview(v);
    }


    private ageToString (at: Date): string {
        if (!(at instanceof Date)) {
            return 'time ?';
        }
        let dt = Date.now() - at.getTime();
        // console.log(dt);
        const h = Math.floor(dt / 1000 / 60 / 60); dt = dt - h * 60 * 60 * 1000;
        const m = Math.floor(dt / 1000 / 60); dt = dt - h * 60 * 1000;
        const s = Math.floor(dt / 1000); dt = dt - m * 1000;
        const ms = dt - s * 1000;
        // console.log(h, m, s, ms);

        if (h !== 0) {
            return sprintf('%dhrs %dmin', h, m);
        } else if (m !== 0) {
            return sprintf('%dmin %ds', m, s);
        } else if (s !== 0) {
            return sprintf('%.01fs', s + ms / 1000);
        } else {
            return sprintf('%dms', ms);
        }
    }

    private handleOverview (v?: MonitorRecord) {
        const a = this._accordionData.overview;
        const x: { [ key: string ]: string } = {};
        x['Leistung'] = '?';
        x['Energie(Tag)'] = '?';
        x['4..20mA Sollwert'] = '?';
        x['4..20mA Istwert'] = '?';

        for (const att of Object.getOwnPropertyNames(x)) {
            let val = '?';
            try {
                switch (att) {
                    case 'Leistung': {
                        const o = v.hwcMonitorRecord;
                        if (o.activePower) {
                            const dt = Date.now() - o.activePower.createdAt.getTime();
                            if (dt < 10000) {
                                val = '' + Math.round(o.activePower.value) + 'W (' + this.ageToString(o.createdAt) + ')';
                                break;
                            }
                        }
                        val = '?';
                        break;
                    }
                    case 'Energie(Tag)': {
                        const o = v.hwcMonitorRecord.energyDaily;
                        val = '' + Math.round(o.value) + o.unit + ' (' + this.ageToString(o.createdAt) + ')';
                        break;
                    }
                    case '4..20mA Sollwert': {
                        const o = v.hwcMonitorRecord.current4to20mA;
                        val = '' + o.setpoint.value + o.setpoint.unit + ' (' + this.ageToString(o.setpoint.createdAt) + ')';
                        break;
                    }
                    case '4..20mA Istwert': {
                        const o = v.hwcMonitorRecord.current4to20mA;
                        val = '' + o.current.value + o.current.unit + ' (' + this.ageToString(o.current.createdAt) + ')';
                        break;
                    }
                    default: console.log('unsupported attribute ' + att); break;
                }
            } catch (err) {
                console.log(err);
            }
            x[att] = val;
        }
        a.infos = this.createAccordionInfo(x);
    }

    private isValueOk (v: nibe1155.Nibe1155Value, timeoutMillis: number) {
        if (!v || !v.valueAt) { return false; }
        return (Date.now() - v.valueAt.getTime()) < timeoutMillis;
    }


    // private handleControllerValues () {
    //     const controller = this._dataService.nibe1155 && this._dataService.nibe1155.controller;
    //     if (!controller) {
    //         this._accordionData.controller.infos = [];
    //     } else {
    //         const a = this._accordionData.controller;
    //         a.infos = this.createAccordionInfo(controller);
    //     }

    // }



    private createAccordionInfo (data: any, width?: string): { key: string, value: string, width: string } [] {
        const rv: { key: string, value: string, width: string } [] = [];
        let kLength = 0;
        for (const k in data) {
            if (!data.hasOwnProperty(k)) { continue; }
            let v = data[k];
            if (v instanceof Date) {
                v = v.toLocaleString();
            }
            rv.push( { key: k, value: v, width: width } );
            kLength = Math.max(kLength, k.length);
        }
        if (!width) {
            const w = (kLength / 2 + 1) + 'rem';
            for (const d of rv) {
                d.width = w;
            }
        }
        return rv;
    }

}


interface IFilter {
    isDisabled: boolean;
    value: string;
    filter: (items: any []) => any [];
}

interface ITableRow {
    id: string;
    text: string [];
}

interface IInfo {
    key: string;
    value: string;
    width: string;
}

interface IAccordion {
    isOpen: boolean;
    header: string;
    infos: IInfo [];
    table?: { headers: string [], rows: ITableRow [] };
    filter?: IFilter;
    showComponent?: { name: string, config?: any, data?: any } [];
}
