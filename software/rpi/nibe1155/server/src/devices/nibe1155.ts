
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:Nibe1155');

import * as fs from 'fs';

import { sprintf } from 'sprintf-js';

import { Nibe1155Value, INibe1155Value } from './nibe1155-value';
import { Nibe1155Modbus, Nibe1155ModbusAttributes, INibe1155 } from './nibe1155-modbus';
import { ModbusSerial } from '../modbus/modbus-serial';
import { ModbusRequest, ModbusRequestFactory } from '../modbus/modbus-request';
import { ModbusAsciiFrame } from '../modbus/modbus-ascii-frame';
import { fstat } from 'fs';

// abstract class Nibe1155 extends { [ id in Nibe1155ModbusAttributes ]: Nibe1155Value } = {

// }

export interface INibe1155Values {
    outdoorTemp:         string;
    supplyS1Temp:        string;
    supplyReturnTemp:    string;
    brineInTemp:         string;
    brineOutTemp:        string;
    condensorOutTemp:    string;
    hotGasTemp:          string;
    liquidLineTemp:      string;
    suctionTemp:         string;
    supplyTemp:          string;
    degreeMinutes:       string;
    electricHeaterPower: string;
    compressorFrequency: string;
    compressorInPower:   string;
    compressorState:     string;
    supplyPumpState:     string;
    brinePumpState:      string;
    supplyPumpSpeed:     string;
    brinePumpSpeed:      string;
}

// interface INibe1155 {
//     outdoorTemp:         INibe1155Value;
//     supplyS1Temp:        INibe1155Value;
//     supplyReturnTemp:    INibe1155Value;
//     brineInTemp:         INibe1155Value;
//     brineOutTemp:        INibe1155Value;
//     condensorOutTemp:    INibe1155Value;
//     hotGasTemp:          INibe1155Value;
//     liquidLineTemp:      INibe1155Value;
//     suctionTemp:         INibe1155Value;
//     supplyTemp:          INibe1155Value;
//     degreeMinutes:       INibe1155Value;
//     electricHeaterPower: INibe1155Value;
//     compressorFrequency: INibe1155Value;
//     compressorInPower:   INibe1155Value;
//     compressorState:     INibe1155Value;
//     supplyPumpState:     INibe1155Value;
//     brinePumpState:      INibe1155Value;
//     supplyPumpSpeed:     INibe1155Value;
//     brinePumpSpeed:      INibe1155Value;
// }


type TodoKeys = keyof INibe1155;

export class Nibe1155 {

    private _serial: ModbusSerial;
    private _logSetIds: number [];
    private _idMap: { [ id: number ]: Nibe1155Value } = {};
    private _pollingTimer: NodeJS.Timer;
    private _pollingInProgress: boolean;

    private _outdoorTemp:         Nibe1155Value;
    private _supplyS1Temp:        Nibe1155Value;
    private _supplyReturnTemp:    Nibe1155Value;
    private _brineInTemp:         Nibe1155Value;
    private _brineOutTemp:        Nibe1155Value;
    private _condensorOutTemp:    Nibe1155Value;
    private _hotGasTemp:          Nibe1155Value;
    private _liquidLineTemp:      Nibe1155Value;
    private _suctionTemp:         Nibe1155Value;
    private _supplyTemp:          Nibe1155Value;
    private _degreeMinutes:       Nibe1155Value;
    private _electricHeaterPower: Nibe1155Value;
    private _compressorFrequency: Nibe1155Value;
    private _compressorInPower:   Nibe1155Value;
    private _compressorState:     Nibe1155Value;
    private _supplyPumpState:     Nibe1155Value;
    private _brinePumpState:      Nibe1155Value;
    private _supplyPumpSpeed:     Nibe1155Value;
    private _brinePumpSpeed:      Nibe1155Value;

    constructor (serial: ModbusSerial) {
        this._serial = serial;

        this._outdoorTemp         = new Nibe1155Value(Nibe1155Modbus.regDefByLable.outdoorTemp);
        this._supplyS1Temp        = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyS1Temp);
        this._supplyReturnTemp    = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyReturnTemp);
        this._brineInTemp         = new Nibe1155Value(Nibe1155Modbus.regDefByLable.brineInTemp);
        this._brineOutTemp        = new Nibe1155Value(Nibe1155Modbus.regDefByLable.brineOutTemp);
        this._condensorOutTemp    = new Nibe1155Value(Nibe1155Modbus.regDefByLable.condensorOutTemp);
        this._hotGasTemp          = new Nibe1155Value(Nibe1155Modbus.regDefByLable.hotGasTemp);
        this._liquidLineTemp      = new Nibe1155Value(Nibe1155Modbus.regDefByLable.liquidLineTemp);
        this._suctionTemp         = new Nibe1155Value(Nibe1155Modbus.regDefByLable.suctionTemp);
        this._supplyTemp          = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyTemp);
        this._degreeMinutes       = new Nibe1155Value(Nibe1155Modbus.regDefByLable.degreeMinutes);
        this._electricHeaterPower = new Nibe1155Value(Nibe1155Modbus.regDefByLable.electricHeaterPower);
        this._compressorFrequency = new Nibe1155Value(Nibe1155Modbus.regDefByLable.compressorFrequency);
        this._compressorInPower   = new Nibe1155Value(Nibe1155Modbus.regDefByLable.compressorInPower);
        this._compressorState     = new Nibe1155Value(Nibe1155Modbus.regDefByLable.compressorState);
        this._supplyPumpState     = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyPumpState);
        this._brinePumpState      = new Nibe1155Value(Nibe1155Modbus.regDefByLable.brinePumpState);
        this._supplyPumpSpeed     = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyPumpSpeed);
        this._brinePumpSpeed      = new Nibe1155Value(Nibe1155Modbus.regDefByLable.brinePumpSpeed);

        this._logSetIds = [
            40004, 40008, 40012, 40015, 40016, 40017, 40018, 40019, 40022, 40071,
            43005, 43084, 43136, 43141, 43427, 43431, 43433, 43437, 43439
        ];

        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (v instanceof Nibe1155Value) {
                this._idMap[v.id] = v;
            }
        }
    }

    public async start () {
        await this.pollLogSetValues();
        this._pollingTimer = setInterval( () => {
            this.pollLogSetValues();
        }, 1000);
    }

    public async pollLogSetValues () {
        if (this._pollingInProgress) { return; }
        debug.fine('start polling LOG.SET ids');
        this._pollingInProgress = true;
        try {
            for (let i = 0; i < this._logSetIds.length; i++) {
                const firstAdd = this._logSetIds[i];
                let lastAdd = firstAdd;
                while (i < (this._logSetIds.length - 1) && this._logSetIds[i + 1] === (lastAdd + 1)) {
                    lastAdd = this._logSetIds[++i];
                }
                const quantity = lastAdd - firstAdd + 1;
                try {
                    const requ = ModbusRequestFactory.createReadHoldRegister(1, firstAdd + 1, quantity, false);
                    await this._serial.send(requ);
                    const time = Math.round((requ.responseAt.getTime() - requ.requestReceivedAt.getTime()) / 100) / 10;
                    if (time > 0.6) {
                        debug.warn('register id %s is not in LOG.SET', lastAdd);
                    }
                    debug.fine('polling %s registers starting by id %s in %s seconds', quantity, firstAdd, time);
                    this.parseModbusResponse(firstAdd, quantity, requ.response, requ.responseAt);
                } catch (err) {
                    debug.warn('polling %s register starting on id %s fails\n%e', quantity, firstAdd, err);
                }
            }
            this.writeLog(this.toNibe1155ValuesObject());
            // debug.info('%O', this.toNibe1155ValuesObject());
        } catch (err) {
            debug.warn('polling LOG.SET ids fails\n%e', err);
        }
        this._pollingInProgress = false;
    }


    // ************************************************************

    public get outdoorTemp (): Nibe1155Value {
        return this._outdoorTemp;
    }

    public get supplyS1Temp (): Nibe1155Value {
        return this._supplyS1Temp;
    }

    public get supplyReturnTemp (): Nibe1155Value {
        return this._supplyReturnTemp;
    }

    public get brineInTemp (): Nibe1155Value {
        return this._brineInTemp;
    }

    public get brineOutTemp (): Nibe1155Value {
        return this._brineOutTemp;
    }

    public get condensorOutTemp (): Nibe1155Value {
        return this._condensorOutTemp;
    }

    public get hotGasTemp (): Nibe1155Value {
        return this._hotGasTemp;
    }

    public get liquidLineTemp (): Nibe1155Value {
        return this._liquidLineTemp;
    }

    public get suctionTemp (): Nibe1155Value {
        return this._suctionTemp;
    }

    public get supplyTemp (): Nibe1155Value {
        return this._supplyTemp;
    }

    public get degreeMinutes (): Nibe1155Value {
        return this._degreeMinutes;
    }

    public get electricHeaterPower (): Nibe1155Value {
        return this._electricHeaterPower;
    }

    public get compressorFrequency (): Nibe1155Value {
        return this._compressorFrequency;
    }

    public get compressorInPower (): Nibe1155Value {
        return this._compressorInPower;
    }

    public get compressorState (): Nibe1155Value {
        return this._compressorState;
    }

    public get supplyPumpState (): Nibe1155Value {
        return this._supplyPumpState;
    }

    public get brinePumpState (): Nibe1155Value {
        return this._brinePumpState;
    }

    public get supplyPumpSpeed (): Nibe1155Value {
        return this._supplyPumpSpeed;
    }

    public get brinePumpSpeed (): Nibe1155Value {
        return this._brinePumpSpeed;
    }

    public toObject (preserveDate?: boolean): INibe1155 {
        return null;
    }

    public toValuesObject (): { [ id: string ]: string } {
        const rv: { [ id: string ]: string } = {};
        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (v instanceof Nibe1155Value) {
                const x = sprintf(v.format, v.value);
                rv[v.label] = sprintf('%s%s', x.trim(), v.unit);
            }
        }
        return rv;
    }

    public toNibe1155ValuesObject (): INibe1155Values {
        const v = this.toValuesObject();
        const rv: INibe1155Values = {
            outdoorTemp:         v.outdoorTemp,
            supplyS1Temp:        v.supplyS1Temp,
            supplyReturnTemp:    v.supplyReturnTemp,
            brineInTemp:         v.brineInTemp,
            brineOutTemp:        v.brineOutTemp,
            condensorOutTemp:    v.condensorOutTemp,
            hotGasTemp:          v.hotGasTemp,
            liquidLineTemp:      v.liquidLineTemp,
            suctionTemp:         v.suctionTemp,
            supplyTemp:          v.supplyTemp,
            degreeMinutes:       v.degreeMinutes,
            electricHeaterPower: v.electricHeaterPower,
            compressorFrequency: v.compressorFrequency,
            compressorInPower:   v.compressorInPower,
            compressorState:     v.compressorState,
            supplyPumpState:     v.supplyPumpState,
            brinePumpState:      v.brinePumpState,
            supplyPumpSpeed:     v.supplyPumpSpeed,
            brinePumpSpeed:      v.brinePumpSpeed
        };
        return rv;
    }

    private parseModbusResponse (id: number, quantity: number, response: ModbusAsciiFrame, at: Date) {
        let offset = 3;
        while (quantity-- > 0) {
            const x = this._idMap[id++];
            if (!x) {
                debug.warn('skip response id %s, id not in idMap', id - 1);
                continue;
            }
            switch (x.size) {
                case 'u8': case 's8': case 'u16': case 's16': {
                    x.setRawValue(response.u16At(offset), at); offset += 2;
                    break;
                }

                case 'u32': case 's32': {
                    x.setRawValue(response.u32At(offset), at); offset += 4;
                    break;
                }

                default: debug.warn('skip response id %s, invalid size %s', id, x.size);
            }
        }
    }

    private writeLog (x: INibe1155Values) {
        const now = new Date();
        const fn = sprintf('/var/log/fronius/nibe1155_%04d-%02d-%02d.csv', now.getFullYear(), now.getMonth() + 1, now.getDate());
        let data = '';
        let header = fs.existsSync(fn) ? null : '';
        let first = true;
        for (const att in x) {
            if (!x.hasOwnProperty(att)) { continue; }
            const v = (<any>this)[att];
            if (!v || !(v instanceof Nibe1155Value)) { continue; }
            if (first) {
                first = false;
            } else {
                if (header !== null) { header += ','; }
                data += ',';
            }
            if (header !== null) {
                header += sprintf('"%s/%s"', v.label, v.unit);
            }
            data += sprintf('"%s"', v.value);
        }
        if (header !== null) {
            fs.writeFileSync(fn, header + '\n' + data.replace(/\./g, ',') + '\n');
        } else {
            fs.appendFileSync(fn, data.replace(/\./g, ',') + '\n');
        }
    }
}




