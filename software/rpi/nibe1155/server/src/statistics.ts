import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('statistics');

import * as fs from 'fs';
import { sprintf } from 'sprintf-js';
import * as nconf from 'nconf';
import { Nibe1155MonitorRecord } from './data/common/nibe1155/nibe1155-monitor-record';
import { Nibe1155ModbusRegisters, Nibe1155ModbusIds } from './data/common/nibe1155/nibe1155-modbus-registers';


interface IStatisticsConfig {
    disabled?: boolean;
    timeslotSeconds: number;
    tmpFile: string;
    dbtyp: 'csvfile';
    csvfile?: {
        filename: string;
        writeDate?: boolean;
    };
}

export class Statistics {

    public static CSVHEADER: IHeaderItem [] = [
          { id: 'cnt', label: 'Messwertanzahl', isRecordItem: true }
        , { id: 'first-time', label: 'von (%Y-%M-%D)', isRecordItem: true }
        , { id: 'last-time', label: 'bis', isRecordItem: true }
        // , { id: 'outdoorTemp',         unit: '°C', label: 't-Außen/°C' }
        , { id: 'calcSupplyTemp',      unit: '°C', label: 't-Puffer Soll/°C' }
        , { id: 'supplyTemp',          unit: '°C', label: 't-Puffer Ist/°C' }
        , { id: 'degreeMinutes',       unit: '',   label: 'Gradminuten' }
        , { id: 'brinePumpSpeed',      unit: '%',  label: 'Solepumpe' }
        , { id: 'supplyPumpSpeed',     unit: '%',  label: 'Pufferpumpe' }
        , { id: 'compressorFrequency', unit: 'Hz', label: 'Kompressor' }
        , { id: 'compressorInPower',   unit: 'W',  label: 'P-Kompressor' }
        , { id: 'electricHeaterPower', unit: 'W',  label: 'P-EStab' }
        , { id: 'supplyS1Temp',        unit: '°C', label: 't-Vorlauf' }
        , { id: 'supplyReturnTemp',    unit: '°C', label: 't-Rücklauf' }
        , { id: 'brineInTemp',         unit: '°C', label: 't-Sole-Ein' }
        , { id: 'brineOutTemp',        unit: '°C', label: 't-Sole-Aus' }
        , { id: 'condensorOutTemp',    unit: '°C', label: 't-Kond-Aus' }
        , { id: 'hotGasTemp',          unit: '°C', label: 't-Heißgas' }
        , { id: 'liquidLineTemp',      unit: '°C', label: 't-Liquid' }
        , { id: 'suctionTemp',         unit: '°C', label: 't-Absauger' }
        , { id: 'compressorState',     unit: '',   label: 'Kompressor' }
        , { id: 'supplyPumpState',     unit: '',   label: 'Pufferpumpe' }
        , { id: 'brinePumpState',      unit: '',   label: 'Solepumpe' }
        //
        , { id: 'outdoorTemp',            label: 't-Außen/°C', isSingleValue: true }
        , { id: 'roomTemp',               label: 't-Innen/°C', isSingleValue: true }
        , { id: 'outdoorTempAverage',     label: 't-Außen-gemittelt/°C', isSingleValue: true }
        , { id: 'heatCurveS1',            label: 'Heizkurve', isSingleValue: true }
        , { id: 'supplyMinS1',            label: 'HK-t-Min/°C', isSingleValue: true }
        , { id: 'supplyMaxS1',            label: 'HK-t-Max/°C', isSingleValue: true }
        , { id: 'heatOffsetS1',           label: 'HK-t-Offset/°C', isSingleValue: true }
        , { id: 'energyCompAndElHeater',  label: 'E-Total/kWh', isSingleValue: true }
        , { id: 'energyCompressor',       label: 'E-Pump/kWh', isSingleValue: true }
        , { id: 'alarm',                  label: 'Alarm', isSingleValue: true }
        , { id: 'operationalMode',        label: 'Operation-Mode', isSingleValue: true }
        , { id: 'supplyPumpMode',         label: 'Heizpumpe-Mode', isSingleValue: true }
        , { id: 'brinePumpMode',          label: 'Solepumpe-Mode', isSingleValue: true }
        , { id: 'cutOffFrequActivated1',  label: 'fcut1-activated', isSingleValue: true }
        , { id: 'cutOffFrequActivated2',  label: 'fcut2-activated', isSingleValue: true }
        , { id: 'cutOffFrequStart1',      label: 'fcut1-start/Hz', isSingleValue: true }
        , { id: 'cutOffFrequStop1',       label: 'fcut1-stop/Hz', isSingleValue: true }
        , { id: 'cutOffFrequStart2',      label: 'fcut2-start/Hz', isSingleValue: true }
        , { id: 'cutOffFrequStop2',       label: 'fcut2-stop/Hz', isSingleValue: true }
        , { id: 'compNumberOfStarts',     label: 'Compressor-Starts', isSingleValue: true }
        , { id: 'compTotalOperationTime', label: 'Compressor-Hours/h', isSingleValue: true }
        , { id: 'regMaxSupplyDiff',       label: 'Regler-MaxDiff/°C', isSingleValue: true }
        , { id: 'regMinCompFrequ',        label: 'Regler-fMin/Hz', isSingleValue: true }
        , { id: 'regMaxCompFrequ',        label: 'Regler-fMax/Hz', isSingleValue: true }
        , { id: 'dmStartHeating',         label: 'StartHeizen/GM', isSingleValue: true }
        , { id: 'dmDiffStartAddHeating',  label: 'StartElektrHeizen-Diff/GM', isSingleValue: true }
        , { id: 'addHeatingStep',         label: 'ElektrHeizen-Step/GM', isSingleValue: true }
        , { id: 'addHeatingMaxPower',     label: 'ElektrHeizen-PMAX/W', isSingleValue: true }
        , { id: 'allowAdditiveHeating',   label: 'ElektrHeizen-Erlaubt', isSingleValue: true }
        , { id: 'allowHeating',           label: 'Heizen-Erlaubt', isSingleValue: true }
        , { id: 'stopTempHeating',        label: 't-stop-heizen/°C', isSingleValue: true }
        , { id: 'stopTempAddHeating',     label: 't-stop-heizenElektr/°C', isSingleValue: true }
    ];

    public static getInstance (): Statistics {
        if (!this._instance) { throw new Error('instance not created'); }
        return this._instance;
    }

    public static async createInstance (config?: IStatisticsConfig): Promise<Statistics> {
        if (this._instance) { throw new Error('instance already created'); }
        const rv = new Statistics(config);
        await rv.init();
        this._instance = rv;
        return rv;
    }

    private static _instance: Statistics;

    // ***********************************************

    private _config: IStatisticsConfig;
    private _handleMonitorRecordCount = 0;
    private _history: StatisticsRecord [] = [];
    private _current: StatisticsRecordFactory;
    private _writeFileLines: IWriteFileLine [] = [];
    private _latest: Nibe1155MonitorRecord;

    private constructor (config?: IStatisticsConfig) {
        config = config || nconf.get('statistics');
        if (!config) { throw new Error('missing config'); }
        if (!config.disabled) {
            if (typeof config.timeslotSeconds !== 'number' || config.timeslotSeconds < 1) {
                throw new Error('invalid/missing value for timeslotSeconds');
            }
            if (typeof config.tmpFile !== 'string' || !config.tmpFile) {
                throw new Error('invalid/missing value for tmpFile');
            }
            if (typeof config.dbtyp !== 'string' || !config.dbtyp) {
                throw new Error('invalid/missing value for dbtyp');
            }
            switch (config.dbtyp) {
                case 'csvfile': {
                    if (typeof config.csvfile !== 'object' || !config.csvfile) {
                        throw new Error('invalid/missing object for csvfile');
                    }
                    if (typeof config.csvfile.filename !== 'string' || !config.csvfile.filename) {
                        throw new Error('invalid/missing value for csvfile.filename');
                    }
                    break;
                }
                default: {
                    throw new Error('invalid value for dbtyp');
                }
            }
        }
        this._config = config;
        if (!this._config.disabled) {
            setInterval( () => this.handleTimer(), this._config.timeslotSeconds * 1000);
        }
    }

    public handleMonitorRecord (d: Nibe1155MonitorRecord) {
        debug.finer('handleMonitorRecord %o', d);
        this._handleMonitorRecordCount++;
        if (!this._current) {
            this._current = new StatisticsRecordFactory(Statistics.CSVHEADER);
        }
        this._current.addMonitorRecord(d);
        this._latest = d;
    }

    public handleSingleValue (name: string, value: number, at: Date) {
        debug.finer(sprintf('handleSingleValue %s %f %s', name, value, at));
        if (!this._current) {
            this._current = new StatisticsRecordFactory(Statistics.CSVHEADER);
        }
        this._current.addSingleValue(name, value, at);
    }

    public get latest (): Nibe1155MonitorRecord {
        return this._latest;
    }


    private async init () {
        if (this._config.disabled) { return; }
    }

    private handleTimer () {
        if (this._config.disabled) { return; }
        if (this._handleMonitorRecordCount === 0) {
            debug.warn('no monitor records received, cannot continue statistics!');
        } else {
            debug.fine('%d monitor records processed, history-size=%d', this._handleMonitorRecordCount, this._history.length);
            this._handleMonitorRecordCount = 0;
            if (this._current) {
                this._history.push(this._current);
                if (this._config.dbtyp) {
                    switch (this._config.dbtyp) {
                        case 'csvfile': this.writeToCsvFile(this._config.csvfile, this._current); break;
                        default: debug.warn('invalid config/dbtyp'); break;
                    }
                }
                this._current = new StatisticsRecordFactory(Statistics.CSVHEADER, this._current.singleValues);
            }
        }
    }

    private writeToCsvFile (config: { filename: string, writeDate?: boolean }, x: StatisticsRecordFactory) {
        let filename = config.filename;
        let i = filename.indexOf('%Y');
        if (i >= 0) {
            filename = filename.substr(0, i) + sprintf('%02d', x.firstAt.getFullYear()) + filename.substr(i + 2);
        }
        i = filename.indexOf('%M');
        if (i >= 0) {
            filename = filename.substr(0, i) + sprintf('%02d', x.firstAt.getMonth() + 1) + filename.substr(i + 2);
        }
        i = filename.indexOf('%D');
        if (i >= 0) {
            filename = filename.substr(0, i) + sprintf('%02d', x.firstAt.getDate()) + filename.substr(i + 2);
        }
        i = filename.indexOf('%m');
        if (i >= 0) {
            filename = filename.substr(0, i) + sprintf('%02d', x.firstAt.getMilliseconds()) + filename.substr(i + 2);
        }
        i = filename.indexOf('%d');
        if (i >= 0) {
            const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
            filename = filename.substr(0, i) + sprintf('%02d%s', wd[x.firstAt.getDay()], filename.substr(i + 2));
        }

        this._writeFileLines.push({ filename: filename, line: x.toLine(), header: x.toHeader()});
        if (this._writeFileLines.length === 1) {
            this.writeToFile();
        }
    }

    private writeToFile () {
        if (this._writeFileLines.length === 0) { return; }
        const x = (this._writeFileLines.splice(0, 1))[0];
        const s = (fs.existsSync(x.filename) ? x.line : x.header + '\n' + x.line) + '\n';
        const thiz = this;
        fs.appendFile(x.filename, s, (err) => {
            if (err) {
                debug.warn('writing to file %s fails\n%s', x.filename, s);
            } else if (debug.finer.enabled) {
                debug.finer('append record to file %s\n%s', x.filename, s);
            }
            thiz.writeToFile();
        });
    }
}

export interface IWriteFileLine {
    filename: string;
    line: string;
    header: string;
}

export interface IStatisticsRecord {
    valueCount: number;
    firstAt: Date | number;
    lastAt: Date | number;
    minMaxValues: IMinMaxValue [];
    singleValues: { [id: string]: ISingleValue };
}

export interface IHeaderItem {
    id: string;
    unit?: string;
    isRecordItem?: boolean;
    hideMin?: boolean;
    hideAvg?: boolean;
    hideMax?: boolean;
    isSingleValue?: boolean;
    label?: string;
}

export interface IMinMaxValue {
    id: string;
    min: number;
    avg: number;
    max: number;
}

export interface ISingleValue {
    id: string;
    at: Date | number;
    value: number;
}

export class StatisticsRecord implements IStatisticsRecord  {
    protected _valueCount: number;
    protected _firstAt: Date;
    protected _lastAt: Date;
    protected _minMaxValues: IMinMaxValue [];
    protected _singleValues: { [id: string]: ISingleValue };

    public constructor (init?: IStatisticsRecord, singleValues?: { [id: string]: ISingleValue }) {
        if (!init) {
            this._valueCount = 0;
            this._firstAt = null;
            this._lastAt = null;
            this._minMaxValues = [];
            this._singleValues = singleValues ? singleValues : {};
        } else {
            this._valueCount = init.valueCount;
            const fat = init.firstAt;
            this._firstAt = fat instanceof Date ? fat : new Date(fat);
            const lat = init.lastAt;
            this._lastAt = lat instanceof Date ? lat : new Date(lat);
            this._minMaxValues = init.minMaxValues;
            this._singleValues = {};
            for (const id in init.singleValues) {
                if (!init.singleValues.hasOwnProperty(id)) { continue; }
                const v = init.singleValues[id];
                this._singleValues[id] = {
                    id:   v.id,
                    at: v.at instanceof Date ? v.at : new Date(v.at),
                    value: v.value
                };
            }
        }
    }

    public get valueCount (): number {
        return this._valueCount;
    }

    public get firstAt (): Date {
        return this._firstAt;
    }

    public get lastAt (): Date {
        return this._lastAt;
    }

    public get minMaxValues (): IMinMaxValue [] {
        return this._minMaxValues;
    }

    public get singleValues (): { [ id: string ]: ISingleValue } {
        return this._singleValues;
    }

    public toObject (preserveDate?: boolean): IStatisticsRecord {
        const rv: IStatisticsRecord = {
            valueCount:    this._valueCount,
            firstAt:       preserveDate ? this._firstAt : this._firstAt.getTime(),
            lastAt:        preserveDate ? this._lastAt : this._lastAt.getTime(),
            minMaxValues:  this._minMaxValues,
            singleValues:  {}
        };
        for (const id in this._singleValues) {
            if (!this._singleValues.hasOwnProperty(id)) { continue; }
            const v = this._singleValues[id];
            const at = v.at instanceof Date ? v.at.getTime() : v.at;
            rv.singleValues[id] = {
                id:   v.id,
                at: preserveDate ? new Date(at) : at,
                value: v.value
            };
        }
        return rv;
    }

}

class StatisticsRecordFactory extends StatisticsRecord {

    private _header: IHeaderItem [];

    constructor (header: IHeaderItem [], singleValues?: { [id: string]: ISingleValue }) {
        super(null, singleValues);
        this._header = header;
        for (let i = 0; i < header.length; i++) {
            const h = header[i];
            if (h.isRecordItem) { continue; }
            this._minMaxValues.push({ id: h.id, min: Number.NaN, avg: Number.NaN, max: Number.NaN });
        }

    }

    public addMonitorRecord (r: Nibe1155MonitorRecord) {
        if (this.valueCount === 0) {
            this._firstAt = r.createdAt;
        }
        this._lastAt = r.createdAt;

        for (let i = 0, offset = 0; i < this._header.length; i++) {
            const h = this._header[i];
            if (h.isRecordItem) {
                offset--;
                continue;
            }
            if (h.isSingleValue) {
                continue;
            }
            const v = this._minMaxValues[i + offset];
            if (v.id !== h.id) {
                debug.warn('error on header-id %s / value-id %s / index %d / offset %d', h.id, v.id, i, offset);
                continue;
            }

            switch (h.id) {
                // case 'outdoorTemp':         this.handleValue(v, this._valueCount, r.outdoorTemp); break;
                case 'calcSupplyTemp':      this.handleValue(v, this._valueCount, r.calcSupplyTemp.value); break;
                case 'supplyTemp':          this.handleValue(v, this._valueCount, r.supplyTemp.value); break;
                case 'degreeMinutes':       this.handleValue(v, this._valueCount, r.degreeMinutes.value); break;
                case 'brinePumpSpeed':      this.handleValue(v, this._valueCount, r.brinePumpSpeed.value); break;
                case 'supplyPumpSpeed':     this.handleValue(v, this._valueCount, r.supplyPumpSpeed.value); break;
                case 'compressorFrequency': this.handleValue(v, this._valueCount, r.compressorFrequency.value); break;
                case 'compressorInPower':   this.handleValue(v, this._valueCount, r.compressorInPower.value); break;
                case 'electricHeaterPower': this.handleValue(v, this._valueCount, r.electricHeaterPower.value); break;
                case 'supplyS1Temp':        this.handleValue(v, this._valueCount, r.supplyS1Temp.value); break;
                case 'supplyReturnTemp':    this.handleValue(v, this._valueCount, r.supplyS1ReturnTemp.value); break;
                case 'brineInTemp':         this.handleValue(v, this._valueCount, r.brineInTemp.value); break;
                case 'brineOutTemp':        this.handleValue(v, this._valueCount, r.brineOutTemp.value); break;
                case 'condensorOutTemp':    this.handleValue(v, this._valueCount, r.condensorOutTemp.value); break;
                case 'hotGasTemp':          this.handleValue(v, this._valueCount, r.hotGasTemp.value); break;
                case 'liquidLineTemp':      this.handleValue(v, this._valueCount, r.liquidLineTemp.value); break;
                case 'suctionTemp':         this.handleValue(v, this._valueCount, r.liquidLineTemp.value); break;
                case 'compressorState':     this.handleValue(v, this._valueCount, r.compressorState.value); break;
                case 'supplyPumpState':     this.handleValue(v, this._valueCount, r.supplyPumpState.value); break;
                case 'brinePumpState':      this.handleValue(v, this._valueCount, r.brinePumpState.value); break;
                default: debug.warn('unsupported id %s for addMonitorRecord()', h.id); break;
            }
        }
        this._valueCount++;
    }

    public addSingleValue (name: string, value: number, at?: Date) {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            debug.warn('cannot at single value %s name with invalid value %s', name, value);
        } else {
            this._singleValues[name] = {
                id: name,
                at: at || new Date(),
                value: value
            };
        }
    }

    public toHeader (): string {
        let s = '';
        for (let i = 0, first = true; i < this._header.length; i++) {
            const h = this._header[i];
            if (h.isRecordItem) {
                s = s + (first ? '' : ',');
                s += '"' + h.label + '"'; first = false;
                const now = new Date();
                s = s.replace(/%Y/g, sprintf('%04d', now.getFullYear()));
                s = s.replace(/%M/g, sprintf('%02d', now.getMonth() + 1));
                s = s.replace(/%D/g, sprintf('%02d', now.getDate()));
            } else if (h.isSingleValue) {
                s = s + (first ? '' : ',');
                s += '"SVAL(' + h.label + ')","SDAT(' + h.label + ')"';
                first = false;
            } else {
                if (!h.hideMin) {
                    s = s + (first ? '' : ',');
                    s += '"MIN(' + h.label + ')"';
                    first = false;
                }
                if (!h.hideAvg) {
                    s = s + (first ? '' : ',');
                    s += '"AVG(' + h.label + ')"';
                    first = false;
                }
                if (!h.hideMax) {
                    s = s + (first ? '' : ',');
                    s += '"MAX(' + h.label + ')"';
                    first = false;
                }

            }
        }
        return s;
    }

    public toLine (): string {
        let s = '', offset = 0;
        for (let i = 0, first = true; i < this._header.length; i++, first = false) {
            const h = this._header[i];
            s += s.length > 0 ? ',' : '';

            if (h.isSingleValue) {
                offset -= 2;
                const v = this._singleValues[h.id];
                if (!v) {
                    s += sprintf('"0",""'); // no value available
                } else {
                    const at = v.at instanceof Date ? v.at : new Date(v.at);
                    const d = (<any>Nibe1155ModbusRegisters.regDefByLabel)[<Nibe1155ModbusIds>+h.id];
                    let sv: string;
                    if (d) {
                        sv = sprintf(d.format, v.value).trim();
                    } else {
                        sv = sprintf('%.3f', v.value);
                    }

                    s += sprintf('"%s","%02d:%02d:%02d"', sv.replace(/\./g, ','), at.getHours(), at.getMinutes(), at.getSeconds());
                }

            } else if (h.isRecordItem) {
                offset--;
                switch (h.id) {
                    case 'cnt': {
                        s += this.valueCount.toString();
                        break;
                    }
                    case 'first-date': {
                        s += sprintf('"%04d-%02d-%02d"', this.firstAt.getFullYear(), this.firstAt.getMonth() + 1, this.firstAt.getDay());
                        break;
                    }
                    case 'last-date': {
                        s += sprintf('"%04d-%02d-%02d"', this.lastAt.getFullYear(), this.lastAt.getMonth() + 1, this.lastAt.getDay());
                        break;
                    }
                    case 'first-time': {
                        s += sprintf('"%02d:%02d:%02d"', this.firstAt.getHours(), this.firstAt.getMinutes(), this.firstAt.getSeconds());
                        break;
                    }
                    case 'last-time': {
                        s += sprintf('"%02d:%02d:%02d"', this.lastAt.getHours(), this.lastAt.getMinutes(), this.lastAt.getSeconds());
                        break;
                    }
                    default: debug.warn('unsupported record Item id %s', h.id); break;
                }

            } else {
                const v = this.minMaxValues[i + offset];
                if (v && v.id !== h.id) {
                    debug.warn('error on header-id %s / value-id %s / index %d / offset %d', h.id, v.id, i, offset);
                    s += '"ERR","ERR","ERR"';
                } else {
                    switch (h.id) {
                        case 'calcSupplyTemp': case 'supplyTemp':
                        case 'supplyS1Temp': case 'supplyReturnTemp': case 'brineInTemp': case 'brineOutTemp': case 'condensorOutTemp':
                        case 'hotGasTemp': case 'liquidLineTemp': case 'suctionTemp': {
                            s += this.formatLineFragment(h, 1, v);
                            break;
                        }

                        case 'degreeMinutes': case 'brinePumpSpeed':  case 'supplyPumpSpeed':
                        case 'compressorFrequency': case 'compressorInPower': case 'electricHeaterPower': {
                            s += this.formatLineFragment(h, 0, v);
                            break;
                        }

                        case 'compressorState': case 'supplyPumpState': case 'brinePumpState': {
                            s += this.formatLineFragment(h, 0, v);
                            break;
                        }

                        default: debug.warn('unsupported minMaxValues id %s', h.id); break;
                    }
                }
            }

        }
        return s;
    }

    private formatLineFragment (h: IHeaderItem, digits: number, values: IMinMaxValue): string {
        let s = '';
        let k = 1;
        while (digits-- > 0) {
            k *= 10;
        }
        if (!h.hideMin) {
            s += typeof values.min === 'number' ? sprintf('"%f"', Math.round(values.min * k) / k) : '""';
        }
        if (!h.hideAvg) {
            if (s) { s += ','; }
            s += typeof values.avg === 'number' ? sprintf('"%f"', Math.round(values.avg * k) / k) : '""';
        }
        if (!h.hideMax) {
            if (s) { s += ','; }
            s += typeof values.max === 'number' ? sprintf('"%f"', Math.round(values.max * k) / k) : '""';
        }
        return s.replace(/\./g, ',');
    }

    private handleValue (v: IMinMaxValue, cnt: number, x: number) {
        this.calcMinimum(v, x);
        this.calcMaximum(v, x);
        this.calcAverage(v, cnt, x);
    }

    private calcMinimum (v: IMinMaxValue, x: number) {
        if (Number.isNaN(v.min)) {
            v.min = x;
        } else {
            v.min = x < v.min ? x : v.min;
        }
    }

    private calcMaximum (v: IMinMaxValue, x: number) {
        if (Number.isNaN(v.max)) {
            v.max = x;
        } else {
            v.max = x > v.max ? x : v.max;
        }
    }

    private calcAverage (v: IMinMaxValue, oldCnt: number, x: number) {
        if (Number.isNaN(v.avg)) {
            v.avg = x;
        } else {
            v.avg = (v.avg * oldCnt + x) / (oldCnt + 1);
        }
    }
}
