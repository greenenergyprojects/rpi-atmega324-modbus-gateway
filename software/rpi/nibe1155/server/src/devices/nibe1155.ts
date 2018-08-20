
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:Nibe1155');
const debugEvent: debugsx.IDefaultLogger = debugsx.createDefaultLogger('devices:Nibe1155:Event');

import * as fs from 'fs';
import * as events from 'events';

import { sprintf } from 'sprintf-js';

import { Nibe1155Value, INibe1155Value } from './nibe1155-value';
import { Nibe1155Modbus, Nibe1155ModbusAttributes, INibe1155 } from './nibe1155-modbus';
import { ModbusSerial } from '../modbus/modbus-serial';
import { ModbusRequest, ModbusRequestFactory } from '../modbus/modbus-request';
import { ModbusAsciiFrame } from '../modbus/modbus-ascii-frame';
import { Statistics } from '../statistics';
import { MonitorRecord } from '../client/monitor-record';
import { Value } from './value';

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


type Event = 'all' | keyof INibe1155;


export class Nibe1155 {


    public static async createInstance (serial: ModbusSerial): Promise<Nibe1155> {
        if (this._instance) { throw new Error('instance already created'); }
        const rv = new Nibe1155(serial);
        await rv.start();
        this._instance = rv;
        return rv;
    }

    public static get Instance (): Nibe1155 {
        if (!this._instance) { throw new Error('no instance created yet'); }
        return this._instance;
    }

    private static _instance: Nibe1155;

    // ******************************************************************

    private _serial: ModbusSerial;
    private _logSetIds: number [];
    private _idMap: { [ id: number ]: Nibe1155Value } = {};
    private _pollingTimer: NodeJS.Timer;
    private _pollingInProgress: boolean;
    private _eventEmitter = new events.EventEmitter();
    private _debugEventInfoIds: number [] = [];

    // LOG.SET registers
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

    // normal Registers
    private _roomTemp:           Nibe1155Value;
    private _outdoorTempAverage: Nibe1155Value;
    private _currentL1:          Nibe1155Value;
    private _currentL2:          Nibe1155Value;
    private _currentL3:          Nibe1155Value;
    private _supplyPumpMode:     Nibe1155Value;

    private constructor (serial: ModbusSerial) {
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

        this._roomTemp = new Nibe1155Value(Nibe1155Modbus.regDefByLable.roomTemp);
        this._outdoorTempAverage = new Nibe1155Value(Nibe1155Modbus.regDefByLable.outdoorTempAverage);
        this._currentL1 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.currentL1);
        this._currentL2 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.currentL2);
        this._currentL3 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.currentL3);
        this._supplyPumpMode = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyPumpMode);

        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (v instanceof Nibe1155Value) {
                this._idMap[v.id] = v;
            }
        }

        this._debugEventInfoIds.push(this.supplyPumpMode.id);

        // this.on('supplyPumpSpeed', (value, oldValue, v) => {
        //     debug.warn('----> change of %s: %s -> %s', v.label, oldValue, value);
        // });

    }

    public on (event: Event, listener: (value: number, oldValue?: number, v?: Nibe1155Value) => void): events.EventEmitter {
        return this._eventEmitter.on(event, listener);
    }

    public once (event: Event, listener: (value: number, oldValue?: number, v?: Nibe1155Value) => void): events.EventEmitter {
        return this._eventEmitter.once(event, listener);
    }

    public off (event: Event, listener: (value: number, oldValue?: number, v?: Nibe1155Value) => void): events.EventEmitter {
        return this._eventEmitter.off(event, listener);
    }

    public get eventEmitter (): events.EventEmitter {
        return this._eventEmitter;
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
            this.handleEventEmitter();
            this.writeLog(this.toNibe1155ValuesObject());
            Statistics.Instance.handleMonitorRecord(MonitorRecord.createFromRawData(this));
            // debug.info('%O', this.toNibe1155ValuesObject());
        } catch (err) {
            debug.warn('polling LOG.SET ids fails\n%e', err);
        }
        this._pollingInProgress = false;
    }


    public async readRegister (id: number): Promise<ModbusRequest> {
        try {
            const requ =  ModbusRequestFactory.createReadHoldRegister(1, id + 1, 1, false);
            await this._serial.send(requ);
            this.parseModbusResponse(id, 1, requ.response, requ.responseAt);
            return requ;
        } catch (err) {
            debug.warn(err);
            throw err;
        }
    }

    public async getRegisterValue (id: number, notOlderThanMillis?: number): Promise<number> {
        try {
            const x = this._idMap[id];
            if (x && notOlderThanMillis > 0 && x.valueAt instanceof Date) {
                const dt = Date.now() - x.valueAt.getTime();
                if (dt <= notOlderThanMillis) {
                    return x.value;
                }
            }
            const quantity = x && (x.size === 'u32' || x.size === 's32') ? 2 : 1;
            const requ =  ModbusRequestFactory.createReadHoldRegister(1, id + 1, quantity, false);
            await this._serial.send(requ);
            this.parseModbusResponse(id, 1, requ.response, requ.responseAt);
            return x ? x.value : requ.response.u16At(3);
        } catch (err) {
            debug.warn(err);
            throw err;
        }
    }

    public async writeRegister (id: number, value: number): Promise<ModbusRequest> {
        try {
            const requ =  ModbusRequestFactory.createWriteMultipleHoldRegisters(1, id + 1, 1, [ value ], false);
            await this._serial.send(requ);
            return requ;
        } catch (err) {
            debug.warn(err);
            throw err;
        }
    }

    public async readRoomTemp (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._roomTemp.id, notOlderThanMillis);
    }

    public async readOutdoorTempAverage (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._outdoorTempAverage.id, notOlderThanMillis);
    }

    public async readCurrentL1 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._currentL1.id, notOlderThanMillis);
    }

    public async readCurrentL2 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._currentL2.id, notOlderThanMillis);
    }

    public async readCurrentL3 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._currentL3.id, notOlderThanMillis);
    }

    public async readSupplyPumpMode (notOlderThanMillis?: number): Promise<'intermittent' | 'continous' | 'economy' | 'auto'> {
        const x = await this.getRegisterValue(this._supplyPumpMode.id, notOlderThanMillis);
        switch (x) {
            case 10: return 'intermittent';
            case 20: return 'continous';
            case 30: return 'economy';
            case 40: return 'auto';
            default: throw new Error('invalid response ' + x);
        }
    }


    public async writeDegreeMinutes (value: number): Promise<ModbusRequest> {
        value = Math.max(-30000, value);
        value = Math.min( 30000, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.degreeMinutes.id, value);
    }

    public async writeHeatCurve (value: number): Promise<ModbusRequest> {
        value = Math.max( 0, value);
        value = Math.min(15, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.heatCurveS1.id, value);
    }

    public async writeHeatOffset (value: number): Promise<ModbusRequest> {
        value = Math.max(-10, value);
        value = Math.min(+10, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.heatOffsetS1.id, value);
    }

    public async writeSupplyMin (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max( 50, value);
        value = Math.min(700, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyMinS1.id, Math.round(value));
    }

    public async writeSupplyMax (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max( 50, value);
        value = Math.min(800, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyMaxS1.id, Math.round(value));
    }

    public async writeOwnHeatCurvePoint (temp: -30 | -20 | -10 | 0 | 10 | 20 | 30, value: number): Promise<ModbusRequest> {
        value = Math.max( 5, value);
        value = Math.min(80, value);
        switch (temp) {
            case -30: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP1.id, Math.round(value));
            case -20: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP2.id, Math.round(value));
            case -10: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP3.id, Math.round(value));
            case   0: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP4.id, Math.round(value));
            case  10: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP5.id, Math.round(value));
            case  20: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP6.id, Math.round(value));
            case  30: return this.writeRegister(Nibe1155Modbus.regDefByLable.ownHeatCurveP7.id, Math.round(value));
            default: throw new Error('invalid temp ' + temp);
        }
    }

    public async writeOperationMode (mode: 'auto' | 'manual' | 'add heat only'): Promise<ModbusRequest> {
        switch (mode) {
            case 'auto':          return this.writeRegister(Nibe1155Modbus.regDefByLable.operationalMode.id, 0);
            case 'manual':        return this.writeRegister(Nibe1155Modbus.regDefByLable.operationalMode.id, 1);
            case 'add heat only': return this.writeRegister(Nibe1155Modbus.regDefByLable.operationalMode.id, 2);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeSupplyPumpMode (mode: 'intermittent' | 'continous' | 'economy' | 'auto'): Promise<ModbusRequest> {
        switch (mode) {
            case 'intermittent':  return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyPumpMode.id, 10);
            case 'continous':     return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyPumpMode.id, 20);
            case 'economy':       return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyPumpMode.id, 30);
            case 'auto':          return this.writeRegister(Nibe1155Modbus.regDefByLable.supplyPumpMode.id, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeBrinePumpMode (mode: 'intermittent' | 'continous' | 'economy' | 'auto'): Promise<ModbusRequest> {
        switch (mode) {
            case 'intermittent':  return this.writeRegister(Nibe1155Modbus.regDefByLable.brinePumpMode.id, 10);
            case 'continous':     return this.writeRegister(Nibe1155Modbus.regDefByLable.brinePumpMode.id, 20);
            case 'economy':       return this.writeRegister(Nibe1155Modbus.regDefByLable.brinePumpMode.id, 30);
            case 'auto':          return this.writeRegister(Nibe1155Modbus.regDefByLable.brinePumpMode.id, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeAddHeaterStart (degreeMinutes: number): Promise<ModbusRequest> {
        degreeMinutes = Math.max(-1000, degreeMinutes);
        degreeMinutes = Math.min(   30, degreeMinutes);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.dmStartAddHeating.id, Math.round(degreeMinutes));
    }

    public async writeAddHeaterStep (degreeMinutes: number): Promise<ModbusRequest> {
        degreeMinutes = Math.max(-32768, degreeMinutes);
        degreeMinutes = Math.min( 32767, degreeMinutes);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.addHeatingStep.id, Math.round(degreeMinutes));
    }

    public async writeAddHeaterMaxPower (value: number): Promise<ModbusRequest> {
        value = value / 10;
        value = Math.max(   0, value);
        value = Math.min( 600, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.addHeatingFuse.id, Math.round(value));
    }

    public async writeAddHeaterFuse (value: number): Promise<ModbusRequest> {
        value = Math.max(   0, value);
        value = Math.min( 400, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.addHeatingMaxPower.id, Math.round(value));
    }

    public async writeAllowAdditiveHeating (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(Nibe1155Modbus.regDefByLable.allowAdditiveHeating.id, 1);
            case false: return this.writeRegister(Nibe1155Modbus.regDefByLable.allowAdditiveHeating.id, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeAllowHeating (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(Nibe1155Modbus.regDefByLable.allowHeating.id, 1);
            case false: return this.writeRegister(Nibe1155Modbus.regDefByLable.allowHeating.id, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeStopTempHeating (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max(-200, value);
        value = Math.min( 400, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.stopTempHeating.id, Math.round(value));
    }

    public async writeStopTempAdditionalHeating (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max(-250, value);
        value = Math.min( 400, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.stopTempAddHeating.id, Math.round(value));
    }

    // 47072:
    public async writeDmDiffStartAddHeating (value: number): Promise<ModbusRequest> {
        value = Math.max( 100, value); // ?
        value = Math.min( 400, value); // ?
        return this.writeRegister(Nibe1155Modbus.regDefByLable.dmDiffStartAddHeating.id, Math.round(value));
    }

    public async writeActivateCutOffFreq1 (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequActivated1.id, 1);
            case false: return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequActivated1.id, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeActivateCutOffFreq2 (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequActivated2.id, 1);
            case false: return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequActivated2.id, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeCutOffFreq1Start (value: number): Promise<ModbusRequest> {
        value = Math.max(  17, value);
        value = Math.min( 115, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequStart1.id, Math.round(value));
    }

    public async writeCutOffFreq1Stop (value: number): Promise<ModbusRequest> {
        value = Math.max(  22, value);
        value = Math.min( 120, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequStop1.id, Math.round(value));
    }

    public async writeCutOffFreq2Start (value: number): Promise<ModbusRequest> {
        value = Math.max(  17, value);
        value = Math.min( 115, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequStart2.id, Math.round(value));
    }

    public async writeCutOffFreq2Stop (value: number): Promise<ModbusRequest> {
        value = Math.max(  22, value);
        value = Math.min( 120, value);
        return this.writeRegister(Nibe1155Modbus.regDefByLable.cutOffFrequStop2.id, Math.round(value));
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

    private async start () {
        await this.pollLogSetValues();
        this._pollingTimer = setInterval( () => {
            this.pollLogSetValues();
        }, 1000);
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
        const date = sprintf('%04d-%02d-%02d', now.getFullYear(), now.getMonth() + 1, now.getDate());
        const fn = sprintf('/var/log/fronius/nibe1155_%s.csv', date);
        let data = sprintf('"%02d:%02d:%02d"', now.getHours(), now.getMinutes(), now.getSeconds());
        let header = fs.existsSync(fn) ? null : sprintf('"Time (%s)"', date);
        for (const att in x) {
            if (!x.hasOwnProperty(att)) { continue; }
            const v = (<any>this)[att];
            if (header !== null) {
                header += sprintf(',"%s/%s"', v.label, v.unit);
            }
            data += sprintf(',"%s"', v.value);
        }
        if (header !== null) {
            fs.writeFileSync(fn, header + '\n' + data.replace(/\./g, ',') + '\n');
        } else {
            fs.appendFileSync(fn, data.replace(/\./g, ',') + '\n');
        }
    }

    private handleEventEmitter () {
        const changed: Nibe1155Value [] = [];
        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (!(v instanceof Nibe1155Value)) { continue; }
            if (v.isValueChanged) {
                changed.push(v);
            }
        }

        for (const v of changed) {
            const msg = sprintf('change-event - (%s) %s: %s -> %s', v.id, v.label, v.oldValue, v.value);
            if (this._debugEventInfoIds.findIndex( (x) => x === v.id) === -1) {
                debugEvent.fine(msg);
            } else {
                debugEvent.info(msg);
            }
            this._eventEmitter.emit('all', v.value, v.oldValue, v);
            this._eventEmitter.emit(v.label, v.value, v.oldValue, v);
        }

    }


}




