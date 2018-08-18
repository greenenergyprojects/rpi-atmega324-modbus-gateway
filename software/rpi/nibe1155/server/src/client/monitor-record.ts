
import { INibe1155Value } from '../devices/nibe1155-value';

export interface IMonitorRecordRawData {
    outdoorTemp:         INibe1155Value;
    supplyS1Temp:        INibe1155Value;
    supplyReturnTemp:    INibe1155Value;
    brineInTemp:         INibe1155Value;
    brineOutTemp:        INibe1155Value;
    condensorOutTemp:    INibe1155Value;
    hotGasTemp:          INibe1155Value;
    liquidLineTemp:      INibe1155Value;
    suctionTemp:         INibe1155Value;
    supplyTemp:          INibe1155Value;
    degreeMinutes:       INibe1155Value;
    electricHeaterPower: INibe1155Value;
    compressorFrequency: INibe1155Value;
    compressorInPower:   INibe1155Value;
    compressorState:     INibe1155Value;
    supplyPumpState:     INibe1155Value;
    brinePumpState:      INibe1155Value;
    supplyPumpSpeed:     INibe1155Value;
    brinePumpSpeed:      INibe1155Value;
}

export interface IMonitorRecordData {
    outdoorTemp:         number;
    supplyS1Temp:        number;
    supplyReturnTemp:    number;
    brineInTemp:         number;
    brineOutTemp:        number;
    condensorOutTemp:    number;
    hotGasTemp:          number;
    liquidLineTemp:      number;
    suctionTemp:         number;
    supplyTemp:          number;
    degreeMinutes:       number;
    electricHeaterPower: number;
    compressorFrequency: number;
    compressorInPower:   number;
    compressorState:     number;
    supplyPumpState:     number;
    brinePumpState:      number;
    supplyPumpSpeed:     number;
    brinePumpSpeed:      number;
}

export class MonitorRecord {

    public static create (data: IMonitorRecordData): MonitorRecord {
        return new MonitorRecord(data);
    }

    public static createFromRawData (data: IMonitorRecordRawData ): MonitorRecord {
        const d: IMonitorRecordData = {
            outdoorTemp:         data.outdoorTemp.value,
            supplyS1Temp:        data.supplyS1Temp.value,
            supplyReturnTemp:    data.supplyReturnTemp.value,
            brineInTemp:         data.brineInTemp.value,
            brineOutTemp:        data.brineOutTemp.value,
            condensorOutTemp:    data.condensorOutTemp.value,
            hotGasTemp:          data.hotGasTemp.value,
            liquidLineTemp:      data.liquidLineTemp.value,
            suctionTemp:         data.suctionTemp.value,
            supplyTemp:          data.supplyTemp.value,
            degreeMinutes:       data.degreeMinutes.value,
            electricHeaterPower: data.electricHeaterPower.value,
            compressorFrequency: data.compressorFrequency.value,
            compressorInPower:   data.compressorInPower.value,
            compressorState:     data.compressorState.value,
            supplyPumpState:     data.supplyPumpState.value,
            brinePumpState:      data.brinePumpState.value,
            supplyPumpSpeed:     data.supplyPumpSpeed.value,
            brinePumpSpeed:      data.brinePumpSpeed.value
        };
        return new MonitorRecord(d);
    }

    /* tslint:disable:member-ordering */
    private _createdAt: Date;
    private _data: IMonitorRecordData;
    /* tslint:enable:member-ordering */

    private constructor (data: IMonitorRecordData) {
        this._createdAt = new Date();
        this._data = data;
    }

    public get createdAt (): Date {
        return this._createdAt;
    }

    public get data (): IMonitorRecordData {
        return this._data;
    }

    public get outdoorTemp (): number {
        return this._data.outdoorTemp;
    }

    public get supplyS1Temp(): number {
        return this._data.supplyS1Temp;
    }

    public get supplyReturnTemp (): number {
        return this._data.supplyReturnTemp;
    }

    public get brineInTemp (): number {
        return this._data.brineInTemp;
    }

    public get brineOutTemp (): number {
        return this._data.brineOutTemp;
    }

    public get condensorOutTemp (): number {
        return this._data.condensorOutTemp;
    }

    public get hotGasTemp (): number {
        return this._data.hotGasTemp;
    }

    public get liquidLineTemp (): number {
        return this._data.liquidLineTemp;
    }

    public get suctionTemp (): number {
        return this._data.suctionTemp;
    }

    public get supplyTemp (): number {
        return this._data.supplyTemp;
    }

    public get degreeMinutes (): number {
        return this._data.degreeMinutes;
    }

    public get electricHeaterPower (): number {
        return this._data.electricHeaterPower;
    }

    public get compressorFrequency (): number {
        return this._data.compressorFrequency;
    }

    public get compressorInPower (): number {
        return this._data.compressorInPower;
    }

    public get compressorState (): number {
        return this._data.compressorState;
    }

    public get supplyPumpState (): number {
        return this._data.supplyPumpState;
    }

    public get brinePumpState (): number {
        return this._data.brinePumpState;
    }

    public get supplyPumpSpeed (): number {
        return this._data.supplyPumpSpeed;
    }

    public get brinePumpSpeed (): number {
        return this._data.brinePumpSpeed;
    }

    public toHumanReadableObject (): Object {
        const rv = {
            outdoorTemp:         this.normaliseUnit(this.outdoorTemp, 1, '°C'),
            supplyS1Temp:        this.normaliseUnit(this.supplyS1Temp, 1, '°C'),
            supplyReturnTemp:    this.normaliseUnit(this.supplyReturnTemp, 1, '°C'),
            brineInTemp:         this.normaliseUnit(this.brineInTemp, 1, '°C'),
            brineOutTemp:        this.normaliseUnit(this.brineOutTemp, 1, '°C'),
            condensorOutTemp:    this.normaliseUnit(this.condensorOutTemp, 1, '°C'),
            hotGasTemp:          this.normaliseUnit(this.hotGasTemp, 1, '°C'),
            liquidLineTemp:      this.normaliseUnit(this.liquidLineTemp, 1, '°C'),
            suctionTemp:         this.normaliseUnit(this.suctionTemp, 1, '°C'),
            supplyTemp:          this.normaliseUnit(this.supplyTemp, 1, '°C'),
            degreeMinutes:       this.normaliseUnit(this.degreeMinutes, 0),
            electricHeaterPower: this.normaliseUnit(this.electricHeaterPower, 0, 'W'),
            compressorFrequency: this.normaliseUnit(this.compressorFrequency, 0, 'Hz'),
            compressorInPower:   this.normaliseUnit(this.compressorInPower, 0, 'W'),
            compressorState:     this.normaliseUnit(this.compressorState, 0),
            supplyPumpState:     this.normaliseUnit(this.supplyPumpState, 0),
            brinePumpState:      this.normaliseUnit(this.brinePumpState, 0),
            supplyPumpSpeed:     this.normaliseUnit(this.supplyPumpSpeed, 0, '%'),
            brinePumpSpeed:      this.normaliseUnit(this.brinePumpSpeed, 0, '%')
        };
        return rv;
    }

    protected normaliseUnit (x: number, digits = 2, unit?: string): string {
        let k: number;
        switch (digits) {
            case 3: k = 1000; break;
            case 2: k = 100; break;
            case 1: k = 10; break;
            case 0:  k = 1; break;
            default: {
                k = 1;
                while (digits > 0) {
                    k *= 10;
                    digits--;
                }
            }
        }
        if (!unit)                   { return (Math.round(x * k) / k).toString(); }
        if (Math.abs(x) >   1000000) { return Math.round(x * k / 1000000) / k + 'M' + unit; }
        if (Math.abs(x) >      1000) { return Math.round(x * k / 1000) / k + 'k' + unit; }
        if (Math.abs(x) >=      0.1) { return Math.round(x * k) / k + unit; }
        if (Math.abs(x) >=    0.001) { return Math.round(x * k * 1000) / k + 'm' + unit; }
        if (Math.abs(x) >= 0.000001) { return Math.round(x * k * 1000000) / k + 'µ' + unit; }
        return x + unit;
    }
}

