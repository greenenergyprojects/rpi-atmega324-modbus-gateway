
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:Nibe1155');
const debugEvent: debugsx.IFullLogger = debugsx.createFullLogger('Nibe1155.Event');

import * as fs from 'fs';
import * as events from 'events';

import { sprintf } from 'sprintf-js';

import { Nibe1155Value, Nibe1155CompressorStateValue, Nibe1155PumpStateValue, Nibe1155AlarmValue,
         Nibe1155PumpModeValue, Nibe1155OperationModeValue } from '../data/common/nibe1155/nibe1155-value';
import { Nibe1155ModbusRegisters, Nibe1155ModbusIds } from '../data/common/nibe1155/nibe1155-modbus-registers';
import { ModbusSerial } from '../modbus/modbus-serial';
import { ModbusRequest, ModbusRequestFactory } from '../modbus/modbus-request';
import { ModbusAsciiFrame } from '../modbus/modbus-ascii-frame';
import { Statistics } from '../statistics';
import { Nibe1155MonitorRecord, INibe1155MonitorRecord } from '../data/common/nibe1155/nibe1155-monitor-record';

// import { Nibe1155Modbus, INibe1155 } from './nibe1155-modbus';


export interface INibe1155Values {
    supplyS1Temp:        string;
    supplyS1ReturnTemp:  string;
    brineInTemp:         string;
    brineOutTemp:        string;
    condensorOutTemp:    string;
    hotGasTemp:          string;
    liquidLineTemp:      string;
    suctionTemp:         string;
    supplyTemp:          string;
    degreeMinutes:       string;
    calcSupplyTemp:      string;
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
    outdoorTemp:            string;
    roomTemp:               string;
    outdoorTempAverage:     string;
    currentL1H:              string;
    currentL1L:              string;
    currentL2H:              string;
    currentL2L:              string;
    currentL3H:              string;
    currentL3L:              string;
    energyCompAndElHeater:  string;
    energyCompressor:       string;
    compFrequTarget:        string;
    compPower10Min:         string;
    compNumberOfStarts:     string;
    compTotalOperationTime: string;
    alarm:                  string;
    alarmReset:             string;
    heatCurve:              string;
    heatOffset:             string;
    heatTempMin:            string;
    heatTempMax:            string;
    ownHeatCurveP1:         string;
    ownHeatCurveP2:         string;
    ownHeatCurveP3:         string;
    ownHeatCurveP4:         string;
    ownHeatCurveP5:         string;
    ownHeatCurveP6:         string;
    ownHeatCurveP7:         string;
    regMaxSupplyDiff:       string;
    regMinCompFrequ:        string;
    regMaxCompFrequ:        string;
    operationalMode:        string;
    supplyPumpMode:         string;
    brinePumpMode:          string;
    dmStartHeating:         string;
    addHeatingStartDm:      string;
    addHeatingStep:         string;
    addHeatingMaxPower:     string;
    addHeatingFuse:         string;
    allowAdditiveHeating:   string;
    allowHeating:           string;
    stopTempHeating:        string;
    stopTempAddHeating:     string;
    dmDiffStartAddHeating:  string;
    autoHeatMedPumpSpeed:   string;
    cutOffFrequActivated2:  string;
    cutOffFrequActivated1:  string;
    cutOffFrequStart2:      string;
    cutOffFrequStart1:      string;
    cutOffFrequStop2:       string;
    cutOffFrequStop1:       string;
}



type Event = 'all' | keyof IExtendedNibe1155Values;

export interface INibe1155Config {
    logfile?: {
        disabled?: boolean;
        filename: string;
    };
}


export class Nibe1155 {


    public static async createInstance (serial: ModbusSerial, config?: INibe1155Config): Promise<Nibe1155> {
        if (this._instance) { throw new Error('instance already created'); }
        const rv = new Nibe1155(serial, config);
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

    private _config: INibe1155Config;
    private _serial: ModbusSerial;
    private _logSetIds: number [];
    private _idMap: { [ id: number ]: Nibe1155Value } = {};
    private _pollingTimer: NodeJS.Timer;
    private _pollingInProgress: boolean;
    private _setPointDegreeMinutes: number;
    private _nonLogSetRegs: Nibe1155Value [] = [];
    private _rwNonLogRegs: { reg: Nibe1155Value | number, value?: number, res: (req: ModbusRequest) => void, rej: (err: any) => void } [] = [];
    private _readNonLogRegsIndex = 0;
    private _readNonLogRegCnt = 0;
    private _eventEmitter = new events.EventEmitter();
    private _debugEventInfoIds: number [] = [];

    // LOG.SET registers
    private _supplyS1Temp:        Nibe1155Value;
    private _supplyS1ReturnTemp:  Nibe1155Value;
    private _brineInTemp:         Nibe1155Value;
    private _brineOutTemp:        Nibe1155Value;
    private _condensorOutTemp:    Nibe1155Value;
    private _hotGasTemp:          Nibe1155Value;
    private _liquidLineTemp:      Nibe1155Value;
    private _suctionTemp:         Nibe1155Value;
    private _supplyTemp:          Nibe1155Value;
    private _degreeMinutes:       Nibe1155Value;
    private _calcSupplyTemp:      Nibe1155Value;
    private _electricHeaterPower: Nibe1155Value;
    private _compressorFrequency: Nibe1155Value;
    private _compressorInPower:   Nibe1155Value;
    private _compressorState:     Nibe1155CompressorStateValue;
    private _supplyPumpState:     Nibe1155PumpStateValue;
    private _brinePumpState:      Nibe1155PumpStateValue;
    private _supplyPumpSpeed:     Nibe1155Value;
    private _brinePumpSpeed:      Nibe1155Value;

    // normal Registers
    private _outdoorTemp:            Nibe1155Value;
    private _roomTemp:               Nibe1155Value;
    private _outdoorTempAverage:     Nibe1155Value;
    private _currentL1H:             Nibe1155Value;
    private _currentL1L:             Nibe1155Value;
    private _currentL2H:             Nibe1155Value;
    private _currentL2L:             Nibe1155Value;
    private _currentL3H:             Nibe1155Value;
    private _currentL3L:             Nibe1155Value;
    private _energyCompAndElHeater:  Nibe1155Value;
    private _energyCompressor:       Nibe1155Value;
    private _compFrequTarget:        Nibe1155Value;
    private _compPower10Min:         Nibe1155Value;
    private _compNumberOfStarts:     Nibe1155Value;
    private _compTotalOperationTime: Nibe1155Value;
    private _alarm:                  Nibe1155AlarmValue;
    private _alarmReset:             Nibe1155Value;
    private _heatCurve:              Nibe1155Value;
    private _heatOffset:             Nibe1155Value;
    private _heatTempMin:            Nibe1155Value;
    private _heatTempMax:            Nibe1155Value;
    private _ownHeatCurveP1:         Nibe1155Value;
    private _ownHeatCurveP2:         Nibe1155Value;
    private _ownHeatCurveP3:         Nibe1155Value;
    private _ownHeatCurveP4:         Nibe1155Value;
    private _ownHeatCurveP5:         Nibe1155Value;
    private _ownHeatCurveP6:         Nibe1155Value;
    private _ownHeatCurveP7:         Nibe1155Value;
    private _regMaxSupplyDiff:       Nibe1155Value;
    private _regMinCompFrequ:        Nibe1155Value;
    private _regMaxCompFrequ:        Nibe1155Value;
    private _operationalMode:        Nibe1155OperationModeValue;
    private _supplyPumpMode:         Nibe1155PumpModeValue;
    private _brinePumpMode:          Nibe1155PumpModeValue;
    private _dmStartHeating:         Nibe1155Value;
    private _addHeatingStartDm:      Nibe1155Value;
    private _addHeatingStep:         Nibe1155Value;
    private _addHeatingMaxPower:     Nibe1155Value;
    private _addHeatingFuse:         Nibe1155Value;
    private _allowAdditiveHeating:   Nibe1155Value;
    private _allowHeating:           Nibe1155Value;
    private _stopTempHeating:        Nibe1155Value;
    private _stopTempAddHeating:     Nibe1155Value;
    private _dmDiffStartAddHeating:  Nibe1155Value;
    private _autoHeatMedPumpSpeed:   Nibe1155Value;
    private _cutOffFrequActivated2:  Nibe1155Value;
    private _cutOffFrequActivated1:  Nibe1155Value;
    private _cutOffFrequStart2:      Nibe1155Value;
    private _cutOffFrequStart1:      Nibe1155Value;
    private _cutOffFrequStop2:       Nibe1155Value;
    private _cutOffFrequStop1:       Nibe1155Value;

    private constructor (serial: ModbusSerial, config?: INibe1155Config) {
        this._serial = serial;
        this._config = config ? config : { };
        if (!this._config.logfile) { this._config.logfile = { disabled: true, filename: null }; }

        this._supplyS1Temp        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyS1Temp.id });
        this._supplyS1ReturnTemp  = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyS1ReturnTemp.id });
        this._brineInTemp         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.brineInTemp.id });
        this._brineOutTemp        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.brineOutTemp.id });
        this._condensorOutTemp    = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.condensorOutTemp.id });
        this._hotGasTemp          = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.hotGasTemp.id });
        this._liquidLineTemp      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.liquidLineTemp.id });
        this._suctionTemp         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.suctionTemp.id });
        this._supplyTemp          = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyTemp.id });
        this._degreeMinutes       = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.degreeMinutes.id });
        this._calcSupplyTemp      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.calcSupplyTemp.id });
        this._electricHeaterPower = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.electricHeaterPower.id });
        this._compressorFrequency = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compressorFrequency.id });
        this._compressorInPower   = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compressorInPower.id });
        this._compressorState     = new Nibe1155CompressorStateValue({ id: Nibe1155ModbusRegisters.regDefByLabel.compressorState.id });
        this._supplyPumpState     = new Nibe1155PumpStateValue({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyPumpState.id });
        this._brinePumpState      = new Nibe1155PumpStateValue({ id: Nibe1155ModbusRegisters.regDefByLabel.brinePumpState.id });
        this._supplyPumpSpeed     = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyPumpSpeed.id });
        this._brinePumpSpeed      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.brinePumpSpeed.id });

        this._logSetIds = [
            40008, 40012, 40015, 40016, 40017, 40018, 40019, 40022, 40071,
            43005, 43009, 43084, 43136, 43141, 43427, 43431, 43433, 43437, 43439
        ];

        this._outdoorTemp            = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.outdoorTemp.id });
        this._roomTemp               = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.roomTemp.id });
        this._outdoorTempAverage     = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.outdoorTempAverage.id });
        this._currentL1H             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL1H.id });
        this._currentL1L             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL1L.id });
        this._currentL2H             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL2H.id });
        this._currentL2L             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL2L.id });
        this._currentL3H             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL3H.id });
        this._currentL3L             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.currentL3L.id });
        this._energyCompAndElHeater  = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.energyCompAndElHeater.id });
        this._energyCompressor       = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.energyCompressor.id });
        this._compFrequTarget        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compFrequTarget.id });
        this._compPower10Min         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compPower10Min.id });
        this._compNumberOfStarts     = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compNumberOfStarts.id });
        this._compTotalOperationTime = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.compTotalOperationTime.id });
        this._alarm                  = new Nibe1155AlarmValue({ id: Nibe1155ModbusRegisters.regDefByLabel.alarm.id });
        this._alarmReset             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.alarmReset.id });
        this._heatCurve              = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.heatCurveS1.id });
        this._heatOffset             = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.heatOffsetS1.id });
        this._heatTempMin            = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyMinS1.id });
        this._heatTempMax            = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyMaxS1.id });
        this._ownHeatCurveP1         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP1.id });
        this._ownHeatCurveP2         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP2.id });
        this._ownHeatCurveP3         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP3.id });
        this._ownHeatCurveP4         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP4.id });
        this._ownHeatCurveP5         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP5.id });
        this._ownHeatCurveP6         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP6.id });
        this._ownHeatCurveP7         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.ownHeatCurveP7.id });
        this._regMaxSupplyDiff       = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.regMaxSupplyDiff.id });
        this._regMinCompFrequ        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.regMinCompFrequ.id });
        this._regMaxCompFrequ        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.regMaxCompFrequ.id });
        this._operationalMode        = new Nibe1155OperationModeValue({ id: Nibe1155ModbusRegisters.regDefByLabel.operationalMode.id });
        this._supplyPumpMode         = new Nibe1155PumpModeValue({ id: Nibe1155ModbusRegisters.regDefByLabel.supplyPumpMode.id });
        this._brinePumpMode          = new Nibe1155PumpModeValue({ id: Nibe1155ModbusRegisters.regDefByLabel.brinePumpMode.id });
        this._dmStartHeating         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.dmStartHeating.id });
        this._addHeatingStartDm      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.addHeatingStartDm.id });
        this._addHeatingStep         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.addHeatingStep.id });
        this._addHeatingMaxPower     = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.addHeatingMaxPower.id });
        this._addHeatingFuse         = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.addHeatingFuse.id });
        this._allowAdditiveHeating   = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.allowAdditiveHeating.id });
        this._allowHeating           = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.allowHeating.id });
        this._stopTempHeating        = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.stopTempHeating.id });
        this._stopTempAddHeating     = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.stopTempAddHeating.id });
        this._dmDiffStartAddHeating  = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.dmDiffStartAddHeating.id });
        this._autoHeatMedPumpSpeed   = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.autoHeatMedPumpSpeed.id });
        this._cutOffFrequActivated2  = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequActivated2.id });
        this._cutOffFrequActivated1  = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequActivated1.id });
        this._cutOffFrequStart2      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequStart2.id });
        this._cutOffFrequStart1      = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequStart1.id });
        this._cutOffFrequStop2       = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequStop2.id });
        this._cutOffFrequStop1       = new Nibe1155Value({ id: Nibe1155ModbusRegisters.regDefByLabel.cutOffFrequStop1.id });

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
        // debug.finer('LOGSet Ids: %o', this._logSetIds);
        // debug.finer('Non LOGSet Ids: %o', this._nonLogSetRegs);

        // this._debugEventInfoIds.push(this._supplyPumpSpeed.id);
        // this._debugEventInfoIds.push(this._brinePumpSpeed.id);
        // this._debugEventInfoIds.push(this._compressorFrequency.id);

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
        return this._eventEmitter.removeListener(event, listener);
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

    public get logsetIds (): number [] {
        return this._logSetIds;
    }

    public get values (): { [id: number]: Nibe1155Value } {
        return this._idMap;
    }

    public async getRegisterValue (id: number, notOlderThanMillis?: number): Promise<number> {
        try {
            const x = this._idMap[id];
            if (!x) { throw new Error('invalid id ' + id); }
            if (x.valueAt instanceof Date) {
                if (notOlderThanMillis === undefined) {
                    return x.value;
                } else if ( notOlderThanMillis > 0) {
                    const dt = Date.now() - x.valueAt.getTime();
                    if (dt <= notOlderThanMillis) {
                        return x.value;
                    }
                }
            }
            await this.readRegister(x);
            return x.value;
        } catch (err) {
            debug.finest(err);
            throw err;
        }
    }

    public async readRegisterValue (id: number, showModbus?: boolean): Promise<number> {
        try {
            const x = this._idMap[id];
            if (!x) { throw new Error('invalid id ' + id); }
            const rv = await this.readRegister(x);
            if (showModbus) {
                console.log('=== readRegisterValue ====>', x.value, ' ===> ', rv);
            }
            return x.value;
        } catch (err) {
            debug.finest(err);
            throw err;
        }
    }

    public async writeRegisterValue (id: number, value: number, showModbus?: boolean): Promise<void> {
        try {
            const x = this._idMap[id];
            if (!x) { throw new Error('invalid id ' + id); }
            const rv = await this.writeRegister(x, value);
            if (showModbus) {
                console.log('==== writeRegisterValue ============> ', x, rv);
            }
        } catch (err) {
            debug.finest(err);
            throw err;
        }
    }


    // ******************************************************************************************

    public async readRegisterById (id: number): Promise<ModbusRequest> {
        return await this.readRegister(id);
    }

    public async readOutdoorTemp (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._outdoorTemp.id, notOlderThanMillis);
    }

    public async readRoomTemp (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._roomTemp.id, notOlderThanMillis);
    }

    public async readOutdoorTempAverage (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._outdoorTempAverage.id, notOlderThanMillis);
    }

    public async readCurrentL1 (notOlderThanMillis?: number): Promise<number> {
        const currH = await this.getRegisterValue(this._currentL1H.id, notOlderThanMillis);
        const currL = await this.getRegisterValue(this._currentL1L.id, notOlderThanMillis);
        return currH * 65_536 + currL;
    }

    public async readCurrentL2 (notOlderThanMillis?: number): Promise<number> {
        const currH = await this.getRegisterValue(this._currentL2H.id, notOlderThanMillis);
        const currL = await this.getRegisterValue(this._currentL2L.id, notOlderThanMillis);
        return currH * 65_536 + currL;

    }

    public async readCurrentL3 (notOlderThanMillis?: number): Promise<number> {
        const currH = await this.getRegisterValue(this._currentL3H.id, notOlderThanMillis);
        const currL = await this.getRegisterValue(this._currentL3L.id, notOlderThanMillis);
        return currH * 65_536 + currL;

    }

    public async readEnergyCompAndElHeater (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._energyCompAndElHeater.id, notOlderThanMillis);
    }

    public async readEnergyCompressor (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._energyCompressor.id, notOlderThanMillis);
    }


    public async readComppressorFrequencyTarget (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._compFrequTarget.id, notOlderThanMillis);
    }

    public async readComppressorPower10Min (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._compPower10Min.id, notOlderThanMillis);
    }

    public async readCompressorNumberOfStarts (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._compNumberOfStarts.id, notOlderThanMillis);
    }

    public async readCompressorTotalOperationTime (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._compTotalOperationTime.id, notOlderThanMillis);
    }

    public async readAlarm (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._alarm.id, notOlderThanMillis);
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

    public async readRegMaxSupplyDiff (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._regMaxSupplyDiff.id, notOlderThanMillis);
    }

    public async readRegMinCompFrequ (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._regMinCompFrequ.id, notOlderThanMillis);
    }

    public async readRegMaxCompFrequ (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._regMaxCompFrequ.id, notOlderThanMillis);
    }


    public async getRegisterValueTest (id: number, notOlderThanMillis?: number): Promise<number> {
        try {
            const x = this._idMap[id];
            if (!x) { throw new Error('invalid id ' + id); }
            console.log('----> ? ', x);
            if (x.valueAt instanceof Date && notOlderThanMillis === undefined) {
                console.log('---> 1');
                return x.value;
            } else if ( notOlderThanMillis > 0 && x.valueAt instanceof Date) {
                const dt = Date.now() - x.valueAt.getTime();
                if (dt <= notOlderThanMillis) {
                    console.log('---> 2');
                    return x.value;
                }
            }
            console.log('---> do it');
            await this.readRegister(x);
            return x.value;
        } catch (err) {
            debug.finest(err);
            throw err;
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

    public async readAddHeatingStartDm (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._addHeatingStartDm.id, notOlderThanMillis);
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

    public async readAutoHeatMedPumpSpeed (notOlderThanMillis?: number): Promise<number> {
        return this.getRegisterValue(this._autoHeatMedPumpSpeed.id, notOlderThanMillis);
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
        console.log('===========> writeDegreeMinutes ====> ', value );
        value = value * 10;
        value = Math.max(-30000, value);
        value = Math.min( 30000, value);
        return this.writeRegister(this._degreeMinutes, Math.round(value));
    }

    public async writeAlarmReset (): Promise<ModbusRequest> {
        return this.writeRegister(this._alarmReset, 1);
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

    public async writeRegMaxSupplyDiff (value: number): Promise<ModbusRequest> {
        value = value * 10;
        value = Math.min(0, value);
        return this.writeRegister(this._regMaxSupplyDiff, Math.round(value));
    }

    public async writeRegMinCompFrequ (value: number): Promise<ModbusRequest> {
        value = Math.min(17, value);
        value = Math.max(90, value);
        return this.writeRegister(this._regMinCompFrequ, Math.round(value));
    }

    public async writeRegMaxCompFrequ (value: number): Promise<ModbusRequest> {
        value = Math.min(20, value);
        value = Math.max(120, value);
        return this.writeRegister(this._regMaxCompFrequ, Math.round(value));
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

    public async writeAddHeatingStartDm (degreeMinutes: number): Promise<ModbusRequest> {
        degreeMinutes = Math.max(-32768, degreeMinutes);
        degreeMinutes = Math.min( 32767, degreeMinutes);
        return this.writeRegister(this._addHeatingStartDm, Math.round(degreeMinutes));
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

    // 48453
    public async writeAutoHeatMedPumpSpeed (value: number): Promise<ModbusRequest> {
        value = Math.max( 0, value);
        value = Math.min( 100, value);
        return this.writeRegister(this._autoHeatMedPumpSpeed, Math.round(value));
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

    public get supplyS1Temp (): Nibe1155Value {
        return this._supplyS1Temp;
    }

    public get supplyS1ReturnTemp (): Nibe1155Value {
        return this._supplyS1ReturnTemp;
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

    public get calcSupplyTemp (): Nibe1155Value {
        return this._calcSupplyTemp;
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

    public get compressorState (): Nibe1155CompressorStateValue {
        return this._compressorState;
    }

    public get supplyPumpState (): Nibe1155PumpStateValue {
        return this._supplyPumpState;
    }

    public get brinePumpState (): Nibe1155PumpStateValue {
        return this._brinePumpState;
    }

    public get supplyPumpSpeed (): Nibe1155Value {
        return this._supplyPumpSpeed;
    }

    public get brinePumpSpeed (): Nibe1155Value {
        return this._brinePumpSpeed;
    }

    public get cutOffFrequActivated2 (): Nibe1155Value {
        return this._cutOffFrequActivated2;
    }

    public get cutOffFrequActivated1 (): Nibe1155Value {
        return this._cutOffFrequActivated1;
    }

    public get cutOffFrequStart2 (): Nibe1155Value {
        return this._cutOffFrequStart2;
    }

    public get cutOffFrequStart1 (): Nibe1155Value {
        return this._cutOffFrequStart1;
    }

    public get cutOffFrequStop2 (): Nibe1155Value {
        return this._cutOffFrequStop2;
    }

    public get cutOffFrequStop1 (): Nibe1155Value {
        return this._cutOffFrequStop1;
    }

    public toValuesObject (addTime = true): { [ id: string ]: string } {
        const rv: { [ id: string ]: string } = {};
        for (const att in this) {
            if (!this.hasOwnProperty(att)) { continue; }
            const v = this[att];
            if (v instanceof Nibe1155Value) {
                rv[v.label] = v.valueAsString(addTime);
            } else {
                rv[att.toString()] = v.toString();
            }
        }
        return rv;
    }

    public toNibe1155ValuesObject (): INibe1155Values {
        const v = this.toValuesObject();
        const rv: INibe1155Values = {
            supplyS1Temp:          this._supplyS1Temp.valueAsString(true),
            supplyS1ReturnTemp:    this._supplyS1ReturnTemp.valueAsString(true),
            brineInTemp:           this._brineInTemp.valueAsString(true),
            brineOutTemp:          this._brineOutTemp.valueAsString(true),
            condensorOutTemp:      this._condensorOutTemp.valueAsString(true),
            hotGasTemp:            this._hotGasTemp.valueAsString(true),
            liquidLineTemp:        this._liquidLineTemp.valueAsString(true),
            suctionTemp:           this._suctionTemp.valueAsString(true),
            supplyTemp:            this._supplyTemp.valueAsString(true),
            degreeMinutes:         this._degreeMinutes.valueAsString(true),
            calcSupplyTemp:        this._calcSupplyTemp.valueAsString(true),
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
            supplyS1Temp:           this._supplyS1Temp.valueAsString(true),
            supplyS1ReturnTemp:     this._supplyS1ReturnTemp.valueAsString(true),
            brineInTemp:            this._brineInTemp.valueAsString(true),
            brineOutTemp:           this._brineOutTemp.valueAsString(true),
            condensorOutTemp:       this._condensorOutTemp.valueAsString(true),
            hotGasTemp:             this._hotGasTemp.valueAsString(true),
            liquidLineTemp:         this._liquidLineTemp.valueAsString(true),
            suctionTemp:            this._suctionTemp.valueAsString(true),
            supplyTemp:             this._supplyTemp.valueAsString(true),
            degreeMinutes:          this._degreeMinutes.valueAsString(true),
            calcSupplyTemp:         this._calcSupplyTemp.valueAsString(true),
            electricHeaterPower:    this._electricHeaterPower.valueAsString(true),
            compressorFrequency:    this._compressorFrequency.valueAsString(true),
            compressorInPower:      this._compressorInPower.valueAsString(true),
            compressorState:        this._compressorState.valueAsString(true),
            supplyPumpState:        this._supplyPumpState.valueAsString(true),
            brinePumpState:         this._brinePumpState.valueAsString(true),
            supplyPumpSpeed:        this._supplyPumpSpeed.valueAsString(true),
            brinePumpSpeed:         this._brinePumpSpeed.valueAsString(true),
            outdoorTemp:            this._outdoorTemp.valueAsString(true),
            roomTemp:               this._roomTemp.valueAsString(true),
            outdoorTempAverage:     this._outdoorTempAverage.valueAsString(true),
            currentL1H:             this._currentL1H.valueAsString(true),
            currentL1L:             this._currentL2L.valueAsString(true),
            currentL2H:             this._currentL3H.valueAsString(true),
            currentL2L:             this._currentL1L.valueAsString(true),
            currentL3H:             this._currentL2H.valueAsString(true),
            currentL3L:             this._currentL3L.valueAsString(true),
            energyCompAndElHeater:  this._energyCompAndElHeater.valueAsString(true),
            energyCompressor:       this._energyCompressor.valueAsString(true),
            compFrequTarget:        this._compFrequTarget.valueAsString(true),
            compPower10Min:         this._compPower10Min.valueAsString(true),
            compNumberOfStarts:     this._compNumberOfStarts.valueAsString(true),
            compTotalOperationTime: this._compTotalOperationTime.valueAsString(true),
            alarm:                  this._alarm.valueAsString(true),
            alarmReset:             this._alarmReset.valueAsString(true),
            heatCurve:              this._heatCurve.valueAsString(true),
            heatOffset:             this._heatOffset.valueAsString(true),
            heatTempMin:            this._heatTempMin.valueAsString(true),
            heatTempMax:            this._heatTempMax.valueAsString(true),
            ownHeatCurveP1:         this._ownHeatCurveP1.valueAsString(true),
            ownHeatCurveP2:         this._ownHeatCurveP2.valueAsString(true),
            ownHeatCurveP3:         this._ownHeatCurveP3.valueAsString(true),
            ownHeatCurveP4:         this._ownHeatCurveP4.valueAsString(true),
            ownHeatCurveP5:         this._ownHeatCurveP5.valueAsString(true),
            ownHeatCurveP6:         this._ownHeatCurveP6.valueAsString(true),
            ownHeatCurveP7:         this._ownHeatCurveP7.valueAsString(true),
            regMaxSupplyDiff:       this._regMaxSupplyDiff.valueAsString(true),
            regMinCompFrequ:        this._regMinCompFrequ.valueAsString(true),
            regMaxCompFrequ:        this._regMaxCompFrequ.valueAsString(true),
            operationalMode:        this._operationalMode.valueAsString(true),
            supplyPumpMode:         this._supplyPumpMode.valueAsString(true),
            brinePumpMode:          this._brinePumpMode.valueAsString(true),
            dmStartHeating:         this._dmStartHeating.valueAsString(true),
            addHeatingStartDm:      this._addHeatingStartDm.valueAsString(true),
            addHeatingStep:         this._addHeatingStep.valueAsString(true),
            addHeatingMaxPower:     this._addHeatingMaxPower.valueAsString(true),
            addHeatingFuse:         this._addHeatingFuse.valueAsString(true),
            allowAdditiveHeating:   this._allowAdditiveHeating.valueAsString(true),
            allowHeating:           this._allowHeating.valueAsString(true),
            stopTempHeating:        this._stopTempHeating.valueAsString(true),
            stopTempAddHeating:     this._stopTempAddHeating.valueAsString(true),
            dmDiffStartAddHeating:  this._dmDiffStartAddHeating.valueAsString(true),
            autoHeatMedPumpSpeed:   this._autoHeatMedPumpSpeed.valueAsString(true),
            cutOffFrequActivated2:  this._cutOffFrequActivated2.valueAsString(true),
            cutOffFrequActivated1:  this._cutOffFrequActivated1.valueAsString(true),
            cutOffFrequStart2:      this._cutOffFrequStart2.valueAsString(true),
            cutOffFrequStart1:      this._cutOffFrequStart1.valueAsString(true),
            cutOffFrequStop2:       this._cutOffFrequStop2.valueAsString(true),
            cutOffFrequStop1:       this._cutOffFrequStop1.valueAsString(true)
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
            let quantity = 1;
            switch (size) {
                case 'u8': case 'u16': break;
                case 's8':  value = value < 0 ? value + 0x100 : value; break;
                case 's16': value = value < 0 ? value + 0x10000 : value; break;
                case 'u32': quantity = 2; break;
                case 's32':
                    quantity = 2;
                    value = value < 0 ? value + 0x100000000 : value; break;
                    break;
                default: throw new Error('invalid size ' + size);
            }
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
                const r = Nibe1155ModbusRegisters.regDefByLabel.degreeMinutes;
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
                const size = x.reg instanceof Nibe1155Value ? x.reg.modbusRegSize : 'u16';
                const label = x.reg instanceof Nibe1155Value ? x.reg.label : '?';
                try {
                    if (x.value === undefined) {
                        debug.finest('Polling: requested read of register %s %s ...', id, label);
                        const rv = await this.readRegisterNow(id, size !== '?' ? size : 'u16');
                        const value = x.reg instanceof Nibe1155Value ? x.reg.value : rv.response.u16At(3);
                        Statistics.getInstance().handleSingleValue(label, value, rv.responseAt);
                        debug.finer('Polling: requested read of register %s %s done -> %s', id, label, value);
                        x.res(rv);
                    } else {
                        debug.finest('Polling: requested write of register %s %s = %s ...', id, label, x.value);
                        const rv = await this.writeRegisterNow(id, x.value, size !== '?' ? size : 'u16');
                        debug.finer('Polling: requested write of register %s %s = %s done', id, label, x.value);
                        // Statistics.Instance.handleSingleValue(label, x.value);
                        x.res(rv);
                    }
                } catch (err) {
                    x.rej(err);
                }

            } else if (this._nonLogSetRegs.length > 0) {
                const v = this._nonLogSetRegs[this._readNonLogRegsIndex];
                this._readNonLogRegsIndex = (this._readNonLogRegsIndex + 1) % this._nonLogSetRegs.length;
                debug.finest('Polling: periodic read register %s %s ...', v.id, v.label);
                const size = v instanceof Nibe1155Value ? v.modbusRegSize : 'u16';
                const requ = await this.readRegisterNow(v.id, size !== '?' ? size : 'u16');
                debug.finer('Polling: periodic read register %s %s done -> %s', v.id, v.label, v.value);
                Statistics.getInstance().handleSingleValue(v.label, v.value, requ.responseAt);
            }

        } catch (err) {
            debug.warn(err);

        } finally {
            this._pollingInProgress = false;
        }
    }

    private async pollLogSetValues () {
        debug.finer('start polling LOG.SET ids');
        try {
            const mr: INibe1155MonitorRecord = { createdAt: Date.now(), values: {} };
            for (let i = 0; i < this._logSetIds.length; i++) {
                const firstAdd = this._logSetIds[i];
                let lastAdd = firstAdd;
                while (i < (this._logSetIds.length - 1) && this._logSetIds[i + 1] === (lastAdd + 1)) {
                    lastAdd = this._logSetIds[++i];
                }
                const quantity = lastAdd - firstAdd + 1;
                debug.finest('pollLogSetValues: firstAddress=%s, quantity=%s', firstAdd, quantity);
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

            const x = this.toNibe1155ValuesObject();
            this.writeLog(this.toNibe1155ValuesObject());
            this.handleEventEmitter();

            for (const idString of this._logSetIds) {
                const id = <Nibe1155ModbusIds>+idString;
                const d = Nibe1155ModbusRegisters.regDefById[id];
                const v = (<any>this)['_' + d.label];
                if (!(v instanceof Nibe1155Value)) { throw new Error('missing value on id ' + idString); }
                mr.values[id] = v.toObject();
            }
            Statistics.getInstance().handleMonitorRecord(new Nibe1155MonitorRecord(mr));

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
            switch (x.modbusRegSize) {
                case 'u8': case 's8': case 'u16': case 's16': {
                    x.setRawValue(response.u16At(offset), at); offset += 2;
                    break;
                }

                case 'u32': case 's32': {
                    x.setRawValue(response.u32At(offset), at); offset += 4;
                    break;
                }

                default: debug.warn('skip response id %s, invalid size %s', id, x.modbusRegSize);
            }
        }
    }

    private writeLog (x: INibe1155Values) {
        if (this._config.logfile.disabled || !this._config.logfile.filename) { return; }
        const now = new Date();
        let fn = this._config.logfile.filename;
        fn = fn.replace(/%Y/g, sprintf('%04d', now.getFullYear()));
        fn = fn.replace(/%M/g, sprintf('%02d', now.getMonth() + 1));
        fn = fn.replace(/%D/g, sprintf('%02d', now.getDate()));
        const date = sprintf('%04d-%02d-%02d', now.getFullYear(), now.getMonth() + 1, now.getDate());
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
            const vNew = { value: v.value, at: v.valueAt };
            const vOld = { value: v.value, at: v.valueAt };
            const msg = sprintf('change-event - (%s) %s: %o -> %o', v.id, v.label, vOld, vNew);
            if (this._debugEventInfoIds.findIndex( (x) => x === v.id) === -1) {
                debugEvent.finer(msg);
            } else {
                debugEvent.info(msg);
            }
            this._eventEmitter.emit('all', vNew, vOld, v);
            this._eventEmitter.emit(v.label, vNew, vOld, v);
            v.clearValueChanged();
        }

    }

}
