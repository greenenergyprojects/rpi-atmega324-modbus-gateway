
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:Nibe1155');
const debugEvent: debugsx.IDefaultLogger = debugsx.createDefaultLogger('Nibe1155.Event');

import * as fs from 'fs';
import * as events from 'events';

import { sprintf } from 'sprintf-js';

import { Nibe1155Value, Nibe1155PumpStateValue, Nibe1155PumpModeValue, Nibe1155OperationModeValue } from './nibe1155-value';
import { Nibe1155Modbus, INibe1155 } from './nibe1155-modbus';
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

export interface IExtendedNibe1155Values extends INibe1155Values {
    roomTemp:              string;
    outdoorTempAverage:    string;
    currentL1:             string;
    currentL2:             string;
    currentL3:             string;
    heatCurve:             string;
    heatOffset:            string;
    heatTempMin:           string;
    heatTempMax:           string;
    ownHeatCurveP1:        string;
    ownHeatCurveP2:        string;
    ownHeatCurveP3:        string;
    ownHeatCurveP4:        string;
    ownHeatCurveP5:        string;
    ownHeatCurveP6:        string;
    ownHeatCurveP7:        string;
    operationalMode:       string;
    supplyPumpMode:        string;
    brinePumpMode:         string;
    dmStartHeating:        string;
    addHeatingStep:        string;
    addHeatingMaxPower:    string;
    addHeatingFuse:        string;
    allowAdditiveHeating:  string;
    allowHeating:          string;
    stopTempHeating:       string;
    stopTempAddHeating:    string;
    dmDiffStartAddHeating: string;
    cutOffFrequActivated2: string;
    cutOffFrequActivated1: string;
    cutOffFrequStart2:     string;
    cutOffFrequStart1:     string;
    cutOffFrequStop2:      string;
    cutOffFrequStop1:      string;
}



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
    private _setPointDegreeMinutes: number;
    private _nonLogSetRegs: Nibe1155Value [] = [];
    private _rwNonLogRegs: {
                               reg: Nibe1155Value | number, value?: number, res: (req: ModbusRequest) => void, rej: (err: any) => void
                           } [] = [];
    private _readNonLogRegsIndex = 0;
    private _readNonLogRegCnt = 0;
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
    private _supplyPumpState:     Nibe1155PumpStateValue;
    private _brinePumpState:      Nibe1155PumpStateValue;
    private _supplyPumpSpeed:     Nibe1155Value;
    private _brinePumpSpeed:      Nibe1155Value;

    // normal Registers
    private _roomTemp:              Nibe1155Value;
    private _outdoorTempAverage:    Nibe1155Value;
    private _currentL1:             Nibe1155Value;
    private _currentL2:             Nibe1155Value;
    private _currentL3:             Nibe1155Value;
    private _heatCurve:             Nibe1155Value;
    private _heatOffset:            Nibe1155Value;
    private _heatTempMin:           Nibe1155Value;
    private _heatTempMax:           Nibe1155Value;
    private _ownHeatCurveP1:        Nibe1155Value;
    private _ownHeatCurveP2:        Nibe1155Value;
    private _ownHeatCurveP3:        Nibe1155Value;
    private _ownHeatCurveP4:        Nibe1155Value;
    private _ownHeatCurveP5:        Nibe1155Value;
    private _ownHeatCurveP6:        Nibe1155Value;
    private _ownHeatCurveP7:        Nibe1155Value;
    private _operationalMode:       Nibe1155OperationModeValue;
    private _supplyPumpMode:        Nibe1155PumpModeValue;
    private _brinePumpMode:         Nibe1155PumpModeValue;
    private _dmStartHeating:        Nibe1155Value;
    private _addHeatingStep:        Nibe1155Value;
    private _addHeatingMaxPower:    Nibe1155Value;
    private _addHeatingFuse:        Nibe1155Value;
    private _allowAdditiveHeating:  Nibe1155Value;
    private _allowHeating:          Nibe1155Value;
    private _stopTempHeating:       Nibe1155Value;
    private _stopTempAddHeating:    Nibe1155Value;
    private _dmDiffStartAddHeating: Nibe1155Value;
    private _cutOffFrequActivated2: Nibe1155Value;
    private _cutOffFrequActivated1: Nibe1155Value;
    private _cutOffFrequStart2:     Nibe1155Value;
    private _cutOffFrequStart1:     Nibe1155Value;
    private _cutOffFrequStop2:      Nibe1155Value;
    private _cutOffFrequStop1:      Nibe1155Value;

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
        this._supplyPumpState     = new Nibe1155PumpStateValue(Nibe1155Modbus.regDefByLable.supplyPumpState);
        this._brinePumpState      = new Nibe1155PumpStateValue(Nibe1155Modbus.regDefByLable.brinePumpState);
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
        this._heatCurve = new Nibe1155Value(Nibe1155Modbus.regDefByLable.heatCurveS1);
        this._heatOffset = new Nibe1155Value(Nibe1155Modbus.regDefByLable.heatOffsetS1);
        this._heatTempMin = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyMinS1);
        this._heatTempMax = new Nibe1155Value(Nibe1155Modbus.regDefByLable.supplyMaxS1);
        this._ownHeatCurveP1 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP1);
        this._ownHeatCurveP2 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP2);
        this._ownHeatCurveP3 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP3);
        this._ownHeatCurveP4 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP4);
        this._ownHeatCurveP5 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP5);
        this._ownHeatCurveP6 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP6);
        this._ownHeatCurveP7 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.ownHeatCurveP7);
        this._operationalMode = new Nibe1155OperationModeValue(Nibe1155Modbus.regDefByLable.operationalMode);
        this._supplyPumpMode = new Nibe1155PumpModeValue(Nibe1155Modbus.regDefByLable.supplyPumpMode);
        this._brinePumpMode = new Nibe1155PumpModeValue(Nibe1155Modbus.regDefByLable.brinePumpMode);
        this._dmStartHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.dmStartHeating);
        this._addHeatingStep = new Nibe1155Value(Nibe1155Modbus.regDefByLable.addHeatingStep);
        this._addHeatingMaxPower = new Nibe1155Value(Nibe1155Modbus.regDefByLable.addHeatingMaxPower);
        this._addHeatingFuse = new Nibe1155Value(Nibe1155Modbus.regDefByLable.addHeatingFuse);
        this._allowAdditiveHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.allowAdditiveHeating);
        this._allowHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.allowHeating);
        this._stopTempHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.stopTempHeating);
        this._stopTempAddHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.stopTempAddHeating);
        this._dmDiffStartAddHeating = new Nibe1155Value(Nibe1155Modbus.regDefByLable.dmDiffStartAddHeating);
        this._cutOffFrequActivated2 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequActivated2);
        this._cutOffFrequActivated1 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequActivated1);
        this._cutOffFrequStart2 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequStart2);
        this._cutOffFrequStart1 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequStart1);
        this._cutOffFrequStop2 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequStop2);
        this._cutOffFrequStop1 = new Nibe1155Value(Nibe1155Modbus.regDefByLable.cutOffFrequStop1);

        this._nonLogSetRegs = [];
        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (v instanceof Nibe1155Value) {
                this._idMap[v.id] = v;
                if (this._logSetIds.findIndex( (x) => x === v.id) < 0) {
                    this._nonLogSetRegs.push(v);
                }
            }
        }

        this._debugEventInfoIds.push(this._supplyPumpSpeed.id);
        this._debugEventInfoIds.push(this._brinePumpSpeed.id);
        this._debugEventInfoIds.push(this._compressorFrequency.id);

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

    public get setPointDegreeMinutes (): number {
        return this._setPointDegreeMinutes;
    }

    public set setPointDegreeMinutes (value: number) {
        if (value !== undefined && (value < -30000 || value > 30000)) { throw new Error('invalid value ' + value); }
        this._setPointDegreeMinutes = value;
    }

    public async getRegisterValue (id: number, notOlderThanMillis?: number): Promise<number> {
        try {
            const x = this._idMap[id];
            if (!x) { throw new Error('invalid id ' + id); }
            if (notOlderThanMillis === undefined) {
                return x.value;
            } else if ( notOlderThanMillis > 0 && x.valueAt instanceof Date) {
                const dt = Date.now() - x.valueAt.getTime();
                if (dt <= notOlderThanMillis) {
                    return x.value;
                }
            }
            await this.readRegister(x);
            return x.value;
        } catch (err) {
            debug.finest(err);
            throw err;
        }
    }


    // ******************************************************************************************

    public async readRegisterById (id: number): Promise<ModbusRequest> {
        return await this.readRegister(id);
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

    public async readHeatCurve (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._heatCurve.id, notOlderThanMillis);
    }

    public async readHeatOffset (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._heatOffset.id, notOlderThanMillis);
    }

    public async readHeatTempMin (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._heatTempMin.id, notOlderThanMillis);
    }

    public async readHeatTempMax (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._heatTempMax.id, notOlderThanMillis);
    }

    public async readOwnHeatCurvePoint (temp: -30 | -20 | -10 | 0 | 10 | 20 | 30, notOlderThanMillis?: number): Promise<number> {
        switch (temp) {
            case -30: return this.getRegisterValue(this._ownHeatCurveP1.id, notOlderThanMillis);
            case -20: return this.getRegisterValue(this._ownHeatCurveP2.id, notOlderThanMillis);
            case -10: return this.getRegisterValue(this._ownHeatCurveP3.id, notOlderThanMillis);
            case   0: return this.getRegisterValue(this._ownHeatCurveP4.id, notOlderThanMillis);
            case  10: return this.getRegisterValue(this._ownHeatCurveP5.id, notOlderThanMillis);
            case  20: return this.getRegisterValue(this._ownHeatCurveP6.id, notOlderThanMillis);
            case  30: return this.getRegisterValue(this._ownHeatCurveP7.id, notOlderThanMillis);
            default: throw new Error('invalid temp ' + temp);
        }
    }

    public async read_operationalMode (notOlderThanMillis?: number): Promise<'auto' | 'manual' | 'add heat only' | '?'> {
        const x = await this.getRegisterValue(this._operationalMode.id, notOlderThanMillis);
        switch (x) {
            case  0: return 'auto';
            case  1: return 'manual';
            case  2: return 'add heat only';
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async read_operationalModeValue (notOlderThanMillis?: number): Promise<0 | 1 | 2> {
        const x = await this.getRegisterValue(this._operationalMode.id, notOlderThanMillis);
        switch (x) {
            case  0: return 0;
            case  1: return 1;
            case  2: return 2;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readSupplyPumpMode (notOlderThanMillis?: number): Promise<'intermittent' | 'continous' | 'economy' | 'auto'> {
        const x = await this.getRegisterValue(this._supplyPumpMode.id, notOlderThanMillis);
        switch (x) {
            case 10: return 'intermittent';
            case 20: return 'continous';
            case 30: return 'economy';
            case 40: return 'auto';
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readSupplyPumpModeValue (notOlderThanMillis?: number): Promise<10 | 20 | 30 | 40> {
        const x = await this.getRegisterValue(this._supplyPumpMode.id, notOlderThanMillis);
        switch (x) {
            case 10: return 10;
            case 20: return 20;
            case 30: return 30;
            case 40: return 40;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readBrinePumpMode (notOlderThanMillis?: number): Promise<'intermittent' | 'continous' | 'economy' | 'auto'> {
        const x = await this.getRegisterValue(this._brinePumpMode.id, notOlderThanMillis);
        switch (x) {
            case 10: return 'intermittent';
            case 20: return 'continous';
            case 30: return 'economy';
            case 40: return 'auto';
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readBrinePumpModeValue (notOlderThanMillis?: number): Promise<10 | 20 | 30 | 40> {
        const x = await this.getRegisterValue(this._brinePumpMode.id, notOlderThanMillis);
        switch (x) {
            case 10: return 10;
            case 20: return 20;
            case 30: return 30;
            case 40: return 40;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readDMStartHeating (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._dmStartHeating.id, notOlderThanMillis);
    }

    public async readAddHeatingStep (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._addHeatingStep.id, notOlderThanMillis);
    }

    public async readAddHeatingMaxPower (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._addHeatingMaxPower.id, notOlderThanMillis);
    }

    public async readAddHeatingFuse (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._addHeatingFuse.id, notOlderThanMillis);
    }

    public async readIsAdditiveHeatingAllowed (notOlderThanMillis?: number): Promise<boolean> {
        const x = await this.getRegisterValue(this._allowAdditiveHeating.id, notOlderThanMillis);
        switch (x) {
            case  0: return false;
            case  1: return true;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsAdditiveHeatingAllowedValue (notOlderThanMillis?: number): Promise<0 | 1> {
        const x = await this.getRegisterValue(this._allowAdditiveHeating.id, notOlderThanMillis);
        switch (x) {
            case  0: return 0;
            case  1: return 1;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsHeatingAllowed (notOlderThanMillis?: number): Promise<boolean> {
        const x = await this.getRegisterValue(this._allowHeating.id, notOlderThanMillis);
        switch (x) {
            case  0: return false;
            case  1: return true;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsHeatingAllowedValue (notOlderThanMillis?: number): Promise<0 | 1> {
        const x = await this.getRegisterValue(this._allowHeating.id, notOlderThanMillis);
        switch (x) {
            case  0: return 0;
            case  1: return 1;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readStopTempHeating (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._stopTempHeating.id, notOlderThanMillis);
    }

    public async readStopTempAddHeating (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._stopTempAddHeating.id, notOlderThanMillis);
    }

    public async readDMDiffStartAddHeating (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._dmDiffStartAddHeating.id, notOlderThanMillis);
    }

    public async readIsCutOffFrequ2Activated (notOlderThanMillis?: number): Promise<'activated' | 'not activated'> {
        const x = await this.getRegisterValue(this._cutOffFrequActivated2.id, notOlderThanMillis);
        switch (x) {
            case  0: return 'activated';
            case  1: return 'not activated';
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsCutOffFrequ2ActivatedValue (notOlderThanMillis?: number): Promise<0 | 1> {
        const x = await this.getRegisterValue(this._cutOffFrequActivated2.id, notOlderThanMillis);
        switch (x) {
            case  0: return 0;
            case  1: return 1;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsCutOffFrequ1Activated (notOlderThanMillis?: number): Promise<'activated' | 'not activated'> {
        const x = await this.getRegisterValue(this._cutOffFrequActivated1.id, notOlderThanMillis);
        switch (x) {
            case  0: return 'activated';
            case  1: return 'not activated';
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readIsCutOffFrequ1ActivatedValue (notOlderThanMillis?: number): Promise<0 | 1> {
        const x = await this.getRegisterValue(this._cutOffFrequActivated1.id, notOlderThanMillis);
        switch (x) {
            case  0: return 0;
            case  1: return 0;
            default: throw new Error('illegal return value ' + x);
        }
    }

    public async readCutOffFrequStart2 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._cutOffFrequStart2.id, notOlderThanMillis);
    }

    public async readCutOffFrequStart1 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._cutOffFrequStart1.id, notOlderThanMillis);
    }

    public async readCutOffFrequStop2 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._cutOffFrequStop2.id, notOlderThanMillis);
    }

    public async readCutOffFrequStop1 (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._cutOffFrequStop1.id, notOlderThanMillis);
    }

    // *****************************************************************************************************

    public async writeRegisterById (id: number, value: number): Promise<ModbusRequest> {
        return this.writeRegister(id, value);
    }

    public async writeDegreeMinutes (value: number): Promise<ModbusRequest> {
        value = Math.max(-30000, value);
        value = Math.min( 30000, value);
        return this.writeRegister(this._degreeMinutes, value);
    }

    public async writeHeatCurve (value: number): Promise<ModbusRequest> {
        value = Math.max( 0, value);
        value = Math.min(15, value);
        return this.writeRegister(this._heatCurve, value);
    }

    public async writeHeatOffset (value: number): Promise<ModbusRequest> {
        value = Math.max(-10, value);
        value = Math.min(+10, value);
        return this.writeRegister(this._heatOffset, value);
    }

    public async writeHeatTempMin (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max( 50, value);
        value = Math.min(700, value);
        return this.writeRegister(this._heatTempMin, Math.round(value));
    }

    public async writeHeatTempMax (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max( 50, value);
        value = Math.min(800, value);
        return this.writeRegister(this._heatTempMax, Math.round(value));
    }

    public async writeOwnHeatCurvePoint (temp: -30 | -20 | -10 | 0 | 10 | 20 | 30, value: number): Promise<ModbusRequest> {
        value = Math.max( 5, value);
        value = Math.min(80, value);
        switch (temp) {
            case -30: return this.writeRegister(this._ownHeatCurveP1, Math.round(value));
            case -20: return this.writeRegister(this._ownHeatCurveP2, Math.round(value));
            case -10: return this.writeRegister(this._ownHeatCurveP3, Math.round(value));
            case   0: return this.writeRegister(this._ownHeatCurveP4, Math.round(value));
            case  10: return this.writeRegister(this._ownHeatCurveP5, Math.round(value));
            case  20: return this.writeRegister(this._ownHeatCurveP6, Math.round(value));
            case  30: return this.writeRegister(this._ownHeatCurveP7, Math.round(value));
            default: throw new Error('invalid temp ' + temp);
        }
    }

    public async writeOperationMode (mode: 'auto' | 'manual' | 'add heat only'): Promise<ModbusRequest> {
        switch (mode) {
            case 'auto':          return this.writeRegister(this._operationalMode, 0);
            case 'manual':        return this.writeRegister(this._operationalMode, 1);
            case 'add heat only': return this.writeRegister(this._operationalMode, 2);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeOperationModeValue (mode: 0 | 1 | 2): Promise<ModbusRequest> {
        switch (mode) {
            case 0: return this.writeRegister(this._operationalMode, 0);
            case 1: return this.writeRegister(this._operationalMode, 1);
            case 2: return this.writeRegister(this._operationalMode, 2);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeSupplyPumpMode (mode: 'intermittent' | 'continous' | 'economy' | 'auto'): Promise<ModbusRequest> {
        switch (mode) {
            case 'intermittent':  return this.writeRegister(this._supplyPumpMode, 10);
            case 'continous':     return this.writeRegister(this._supplyPumpMode, 20);
            case 'economy':       return this.writeRegister(this._supplyPumpMode, 30);
            case 'auto':          return this.writeRegister(this._supplyPumpMode, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeSupplyPumpModeValue (mode: 10 | 20 | 30 | 40): Promise<ModbusRequest> {
        switch (mode) {
            case 10:  return this.writeRegister(this._supplyPumpMode, 10);
            case 20:  return this.writeRegister(this._supplyPumpMode, 20);
            case 30:  return this.writeRegister(this._supplyPumpMode, 30);
            case 40:  return this.writeRegister(this._supplyPumpMode, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeBrinePumpMode (mode: 'intermittent' | 'continous' | 'economy' | 'auto'): Promise<ModbusRequest> {
        switch (mode) {
            case 'intermittent':  return this.writeRegister(this._brinePumpMode, 10);
            case 'continous':     return this.writeRegister(this._brinePumpMode, 20);
            case 'economy':       return this.writeRegister(this._brinePumpMode, 30);
            case 'auto':          return this.writeRegister(this._brinePumpMode, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeBrinePumpModeValue (mode: 10 | 20 | 30 | 40): Promise<ModbusRequest> {
        switch (mode) {
            case 10:  return this.writeRegister(this._brinePumpMode, 10);
            case 20:  return this.writeRegister(this._brinePumpMode, 20);
            case 30:  return this.writeRegister(this._brinePumpMode, 30);
            case 40:  return this.writeRegister(this._brinePumpMode, 40);
            default: throw new Error('invalid mode ' + mode);
        }
    }

    public async writeDMHeaterStart (degreeMinutes: number): Promise<ModbusRequest> {
        degreeMinutes = Math.max(-1000, degreeMinutes);
        degreeMinutes = Math.min(   30, degreeMinutes);
        return this.writeRegister(this._dmStartHeating, Math.round(degreeMinutes));
    }

    public async writeAddHeatingStep (degreeMinutes: number): Promise<ModbusRequest> {
        degreeMinutes = Math.max(-32768, degreeMinutes);
        degreeMinutes = Math.min( 32767, degreeMinutes);
        return this.writeRegister(this._addHeatingStep, Math.round(degreeMinutes));
    }

    public async writeAddHeaterMaxPower (value: number): Promise<ModbusRequest> {
        value = value / 10;
        value = Math.max(   0, value);
        value = Math.min( 600, value);
        return this.writeRegister(this._addHeatingMaxPower, Math.round(value));
    }

    public async writeAddHeaterFuse (value: number): Promise<ModbusRequest> {
        value = Math.max(   0, value);
        value = Math.min( 400, value);
        return this.writeRegister(this._addHeatingFuse, Math.round(value));
    }

    public async writeAllowAdditiveHeating (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(this._allowAdditiveHeating, 1);
            case false: return this.writeRegister(this._allowAdditiveHeating, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeAllowHeating (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(this._allowHeating, 1);
            case false: return this.writeRegister(this._allowHeating, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeStopTempHeating (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max(-200, value);
        value = Math.min( 400, value);
        return this.writeRegister(this._stopTempHeating, Math.round(value));
    }

    public async writeStopTempAdditionalHeating (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.max(-250, value);
        value = Math.min( 400, value);
        return this.writeRegister(this._stopTempAddHeating, Math.round(value));
    }

    // 47072:
    public async writeDMDiffStartAddHeating (value: number): Promise<ModbusRequest> {
        value = Math.max( 100, value); // ?
        value = Math.min( 400, value); // ?
        return this.writeRegister(this._dmDiffStartAddHeating, Math.round(value));
    }

    public async writeActivateCutOffFreq1 (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(this._cutOffFrequActivated1, 1);
            case false: return this.writeRegister(this._cutOffFrequActivated1, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeActivateCutOffFreq2 (value: boolean): Promise<ModbusRequest> {
        switch (value) {
            case true:  return this.writeRegister(this._cutOffFrequActivated2, 1);
            case false: return this.writeRegister(this._cutOffFrequActivated2, 0);
            default: throw new Error('invalid value ' + value);
        }
    }

    public async writeCutOffFreq1Start (value: number): Promise<ModbusRequest> {
        value = Math.max(  17, value);
        value = Math.min( 115, value);
        return this.writeRegister(this._cutOffFrequStart1, Math.round(value));
    }

    public async writeCutOffFreq1Stop (value: number): Promise<ModbusRequest> {
        value = Math.max(  22, value);
        value = Math.min( 120, value);
        return this.writeRegister(this._cutOffFrequStop1, Math.round(value));
    }

    public async writeCutOffFreq2Start (value: number): Promise<ModbusRequest> {
        value = Math.max(  17, value);
        value = Math.min( 115, value);
        return this.writeRegister(this._cutOffFrequStart2, Math.round(value));
    }

    public async writeCutOffFreq2Stop (value: number): Promise<ModbusRequest> {
        value = Math.max(  22, value);
        value = Math.min( 120, value);
        return this.writeRegister(this._cutOffFrequStop2, Math.round(value));
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
                let x: string;
                try {
                    x = sprintf(v.format, v.value);
                } catch (err) {
                    debug.warn('%s %s\n%e', v.id, v.format, err);
                    x = sprintf('%f', v.value);
                }
                rv[v.label] = sprintf('%s%s', x.trim(), v.unit);
            }
        }
        return rv;
    }

    public toNibe1155ValuesObject (): INibe1155Values {
        const v = this.toValuesObject();
        const rv: INibe1155Values = {
            outdoorTemp:           this._outdoorTemp.valueAsString(true),
            supplyS1Temp:          this._supplyS1Temp.valueAsString(true),
            supplyReturnTemp:      this._supplyReturnTemp.valueAsString(true),
            brineInTemp:           this._brineInTemp.valueAsString(true),
            brineOutTemp:          this._brineOutTemp.valueAsString(true),
            condensorOutTemp:      this._condensorOutTemp.valueAsString(true),
            hotGasTemp:            this._hotGasTemp.valueAsString(true),
            liquidLineTemp:        this._liquidLineTemp.valueAsString(true),
            suctionTemp:           this._suctionTemp.valueAsString(true),
            supplyTemp:            this._supplyTemp.valueAsString(true),
            degreeMinutes:         this._degreeMinutes.valueAsString(true),
            electricHeaterPower:   this._electricHeaterPower.valueAsString(true),
            compressorFrequency:   this._compressorFrequency.valueAsString(true),
            compressorInPower:     this._compressorInPower.valueAsString(true),
            compressorState:       this._compressorState.valueAsString(true),
            supplyPumpState:       this._supplyPumpState.valueAsString(true),
            brinePumpState:        this._brinePumpState.valueAsString(true),
            supplyPumpSpeed:       this._supplyPumpSpeed.valueAsString(true),
            brinePumpSpeed:        this._brinePumpSpeed.valueAsString(true)
        };
        return rv;
    }

    public toExtendedNibe1155ValuesObject (): IExtendedNibe1155Values {
        const v = this.toValuesObject();
        const rv: IExtendedNibe1155Values = {
            outdoorTemp:           this._outdoorTemp.valueAsString(true),
            supplyS1Temp:          this._supplyS1Temp.valueAsString(true),
            supplyReturnTemp:      this._supplyReturnTemp.valueAsString(true),
            brineInTemp:           this._brineInTemp.valueAsString(true),
            brineOutTemp:          this._brineOutTemp.valueAsString(true),
            condensorOutTemp:      this._condensorOutTemp.valueAsString(true),
            hotGasTemp:            this._hotGasTemp.valueAsString(true),
            liquidLineTemp:        this._liquidLineTemp.valueAsString(true),
            suctionTemp:           this._suctionTemp.valueAsString(true),
            supplyTemp:            this._supplyTemp.valueAsString(true),
            degreeMinutes:         this._degreeMinutes.valueAsString(true),
            electricHeaterPower:   this._electricHeaterPower.valueAsString(true),
            compressorFrequency:   this._compressorFrequency.valueAsString(true),
            compressorInPower:     this._compressorInPower.valueAsString(true),
            compressorState:       this._compressorState.valueAsString(true),
            supplyPumpState:       this._supplyPumpState.valueAsString(true),
            brinePumpState:        this._brinePumpState.valueAsString(true),
            supplyPumpSpeed:       this._supplyPumpSpeed.valueAsString(true),
            brinePumpSpeed:        this._brinePumpSpeed.valueAsString(true),
            roomTemp:              this._roomTemp.valueAsString(true),
            outdoorTempAverage:    this._outdoorTempAverage.valueAsString(true),
            currentL1:             this._currentL1.valueAsString(true),
            currentL2:             this._currentL2.valueAsString(true),
            currentL3:             this._currentL3.valueAsString(true),
            heatCurve:             this._heatCurve.valueAsString(true),
            heatOffset:            this._heatOffset.valueAsString(true),
            heatTempMin:           this._heatTempMin.valueAsString(true),
            heatTempMax:           this._heatTempMax.valueAsString(true),
            ownHeatCurveP1:        this._ownHeatCurveP1.valueAsString(true),
            ownHeatCurveP2:        this._ownHeatCurveP2.valueAsString(true),
            ownHeatCurveP3:        this._ownHeatCurveP3.valueAsString(true),
            ownHeatCurveP4:        this._ownHeatCurveP4.valueAsString(true),
            ownHeatCurveP5:        this._ownHeatCurveP5.valueAsString(true),
            ownHeatCurveP6:        this._ownHeatCurveP6.valueAsString(true),
            ownHeatCurveP7:        this._ownHeatCurveP7.valueAsString(true),
            operationalMode:       this._operationalMode.valueAsString(true),
            supplyPumpMode:        this._supplyPumpMode.valueAsString(true),
            brinePumpMode:         this._brinePumpMode.valueAsString(true),
            dmStartHeating:        this._dmStartHeating.valueAsString(true),
            addHeatingStep:        this._addHeatingStep.valueAsString(true),
            addHeatingMaxPower:    this._addHeatingMaxPower.valueAsString(true),
            addHeatingFuse:        this._addHeatingFuse.valueAsString(true),
            allowAdditiveHeating:  this._allowAdditiveHeating.valueAsString(true),
            allowHeating:          this._allowHeating.valueAsString(true),
            stopTempHeating:       this._stopTempHeating.valueAsString(true),
            stopTempAddHeating:    this._stopTempAddHeating.valueAsString(true),
            dmDiffStartAddHeating: this._dmDiffStartAddHeating.valueAsString(true),
            cutOffFrequActivated2: this._cutOffFrequActivated2.valueAsString(true),
            cutOffFrequActivated1: this._cutOffFrequActivated1.valueAsString(true),
            cutOffFrequStart2:     this._cutOffFrequStart2.valueAsString(true),
            cutOffFrequStart1:     this._cutOffFrequStart1.valueAsString(true),
            cutOffFrequStop2:      this._cutOffFrequStop2.valueAsString(true),
            cutOffFrequStop1:      this._cutOffFrequStop1.valueAsString(true)
        };
        return rv;
    }


    // *******************************************************************************
    // private members
    // *******************************************************************************

    private async start () {
        await this.handlePolling();
        this._pollingTimer = setInterval( () => { this.handlePolling(); }, 1000);
    }

    private async writeRegisterNow (id: number, value: number, size?: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32'): Promise<ModbusRequest> {
        try {
            const quantity = size && (size === 'u32' || size === 's32') ? 2 : 1;
            const requ =  ModbusRequestFactory.createWriteMultipleHoldRegisters(1, id + 1, quantity, [ value ], false);
            await this._serial.send(requ);
            return requ;
        } catch (err) {
            debug.warn(err);
            throw err;
        }
    }

    private async readRegisterNow (id: number, size?: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32'): Promise<ModbusRequest> {
        try {
            const quantity = size && (size === 'u32' || size === 's32') ? 2 : 1;
            const requ =  ModbusRequestFactory.createReadHoldRegister(1, id + 1, quantity, false);
            await this._serial.send(requ);
            this.parseModbusResponse(id, 1, requ.response, requ.responseAt);
            return requ;
        } catch (err) {
            debug.warn(err);
            throw err;
        }
    }

    private async writeRegister (register: Nibe1155Value | number, value: number): Promise<ModbusRequest> {
        return new Promise<ModbusRequest>( (res, rej) => {
            this._rwNonLogRegs.push({
                reg: register,
                value: value,
                res: res,
                rej: rej
            });
        });
    }

    private async readRegister (register: Nibe1155Value | number): Promise<ModbusRequest> {
        return new Promise<ModbusRequest>( (res, rej) => {
            this._rwNonLogRegs.push({
                reg: register,
                res: res,
                rej: rej
            });
        });
    }

    private async handlePolling () {
        if (this._pollingInProgress) { return; }
        try {
            this._pollingInProgress = true;
            debug.finer('Polling: read LOG.SET values ...');
            await this.pollLogSetValues();
            debug.finer('Polling: read LOG.SET values done.');

            this._readNonLogRegCnt++;
            if (this._readNonLogRegCnt % 2 === 1 && (this._setPointDegreeMinutes < 0 || this._setPointDegreeMinutes >= 0)) {
                debug.finest('Polling: writing Degree Minutes setpoint %s ...', this._setPointDegreeMinutes);
                const r = Nibe1155Modbus.regDefByLable.degreeMinutes;
                const x = this._setPointDegreeMinutes >= 0 ? this._setPointDegreeMinutes * 10 : 0x10000 + this._setPointDegreeMinutes * 10;
                await this.writeRegisterNow(r.id, x, r.size);
                debug.finer('Polling: writing Degree Minutes setpoint %s done.', this._setPointDegreeMinutes);

            } else if (this._rwNonLogRegs.length > 0) {
                const x = this._rwNonLogRegs.splice(0, 1)[0];
                if (!(x.reg instanceof Nibe1155Value)) {
                    const r = this._idMap[x.reg];
                    if (r) {
                        x.reg = r;
                    }
                }
                const id = x.reg instanceof Nibe1155Value ? x.reg.id : x.reg;
                const size = x.reg instanceof Nibe1155Value ? x.reg.size : 'u16';
                const label = x.reg instanceof Nibe1155Value ? x.reg.label : '?';
                try {
                    if (x.value === undefined) {
                        debug.finest('Polling: requested read of register %s %s ...', id, label);
                        const rv = await this.readRegisterNow(id, size);
                        const value = x.reg instanceof Nibe1155Value ? x.reg.value : rv.response.u16At(3);
                        debug.finer('Polling: requested read of register %s %s done -> %s', id, label, value);
                        x.res(rv);
                    } else {
                        debug.finest('Polling: requested write of register %s %s = %s ...', id, label, x.value);
                        const rv = await this.writeRegisterNow(id, x.value, size);
                        debug.finer('Polling: requested write of register %s %s = %s done', id, label, x.value);
                        x.res(rv);
                    }
                } catch (err) {
                    x.rej(err);
                }

            } else if (this._nonLogSetRegs.length > 0) {
                const v = this._nonLogSetRegs[this._readNonLogRegsIndex];
                this._readNonLogRegsIndex = (this._readNonLogRegsIndex + 1) % this._nonLogSetRegs.length;
                debug.finest('Polling: periodic read register %s %s ...', v.id, v.label);
                await this.readRegisterNow(v.id);
                debug.finer('Polling: periodic read register %s %s done -> %s', v.id, v.label, v.value);
            }

        } catch (err) {
            debug.warn(err);

        } finally {
            this._pollingInProgress = false;
        }
    }

    private async pollLogSetValues () {
        debug.fine('start polling LOG.SET ids');
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
                    debug.finest('polling %s registers starting by id %s in %s seconds', quantity, firstAdd, time);
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
            v.clearValueChanged();
        }

    }


}




