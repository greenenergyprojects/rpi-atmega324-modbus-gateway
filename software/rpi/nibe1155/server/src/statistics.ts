import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('statistics');

import * as fs from 'fs';
import { sprintf } from 'sprintf-js';
import * as nconf from 'nconf';
import { MonitorRecord } from './client/monitor-record';

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
        , { id: 'outdoorTemp',         unit: '°C', label: 't-Außen/°C' }
        , { id: 'supplyTemp',          unit: '°C', label: 't-Puffer/°C' }
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
        // , { id: 'energy-heater', unit: 'Wh', label: 'Energie', hideMin: true, hideAvg: true }
    ];

    public static get Instance (): Statistics {
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
    private _timer: NodeJS.Timer;
    private _handleMonitorRecordCount = 0;
    private _history: StatisticsRecord [] = [];
    private _current: StatisticsRecordFactory;
    private _writeFileLines: IWriteFileLine [] = [];

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

    public handleMonitorRecord (d: MonitorRecord) {
        // debug.info('handleMonitorRecord %o', d);
        this._handleMonitorRecordCount++;
        if (!this._current) {
            this._current = new StatisticsRecordFactory(Statistics.CSVHEADER);
        }
        this._current.addMonitorRecord(d);
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
                this._current = null;
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
    values: IValue [];
}

export interface IHeaderItem {
    id: string;
    unit?: string;
    isRecordItem?: boolean;
    hideMin?: boolean;
    hideAvg?: boolean;
    hideMax?: boolean;
    label?: string;
}

export interface IValue {
    id: string;
    min: number;
    avg: number;
    max: number;
}

export class StatisticsRecord implements IStatisticsRecord  {
    protected _valueCount: number;
    protected _firstAt: Date;
    protected _lastAt: Date;
    protected _values: IValue [];

    public constructor (init?: IStatisticsRecord) {
        if (!init) {
            this._valueCount = 0;
            this._firstAt = null;
            this._lastAt = null;
            this._values = [];
        } else {
            this._valueCount = init.valueCount;
            const fat = init.firstAt;
            this._firstAt = fat instanceof Date ? fat : new Date(fat);
            const lat = init.lastAt;
            this._lastAt = lat instanceof Date ? lat : new Date(lat);
            this._values = init.values;
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

    public get values (): IValue [] {
        return this._values;
    }

    public toObject (preserveDate?: boolean): IStatisticsRecord {
        const rv: IStatisticsRecord = {
            valueCount: this._valueCount,
            firstAt:    preserveDate ? this._firstAt : this._firstAt.getTime(),
            lastAt:     preserveDate ? this._lastAt : this._lastAt.getTime(),
            values:     this._values
        };
        return rv;
    }

}

class StatisticsRecordFactory extends StatisticsRecord {

    private _header: IHeaderItem [];

    constructor (header: IHeaderItem []) {
        super();
        this._header = header;
        for (let i = 0; i < header.length; i++) {
            const h = header[i];
            if (h.isRecordItem) { continue; }
            this._values.push({ id: h.id, min: Number.NaN, avg: Number.NaN, max: Number.NaN });
        }
    }

    public addMonitorRecord (r: MonitorRecord) {
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
            const v = this._values[i + offset];
            if (v.id !== h.id) {
                debug.warn('error on header-id %s / value-id %s / index %d / offset %d', h.id, v.id, i, offset);
                continue;
            }
            switch (h.id) {
                case 'outdoorTemp':         this.handleValue(v, this._valueCount, r.outdoorTemp); break;
                case 'supplyTemp':          this.handleValue(v, this._valueCount, r.supplyTemp); break;
                case 'degreeMinutes':       this.handleValue(v, this._valueCount, r.degreeMinutes); break;
                case 'brinePumpSpeed':      this.handleValue(v, this._valueCount, r.brinePumpSpeed); break;
                case 'supplyPumpSpeed':     this.handleValue(v, this._valueCount, r.supplyPumpSpeed); break;
                case 'compressorFrequency': this.handleValue(v, this._valueCount, r.compressorFrequency); break;
                case 'compressorInPower':   this.handleValue(v, this._valueCount, r.compressorInPower); break;
                case 'electricHeaterPower': this.handleValue(v, this._valueCount, r.electricHeaterPower); break;
                case 'supplyS1Temp':        this.handleValue(v, this._valueCount, r.supplyS1Temp); break;
                case 'supplyReturnTemp':    this.handleValue(v, this._valueCount, r.supplyReturnTemp); break;
                case 'brineInTemp':         this.handleValue(v, this._valueCount, r.brineInTemp); break;
                case 'brineOutTemp':        this.handleValue(v, this._valueCount, r.brineOutTemp); break;
                case 'condensorOutTemp':    this.handleValue(v, this._valueCount, r.condensorOutTemp); break;
                case 'hotGasTemp':          this.handleValue(v, this._valueCount, r.hotGasTemp); break;
                case 'liquidLineTemp':      this.handleValue(v, this._valueCount, r.liquidLineTemp); break;
                case 'suctionTemp':         this.handleValue(v, this._valueCount, r.liquidLineTemp); break;
                case 'compressorState':     this.handleValue(v, this._valueCount, r.compressorState); break;
                case 'supplyPumpState':     this.handleValue(v, this._valueCount, r.supplyPumpState); break;
                case 'brinePumpState':      this.handleValue(v, this._valueCount, r.brinePumpState); break;
                default: debug.warn('unsupported id %s', h.id); break;
            }
        }
        this._valueCount++;
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
            let v: IValue;
            if (h.isRecordItem) {
                offset--;
            } else {
                v = this.values[i + offset];
            }
            s = s + (first ? '' : ',');

            if (v && v.id !== h.id) {
                debug.warn('error on header-id %s / value-id %s / index %d / offset %d', h.id, v.id, i, offset);
                s += '"ERR","ERR","ERR"';
            } else {
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
                    case 'outdoorTemp': case 'supplyTemp':
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

                    default: debug.warn('unsupported id %s', h.id); break;
                }
            }

        }
        return s;
    }

    private formatLineFragment (h: IHeaderItem, digits: number, values: IValue): string {
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

    private handleValue (v: IValue, cnt: number, x: number) {
        this.calcMinimum(v, x);
        this.calcMaximum(v, x);
        this.calcAverage(v, cnt, x);
    }

    private calcMinimum (v: IValue, x: number) {
        if (Number.isNaN(v.min)) {
            v.min = x;
        } else {
            v.min = x < v.min ? x : v.min;
        }
    }

    private calcMaximum (v: IValue, x: number) {
        if (Number.isNaN(v.max)) {
            v.max = x;
        } else {
            v.max = x > v.max ? x : v.max;
        }
    }

    private calcAverage (v: IValue, oldCnt: number, x: number) {
        if (Number.isNaN(v.avg)) {
            v.avg = x;
        } else {
            v.avg = (v.avg * oldCnt + x) / (oldCnt + 1);
        }
    }
}
