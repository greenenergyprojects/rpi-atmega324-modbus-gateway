import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { MonitorRecord, IMonitorRecordData } from '../data/common/monitor-record';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-overview',
    templateUrl: 'overview.component.html',
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
export class OverviewComponent implements OnInit, OnDestroy {

    private _monitorValuesSubsciption: Subscription;
    private _data: MonitorRecord;

    private _accordionData: {
        data: IAccordion;
    };

    public accordions: IAccordion [];

    public constructor (private _dataService: DataService, private _configService: ConfigService) {
        const x = this._configService.pop('overview:__accordionData');
        if (x) {
            this._accordionData = x;
        } else {
            this._accordionData = {
                data: { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Daten'}
            };
        }
        this._accordionData.data.filter.filter = (data) => this.filter(this._accordionData.data, data);
    }

    public ngOnInit () {
        this._monitorValuesSubsciption =
            this._dataService.monitorObservable.subscribe((value) => this.handleMonitorValues(value));

        this._data = null;
        // this._subsciption =
        //     this.dataService.froniusMeterObservable.subscribe((value) => this.handleValues(value));
        // this._dataService.getMonitorData({ latest: true }).subscribe( (data) => {
        //     this.handleMonitorData(data);
        // });
        this.accordions = [];
        for (const a in this._accordionData) {
            if (!this._accordionData.hasOwnProperty(a)) { continue; }
            this.accordions.push(this._accordionData[a]);
        }
    }

    public ngOnDestroy() {
        this._monitorValuesSubsciption.unsubscribe();
        this._monitorValuesSubsciption = null;
        this._configService.push('overview:__accordionData', this._accordionData);
        this._data = null;
    }

    private handleMonitorValues (v: MonitorRecord) {
        if (v) {
            this._data = v;
            this._accordionData.data.infos = this.createAccordionInfo(this._data.toHumanReadableObject());
        } else {
            this._data = null;
            this._accordionData.data.infos = [];
        }
    }

    public handleMonitorData (data: IMonitorRecordData []) {
        if (!Array.isArray(data) || data.length === 0) {
            this._data = null;
            this._accordionData.data.infos = [];

        } else {
            const v = data[data.length - 1];
            this._data = MonitorRecord.create(v);
            this._accordionData.data.infos = this.createAccordionInfo(this._data.toHumanReadableObject());
        }
    }


    public onAccordionOpenChanged (acc: IAccordion, open: boolean) {
        console.log(acc, open);
    }


    public async onButtonRefresh (a: IAccordion) {
        if (a === this._accordionData.data) {
            this._dataService.getMonitorData({ latest: true }).then( (values) => {
                this.handleMonitorData(values);
            }).catch ( (err) => { console.log(err); });
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
