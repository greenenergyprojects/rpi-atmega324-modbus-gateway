import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import * as symo from '../data/common/fronius-symo/fronius-symo-values';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-froniussymo',
    templateUrl: 'fronius-symo.component.html',
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
export class FroniusSymoComponent implements OnInit, OnDestroy {

    private _symo: {
        froniusRegister?:   symo.FroniusRegister;
        common?:            symo.Common;
        inverter?:          symo.Inverter;
        nameplate?:         symo.Nameplate;
        setting?:           symo.Setting;
        status?:            symo.Status;
        control?:           symo.Control;
        storage?:           symo.Storage;
        inverterExtension?: symo.InverterExtension;
        stringCombiner?:    symo.StringCombiner;
        meter?:             symo.Meter;
    };

    private _accordionData: {
        froniusRegister:   IAccordion;
        common:            IAccordion;
        inverter:          IAccordion;
        nameplate:         IAccordion;
        setting:           IAccordion;
        status:            IAccordion;
        control:           IAccordion;
        storage:           IAccordion;
        inverterExtension: IAccordion;
        stringCombiner:    IAccordion;
        meter:             IAccordion;
    };

    private _timer: any;
    private _subsciption: Subscription;

    public accordions: IAccordion [];


    public constructor (private _dataService: DataService, private _configService: ConfigService) {
        console.log('constructor');
        const x = this._configService.pop('fronius-symo:__accordionData');
        if (x) {
            this._accordionData = x;
        } else {
            this._accordionData = {
                froniusRegister:   {
                    infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Fronius Register'
                },
                common:            { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Common'},
                inverter:          { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Inverter'},
                nameplate:         { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Nameplate'},
                setting:           { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Settings'},
                status:            { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Status'},
                control:           { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Control'},
                storage:           { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Storage'},
                inverterExtension: {
                    infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Inverter Extension'
                },
                stringCombiner:    {
                    infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'String Combiner'
                },
                meter:             { infos: [], filter: {isDisabled: false, value: '', filter: null }, isOpen: false, header: 'Meter'}
            };
        }
        try {
            this._accordionData.froniusRegister.filter.filter = (data) => this.filter(this._accordionData.froniusRegister, data);
            this._accordionData.common.filter.filter = (data) => this.filter(this._accordionData.common, data);
            this._accordionData.inverter.filter.filter = (data) => this.filter(this._accordionData.inverter, data);
            this._accordionData.nameplate.filter.filter = (data) => this.filter(this._accordionData.nameplate, data);
            this._accordionData.setting.filter.filter = (data) => this.filter(this._accordionData.setting, data);
            this._accordionData.status.filter.filter = (data) => this.filter(this._accordionData.status, data);
            this._accordionData.control.filter.filter = (data) => this.filter(this._accordionData.control, data);
            this._accordionData.storage.filter.filter = (data) => this.filter(this._accordionData.storage, data);
            this._accordionData.inverterExtension.filter.filter = (data) => this.filter(this._accordionData.inverterExtension, data);
            this._accordionData.stringCombiner.filter.filter = (data) => this.filter(this._accordionData.stringCombiner, data);
            this._accordionData.meter.filter.filter = (data) => this.filter(this._accordionData.meter, data);
        } catch (err) {
            console.log(err);
        }
    }

    public ngOnInit () {
        console.log('onInit');
        this._symo = {};
        // this._subsciption =
        //     this.dataService.froniusMeterObservable.subscribe((value) => this.handleValues(value));
        this._dataService.getFroniusSymoValues({ all: true }).then( (values) => {
            console.log(values);
            this.handleSymoFroniusRegister(values);
            this.handleSymoCommon(values);
            this.handleSymoInverter(values);
            this.handleSymoNameplate(values);
            this.handleSymoSetting(values);
            this.handleSymoStatus(values);
            this.handleSymoControl(values);
            this.handleSymoStorage(values);
            this.handleSymoInverterExtension(values);
            this.handleSymoStringCombiner(values);
            this.handleSymoMeter(values);
        }).catch( (err) => {
            console.log(err);
        });

        this.accordions = [];
        for (const a in this._accordionData) {
            if (!this._accordionData.hasOwnProperty(a)) { continue; }
            this.accordions.push(this._accordionData[a]);
        }
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
        this._configService.push('fronius-symo:__accordionData', this._accordionData);
        this._symo = null;
    }

    public onAccordionOpenChanged (acc: IAccordion, open: boolean) {
        console.log(acc, open);
    }

    public async onButtonRefresh (a: IAccordion) {
        if (a === this._accordionData.froniusRegister) {
            this._dataService.getFroniusSymoValues({ froniusregister: true }).then( (values) => {
                this.handleSymoFroniusRegister(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.common) {
            this._dataService.getFroniusSymoValues({ common: true }).then( (values) => {
                this.handleSymoCommon(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.inverter) {
            this._dataService.getFroniusSymoValues({ inverter: true }).then( (values) => {
                this.handleSymoInverter(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.nameplate) {
            this._dataService.getFroniusSymoValues({ nameplate: true }).then( (values) => {
                this.handleSymoNameplate(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.setting) {
            this._dataService.getFroniusSymoValues({ setting: true }).then( (values) => {
                this.handleSymoSetting(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.status) {
            this._dataService.getFroniusSymoValues({ status: true }).then( (values) => {
                this.handleSymoStatus(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.storage) {
            this._dataService.getFroniusSymoValues({ storage: true }).then( (values) => {
                this.handleSymoStorage(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.inverterExtension) {
            this._dataService.getFroniusSymoValues({ inverterExtension: true }).then( (values) => {
                this.handleSymoInverterExtension(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.stringCombiner) {
            this._dataService.getFroniusSymoValues({ stringCombiner: true }).then( (values) => {
                this.handleSymoStringCombiner(values);
            }).catch( (err) => { console.log(err); });

        } else if (a === this._accordionData.meter) {
            this._dataService.getFroniusSymoValues({ meter: true }).then( (values) => {
                this.handleSymoMeter(values);
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

    private handleSymoFroniusRegister (v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.froniusRegister) {
            if (v.froniusRegister.error) {
                this._symo.froniusRegister = null;
                this._accordionData.froniusRegister.infos = [];
            } else {
                const a = this._accordionData.froniusRegister;
                this._symo.froniusRegister = new symo.FroniusRegister(v.froniusRegister.createdAt, v.froniusRegister.regs);
                a.infos = this.createAccordionInfo(this._symo.froniusRegister.toHumanReadableObject());
            }
        }
    }

    private handleSymoCommon (v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.common) {
            if (v.common.error) {
                this._symo.common = null;
                this._accordionData.common.infos = [];
            } else {
                const a = this._accordionData.common;
                this._symo.common = new symo.Common(v.common.createdAt, v.common.regs);
                a.infos = this.createAccordionInfo(this._symo.common.toHumanReadableObject());
            }
        }
    }

    private handleSymoInverter (v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.inverter) {
            if (v.inverter.error) {
                this._symo.inverter = null;
                this._accordionData.inverter.infos = [];
            } else {
                this._symo.inverter = new symo.Inverter(v.inverter.createdAt, v.inverter.regs);
                this._accordionData.inverter.infos = this.createAccordionInfo(this._symo.inverter.toHumanReadableObject());
            }
        }
    }

    private handleSymoNameplate (v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.nameplate) {
            if (v.nameplate.error) {
                this._symo.nameplate = null;
                this._accordionData.nameplate.infos = [];
            } else {
                this._symo.nameplate = new symo.Nameplate(v.nameplate.createdAt, v.nameplate.regs);
                this._accordionData.nameplate.infos = this.createAccordionInfo(this._symo.nameplate.toHumanReadableObject());
            }
        }

    }

    private handleSymoSetting(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.setting) {
            if (v.setting.error) {
                this._symo.setting = null;
                this._accordionData.setting.infos = [];
            } else {
                this._symo.setting = new symo.Setting(v.setting.createdAt, v.setting.regs);
                this._accordionData.setting.infos = this.createAccordionInfo(this._symo.setting.toHumanReadableObject());
            }
        }
    }

    private handleSymoStatus(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.status) {
            if (v.status.error) {
                this._symo.status = null;
                this._accordionData.status.infos = [];
            } else {
                this._symo.status = new symo.Status(v.status.createdAt, v.status.regs);
                this._accordionData.status.infos = this.createAccordionInfo(this._symo.status.toHumanReadableObject());
            }
        }
    }

    private handleSymoControl(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.control) {
            if (v.control.error) {
                this._symo.control = null;
                this._accordionData.control.infos = [];
            } else {
                this._symo.control = new symo.Control(v.control.createdAt, v.control.regs);
                this._accordionData.control.infos = this.createAccordionInfo(this._symo.control.toHumanReadableObject());
            }
        }
    }

    private handleSymoStorage(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.storage) {
            if (v.storage.error) {
                this._symo.storage = null;
                this._accordionData.storage.infos = [];
            } else {
                this._symo.storage = new symo.Storage(v.storage.createdAt, v.storage.regs);
                this._accordionData.storage.infos = this.createAccordionInfo(this._symo.storage.toHumanReadableObject());
                if (this._symo.nameplate && this._symo.nameplate.nominalStorageEnergy > 0) {
                    this._accordionData.storage.infos.push({
                        key: '*chargeLevel',
                        value: (this._symo.nameplate.nominalStorageEnergy * this._symo.storage.chargeLevelInPercent / 100) + 'Wh',
                        width: this._accordionData.storage.infos[0].width
                    });
                }
            }
        }
    }

    private handleSymoInverterExtension(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.inverterExtension) {
            if (v.inverterExtension.error) {
                this._symo.inverterExtension = null;
                this._accordionData.inverterExtension.infos = [];
            } else {
                this._symo.inverterExtension = new symo.InverterExtension(v.inverterExtension.createdAt, v.inverterExtension.regs);
                this._accordionData.inverterExtension.infos =
                    this.createAccordionInfo(this._symo.inverterExtension.toHumanReadableObject());
            }
        }
    }

    private handleSymoStringCombiner(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.stringCombiner) {
            if (v.stringCombiner.error) {
                this._symo.stringCombiner = null;
                this._accordionData.stringCombiner.infos = [];
            } else {
                this._symo.stringCombiner = new symo.StringCombiner(v.stringCombiner.createdAt, v.stringCombiner.regs);
                this._accordionData.stringCombiner.infos = this.createAccordionInfo(this._symo.stringCombiner.toHumanReadableObject());
            }
        }
    }

    private handleSymoMeter(v: symo.IFroniusSymoValues) {
        if (!this._symo) { return; }
        if (v.meter) {
            if (v.meter.error) {
                this._symo.meter = null;
                this._accordionData.meter.infos = [];
            } else {
                this._symo.meter = new symo.Meter(v.meter.createdAt, v.meter.regs);
                this._accordionData.meter.infos = this.createAccordionInfo(this._symo.meter.toHumanReadableObject());
            }
        }
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
