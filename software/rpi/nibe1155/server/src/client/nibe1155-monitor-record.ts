
import { INibe1155Value, Nibe1155Value } from '../devices/nibe1155-value';
import { Nibe1155 } from '../devices/nibe1155';

export interface INibe1155MonitorRecordData {
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
    calcSupplyTemp:      INibe1155Value;
    electricHeaterPower: INibe1155Value;
    compressorFrequency: INibe1155Value;
    compressorInPower:   INibe1155Value;
    compressorState:     INibe1155Value;
    supplyPumpState:     INibe1155Value;
    brinePumpState:      INibe1155Value;
    supplyPumpSpeed:     INibe1155Value;
    brinePumpSpeed:      INibe1155Value;
}

export interface INibe1155MonitorRecordValues {
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
    calcSupplyTemp:      number;
    electricHeaterPower: number;
    compressorFrequency: number;
    compressorInPower:   number;
    compressorState:     number;
    supplyPumpState:     number;
    brinePumpState:      number;
    supplyPumpSpeed:     number;
    brinePumpSpeed:      number;
}

export interface INibe1155MonitorRecord {
    createdAt: Date;
    data: INibe1155MonitorRecordData;
}

export class Nibe1155MonitorRecord {

    // public static create (data: INibe1155MonitorRecordData): Nibe1155MonitorRecord {
    //     return new Nibe1155MonitorRecord(data);
    // }

    public static createInstance (nibe1155: Nibe1155 ): Nibe1155MonitorRecord {
        const d: INibe1155MonitorRecordData = {
            supplyS1Temp:        nibe1155.supplyS1Temp.toObject(),
            supplyReturnTemp:    nibe1155.supplyReturnTemp.toObject(),
            brineInTemp:         nibe1155.brineInTemp.toObject(),
            brineOutTemp:        nibe1155.brineOutTemp.toObject(),
            condensorOutTemp:    nibe1155.condensorOutTemp.toObject(),
            hotGasTemp:          nibe1155.hotGasTemp.toObject(),
            liquidLineTemp:      nibe1155.liquidLineTemp.toObject(),
            suctionTemp:         nibe1155.suctionTemp.toObject(),
            supplyTemp:          nibe1155.supplyTemp.toObject(),
            degreeMinutes:       nibe1155.degreeMinutes.toObject(),
            calcSupplyTemp:      nibe1155.calcSupplyTemp.toObject(),
            electricHeaterPower: nibe1155.electricHeaterPower.toObject(),
            compressorFrequency: nibe1155.compressorFrequency.toObject(),
            compressorInPower:   nibe1155.compressorInPower.toObject(),
            compressorState:     nibe1155.compressorState.toObject(),
            supplyPumpState:     nibe1155.supplyPumpState.toObject(),
            brinePumpState:      nibe1155.brinePumpState.toObject(),
            supplyPumpSpeed:     nibe1155.supplyPumpSpeed.toObject(),
            brinePumpSpeed:      nibe1155.brinePumpSpeed.toObject()
        };
        return new Nibe1155MonitorRecord(d);
    }

    /* tslint:disable:member-ordering */
    private _createdAt: Date;
    private _data: INibe1155MonitorRecordData;
    /* tslint:enable:member-ordering */

    private constructor (data: INibe1155MonitorRecordData) {
        this._createdAt = new Date();
        this._data = data;
    }

    public get createdAt (): Date {
        return this._createdAt;
    }

    public get data (): INibe1155MonitorRecordData {
        return this._data;
    }

    public get supplyS1Temp(): number {
        return this._data.supplyS1Temp.value;
    }

    public get supplyReturnTemp (): number {
        return this._data.supplyReturnTemp.value;
    }

    public get brineInTemp (): number {
        return this._data.brineInTemp.value;
    }

    public get brineOutTemp (): number {
        return this._data.brineOutTemp.value;
    }

    public get condensorOutTemp (): number {
        return this._data.condensorOutTemp.value;
    }

    public get hotGasTemp (): number {
        return this._data.hotGasTemp.value;
    }

    public get liquidLineTemp (): number {
        return this._data.liquidLineTemp.value;
    }

    public get suctionTemp (): number {
        return this._data.suctionTemp.value;
    }

    public get supplyTemp (): number {
        return this._data.supplyTemp.value;
    }

    public get degreeMinutes (): number {
        return this._data.degreeMinutes.value;
    }

    public get calcSupplyTemp (): number {
        return this._data.calcSupplyTemp.value;
    }

    public get electricHeaterPower (): number {
        return this._data.electricHeaterPower.value;
    }

    public get compressorFrequency (): number {
        return this._data.compressorFrequency.value;
    }

    public get compressorInPower (): number {
        return this._data.compressorInPower.value;
    }

    public get compressorState (): number {
        return this._data.compressorState.value;
    }

    public get supplyPumpState (): number {
        return this._data.supplyPumpState.value;
    }

    public get brinePumpState (): number {
        return this._data.brinePumpState.value;
    }

    public get supplyPumpSpeed (): number {
        return this._data.supplyPumpSpeed.value;
    }

    public get brinePumpSpeed (): number {
        return this._data.brinePumpSpeed.value;
    }

    /* tslint:disable:max-line-length */
    public toObject (): INibe1155MonitorRecord {
        return {
            createdAt: this._createdAt,
            data: {
                supplyS1Temp:        this._data.supplyS1Temp        instanceof Nibe1155Value ? this._data.supplyS1Temp.toObject() : this._data.supplyS1Temp,
                supplyReturnTemp:    this._data.supplyReturnTemp    instanceof Nibe1155Value ? this._data.supplyReturnTemp.toObject() : this._data.supplyReturnTemp,
                brineInTemp:         this._data.brineInTemp         instanceof Nibe1155Value ? this._data.brineInTemp.toObject() : this._data.brineInTemp,
                brineOutTemp:        this._data.brineOutTemp        instanceof Nibe1155Value ? this._data.brineOutTemp.toObject() : this._data.brineOutTemp,
                condensorOutTemp:    this._data.condensorOutTemp    instanceof Nibe1155Value ? this._data.condensorOutTemp.toObject() : this._data.condensorOutTemp,
                hotGasTemp:          this._data.hotGasTemp          instanceof Nibe1155Value ? this._data.hotGasTemp.toObject() : this._data.hotGasTemp,
                liquidLineTemp:      this._data.liquidLineTemp      instanceof Nibe1155Value ? this._data.liquidLineTemp.toObject() : this._data.liquidLineTemp,
                suctionTemp:         this._data.suctionTemp         instanceof Nibe1155Value ? this._data.suctionTemp.toObject() : this._data.suctionTemp,
                supplyTemp:          this._data.supplyTemp          instanceof Nibe1155Value ? this._data.supplyTemp.toObject() : this._data.supplyTemp,
                degreeMinutes:       this._data.degreeMinutes       instanceof Nibe1155Value ? this._data.degreeMinutes.toObject() : this._data.degreeMinutes,
                calcSupplyTemp:      this._data.calcSupplyTemp      instanceof Nibe1155Value ? this._data.calcSupplyTemp.toObject() : this._data.calcSupplyTemp,
                electricHeaterPower: this._data.electricHeaterPower instanceof Nibe1155Value ? this._data.electricHeaterPower.toObject() : this._data.electricHeaterPower,
                compressorFrequency: this._data.compressorFrequency instanceof Nibe1155Value ? this._data.compressorFrequency.toObject() : this._data.compressorFrequency,
                compressorInPower:   this._data.compressorInPower   instanceof Nibe1155Value ? this._data.compressorInPower.toObject() : this._data.compressorInPower,
                compressorState:     this._data.compressorState     instanceof Nibe1155Value ? this._data.compressorState.toObject() : this._data.compressorState,
                supplyPumpState:     this._data.supplyPumpState     instanceof Nibe1155Value ? this._data.supplyPumpState.toObject() : this._data.supplyPumpState,
                brinePumpState:      this._data.brinePumpState      instanceof Nibe1155Value ? this._data.brinePumpState.toObject() : this._data.brinePumpState,
                supplyPumpSpeed:     this._data.supplyPumpSpeed     instanceof Nibe1155Value ? this._data.supplyPumpSpeed.toObject() : this._data.supplyPumpSpeed,
                brinePumpSpeed:      this._data.brinePumpSpeed      instanceof Nibe1155Value ? this._data.brinePumpSpeed.toObject() : this._data.brinePumpSpeed
            }
        };
    }
    /* tslint:enable:max-line-length */

    public toHumanReadableObject (): Object {
        const rv = {
            createdAt:           this._createdAt,
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
            calcSupplyTemp:      this.normaliseUnit(this.calcSupplyTemp, 1, '°C'),
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

// class Nibe1155MonitorRecordRawData extends  INibe1155MonitorRecordRawData {
//     private _supplyS1Temp:        Nibe1155Value;
//     private _supplyReturnTemp:    Nibe1155Value;
//     private _brineInTemp:         Nibe1155Value;
//     private _brineOutTemp:        Nibe1155Value;
//     private _condensorOutTemp:    Nibe1155Value;
//     private _hotGasTemp:          Nibe1155Value;
//     private _liquidLineTemp:      Nibe1155Value;
//     private _suctionTemp:         Nibe1155Value;
//     private _supplyTemp:          Nibe1155Value;
//     private _degreeMinutes:       Nibe1155Value;
//     private _calcSupplyTemp:      Nibe1155Value;
//     private _electricHeaterPower: Nibe1155Value;
//     private _compressorFrequency: Nibe1155Value;
//     private _compressorInPower:   Nibe1155Value;
//     private _compressorState:     Nibe1155Value;
//     private _supplyPumpState:     Nibe1155Value;
//     private _brinePumpState:      Nibe1155Value;
//     private _supplyPumpSpeed:     Nibe1155Value;
//     private _brinePumpSpeed:      Nibe1155Value;
// }


