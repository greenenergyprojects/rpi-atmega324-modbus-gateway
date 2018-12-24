import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import * as nibe1155 from '../data/common/nibe1155/nibe1155-values';
import { Subscription } from 'rxjs';
import { sprintf } from 'sprintf-js';
import { MonitorRecord } from '../data/common/monitor-record';

@Component({
    selector: 'app-nibe1155',
    templateUrl: 'nibe1155.component.html',
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
export class Nibe1155Component implements OnInit, OnDestroy {

    private _accordionData: {
        overview:   IAccordion;
        panel:      IAccordion;
        controller: IAccordion;
        logsetIds:  IAccordion;
        others:     IAccordion;
    };

    private _timer: any;
    private _subsciption: Subscription;
    private _monitorValuesSubsciption: Subscription;

    public accordions: IAccordion [];


    public constructor (private _dataService: DataService, private _configService: ConfigService) {
        // console.log('constructor');
        const x = this._configService.pop('nibe1155:__accordionData');
        if (x) {
            this._accordionData = x;
        } else {
            this._accordionData = {
                panel:      {
                    infos: [], isOpen: true, header: 'Steuerung',
                    showComponent: [ { name: 'HeatingControllerComponent', config: null, data: null } ]
                },
                controller: { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Controller'},
                logsetIds:  { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'LOG.SET Register'},
                overview:   { infos: [], isOpen: false, header: 'Überblick' },
                others:     { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Weitere Register'}
            };
        }
        this._accordionData.controller.filter.filter = (data) => this.filter(this._accordionData.controller, data);
        this._accordionData.logsetIds.filter.filter = (data) => this.filter(this._accordionData.logsetIds, data);
        this._accordionData.others.filter.filter = (data) => this.filter(this._accordionData.others, data);
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
        this._configService.push('nibe1155:__accordionData', this._accordionData);
        this._monitorValuesSubsciption.unsubscribe();
        this._monitorValuesSubsciption = null;
    }

    public onAccordionOpenChanged (acc: IAccordion, open: boolean) {
        console.log(acc, open);
    }

    public async onButtonRefresh (a: IAccordion) {
        if (a === this._accordionData.controller) {
            this._dataService.getNibe1155Values({ controller: true }).then( (values) => {
                this._dataService.handleNibe1155Values(values);
                this.handleControllerValues();
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.logsetIds) {
            this._dataService.getNibe1155Values({ ids: this._dataService.nibe1155.logsetIds }).then( (values) => {
                this._dataService.handleNibe1155Values(values);
                this.handleLogsetIds();
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.others) {
            this._dataService.getNibe1155Values({ ids: this._dataService.nibe1155.nonLogsetIds }).then( (values) => {
                this._dataService.handleNibe1155Values(values);
                this.handleNonLogsetIds();
            }).catch( (err) => { console.log(err); });

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
        this.handleOverview(v);
    }


    private handleOverview (v?: MonitorRecord) {
        const x: any = {};
        const a = this._accordionData.overview;
        const n = this._dataService.nibe1155;
        if (!n) {
            a.infos = this.createAccordionInfo({});
            return;
        }
        const controller = n.controller;
        let nv: nibe1155.Nibe1155Value;
        nv = n.values[43136]; const compressorFrequency = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[43439]; const brinePumpSpeed      = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[43437]; const supplyPumpSpeed     = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[43084]; const electricHeaterPower = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[40008]; const supplyFeedTemp      = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[40012]; const supplyReturnTemp    = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[40071]; const supplyTemp          = this.isValueOk(nv, 10000) ? nv.value : null;
        nv = n.values[40004]; const outdoor             = this.isValueOk(nv, 4 * 60000) ? nv.value : null;

        x.Update = new Date();
        x.Heizung = controller ? controller.state : '?';
        if (outdoor !== null) {
            x.Außentemperatur = sprintf('%.01f°C', outdoor);
        }
        if (compressorFrequency !== null) {
            x.Kompressorfrequenz = sprintf('%.01fHz', compressorFrequency);
        }
        if (electricHeaterPower !== null) {
            x.Elektrostab = sprintf('%.02fkW', electricHeaterPower / 1000);
        }
        if (supplyPumpSpeed !== null) {
            x.Pufferpumpe = sprintf('%d%%', supplyPumpSpeed);
        }
        if (brinePumpSpeed !== null) {
            x.Solepumpe = sprintf('%d%%', brinePumpSpeed);
        }
        if (supplyPumpSpeed > 0) {
            if (supplyFeedTemp !== null) {
                x.Vorlauf = sprintf('%.01f°C', supplyFeedTemp);
            }
            if (supplyReturnTemp !== null) {
                x.Rücklauf = sprintf('%.01f°C', supplyReturnTemp);
            }
        }
        if (supplyTemp !== null) {
            x.Puffer = sprintf('%.01f°C', supplyTemp);
        }


        a.infos = this.createAccordionInfo(x);
    }

    private isValueOk (v: nibe1155.Nibe1155Value, timeoutMillis: number) {
        if (!v || !v.valueAt) { return false; }
        return (Date.now() - v.valueAt.getTime()) < timeoutMillis;
    }


    private handleControllerValues () {
        const controller = this._dataService.nibe1155 && this._dataService.nibe1155.controller;
        if (!controller) {
            this._accordionData.controller.infos = [];
        } else {
            const a = this._accordionData.controller;
            a.infos = this.createAccordionInfo(controller);
        }

    }

    private handleLogsetIds () {
        const a = this._accordionData.logsetIds;
        const n = this._dataService.nibe1155;
        if (!n || !Array.isArray(n.logsetIds)) {
            a.infos = [];
            return;
        }
        const x: { [ key: string ]: string } = {};
        for (const id of n.logsetIds) {
            const v = n.values[id];
            if (!v) {
                x['? (' + id + ')'] = '?';
            } else {
                x[v.label + ' (' + v.id + ')'] = v.valueAsString(true);
            }
        }
        a.infos = this.createAccordionInfo(x);
    }

    private handleNonLogsetIds () {
        const a = this._accordionData.others;
        const n = this._dataService.nibe1155;
        if (!n || !Array.isArray(n.nonLogsetIds)) {
            a.infos = [];
            return;
        }
        const x: { [ key: string ]: string } = {};
        for (const id of n.nonLogsetIds) {
            const v = n.values[id];
            if (!v) {
                x['? (' + id + ')'] = '?';
            } else {
                x[v.label + ' (' + v.id + ')'] = v.valueAsString(true);
            }
        }
        a.infos = this.createAccordionInfo(x);
    }


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
