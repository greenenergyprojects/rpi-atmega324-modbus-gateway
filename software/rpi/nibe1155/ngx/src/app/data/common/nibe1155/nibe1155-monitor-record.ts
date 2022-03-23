
import { DataRecord } from '../data-record';
import { INibe1155Value, Nibe1155Value, Nibe1155CompressorStateValue, Nibe1155PumpStateValue, Nibe1155PumpModeValue,
         Nibe1155AlarmValue, Nibe1155OperationModeValue } from './nibe1155-value';
import { Nibe1155ModbusRegisters, Nibe1155ModbusIds } from './nibe1155-modbus-registers';
import { INibe1155Controller, Nibe1155Controller } from './nibe1155-controller';
import { CommonLogger } from '../../common-logger';
import { HeatpumpControllerMode, IHeatPumpControllerConfig } from './heat-pump-config';

export interface INibe1155MonitorRecord {
    createdAt:  Date | number | string;
    controller?: INibe1155Controller;
    logsetIds?:  number [];
    values?:     { [ id in Nibe1155ModbusIds ]?: INibe1155Value };
}

export class Nibe1155MonitorRecord extends DataRecord<INibe1155MonitorRecord> implements INibe1155MonitorRecord {

    private _createdAt:  Date;
    private _controller?:          Nibe1155Controller;
    private _logsetIds?:           number [];
    private _values?:              { [ id in Nibe1155ModbusIds ]?: Nibe1155Value };

    public constructor (data: INibe1155MonitorRecord | Nibe1155Value) {
        super(null);
        // special behavior to get access on high level getter methods
        if (data === null || data instanceof Nibe1155Value) {
            this._createdAt = new Date ();
            if (data) {
                this._values = {};
                (<any>this._values)[(<Nibe1155Value>data).id] = data;
            }
            return;
        }
        try {
            const missing = DataRecord.getMissingAttributes( data, [ 'createdAt' ]);
            if (missing) {
                throw new Error('missing attribute ' + missing);
            }
            let attCnt = 0;
            for (const a of Object.getOwnPropertyNames(data)) {
                if ( a === 'createdAt') {
                    this._createdAt = DataRecord.parseDate(data, { attribute: 'createdAt', validate: true });
                } else if ( a === 'controller') {
                    this._controller = new Nibe1155Controller(data.controller);
                } else if ( a === 'logsetIds' ) {
                    this._logsetIds = Array.from(data.logsetIds);
                } else if ( a === 'values' ) {
                    const ids = Object.getOwnPropertyNames(data.values);
                    this._values = {};
                    for (const idString of ids) {
                        try {
                            const id = <Nibe1155ModbusIds>+idString;
                            const d = Nibe1155ModbusRegisters.regDefById[id];
                            let v: Nibe1155Value;
                            switch (d.classname) {
                                case 'Nibe1155Value':                v = new Nibe1155Value(data.values[id]); break;
                                case 'Nibe1155CompressorStateValue': v = new Nibe1155CompressorStateValue(data.values[id]); break;
                                case 'Nibe1155PumpStateValue':       v = new Nibe1155PumpStateValue(data.values[id]); break;
                                case 'Nibe1155PumpModeValue':        v = new Nibe1155PumpModeValue(data.values[id]); break;
                                case 'Nibe1155OperationModeValue':   v = new Nibe1155OperationModeValue(data.values[id]); break;
                                case 'Nibe1155AlarmValue':           v = new Nibe1155AlarmValue(data.values[id]); break;
                                default:
                                    throw new Error('values: invalid classname ' + d.classname + ' for id ' + idString);
                            }
                            this._values[id] = v;
                        } catch (err) {
                            const msg = 'error on values.' + idString;
                            CommonLogger.warn(msg + '\n%e', err);
                            throw new Error(msg);
                        }
                    }
                } else {
                    throw new Error('attribute ' + a + ' not found in data:INibe1155MonitorRecord');
                }
                attCnt++;
            }
            if (attCnt !== Object.getOwnPropertyNames(this).length) {
                throw new Error('attribute count mismatch');
            }

        } catch (err) {
            throw new Nibe1155MonitorRecordError(data, 'parsing INibe1155MonitorRecord fails', err);
        }
    }

    public toObject (preserveDate = true): INibe1155MonitorRecord {
        const rv: INibe1155MonitorRecord = {
            createdAt: preserveDate ? this._createdAt : this._createdAt.getTime()
        };
        if (this._controller)  { rv.controller =          this._controller.toObject(); }
        if (this._logsetIds)  { rv.logsetIds =           Array.from(this._logsetIds); }
        if (this._values) {
            const ids = Object.getOwnPropertyNames(this._values);
            if (ids.length > 0) {
                rv.values = {};
                ids.forEach( (id) =>  { (<any>rv).values[id] = (<any>this._values)[id].toObject(preserveDate); });
            }
        }
        return rv;
    }

    public get createdAt (): Date {
        return this._createdAt;
    }

    public get controller (): Nibe1155Controller {
        return this._controller;
    }

    public get logsetIds (): number [] {
        return this._logsetIds;
    }

    public get values (): { [ id in Nibe1155ModbusIds ]?: Nibe1155Value } {
        return this._values ? this._values : {};
    }

    public get supplyS1Temp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyS1Temp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get supplyS1ReturnTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyS1ReturnTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get brineInTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brineInTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get brineOutTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brineOutTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get condensorOutTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['condensorOutTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get hotGasTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['hotGasTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get liquidLineTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['liquidLineTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get suctionTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['suctionTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get supplyTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get degreeMinutes (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['degreeMinutes'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get calcSupplyTemp (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['calcSupplyTemp'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get electricHeaterPower (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['electricHeaterPower'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get compressorFrequency (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorFrequency'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get compressorInPower (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorInPower'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get compressorState (): Nibe1155CompressorStateValue {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorState'].id];
        return v instanceof Nibe1155CompressorStateValue ? v : null;
    }

    public get supplyPumpState (): Nibe1155PumpStateValue {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyPumpState'].id];
        return v instanceof Nibe1155PumpStateValue ? v : null;
    }

    public get brinePumpState (): Nibe1155PumpStateValue {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brinePumpState'].id];
        return v instanceof Nibe1155PumpStateValue ? v : null;
    }

    public get supplyPumpSpeed (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyPumpSpeed'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public get brinePumpSpeed (): Nibe1155Value {
        const v = this._values && this._values[<Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brinePumpSpeed'].id];
        return v instanceof Nibe1155Value ? v : null;
    }

    // ****************************************************

    public getControllerMode (): { valueAt: Date, value: HeatpumpControllerMode } | null {
        if (!this._controller) { return null; }
        return { valueAt: this._controller.createdAt, value: this._controller.state };    }

    public getControllerModeAsString (maxAgeSeconds = 20): string | null {
        if (!this._controller) { return null; }
        return this.getValueAsString(this.getControllerMode(), maxAgeSeconds);
    }

    public getControllerFSetpoint (): { valueAt: Date, value: number } | null {
        if (!this._controller) { return null; }
        return { valueAt: this._controller.createdAt, value: this._controller.fCompressor };
    }

    public getControllerFSetpointAsNumber (maxAgeSeconds = 20): number | null {
        if (!this._controller) { return null; }
        return this.getValueAsNumber(this.getControllerFSetpoint(), maxAgeSeconds);
    }

    // ****************************************************

    public getSupplyS1Temp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyS1Temp'].id; // 40008
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyS1TempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyS1Temp(), maxAgeSeconds);
    }

    public getSupplyS1ReturnTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyS1ReturnTemp'].id; // 40012
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyS1ReturnTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyS1ReturnTemp(), maxAgeSeconds);
    }

    public getBrineInTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brineInTemp'].id; // 40015
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getBrineInTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getBrineInTemp(), maxAgeSeconds);
    }

    public getBrineOutTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brineOutTemp'].id; // 40016
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getBrineOutTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getBrineOutTemp(), maxAgeSeconds);
    }

    public getCondensorOutTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['condensorOutTemp'].id; // 40017
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCondensorOutTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCondensorOutTemp(), maxAgeSeconds);
    }

    public getHotGasTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['hotGasTemp'].id; // 40018
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getHotGasTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getHotGasTemp(), maxAgeSeconds);
    }

    public getLiquidLineTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['liquidLineTemp'].id; // 40022
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getLiquidLineTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getLiquidLineTemp(), maxAgeSeconds);
    }

    public getSuctionTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['suctionTemp'].id; // 40022
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSuctionTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSuctionTemp(), maxAgeSeconds);
    }

    public getSupplyTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyTemp'].id; // 40071
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyTemp(), maxAgeSeconds);
    }

    public getDegreeMinutes (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['degreeMinutes'].id; // 43005
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getDegreeMinutesAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getDegreeMinutes(), maxAgeSeconds);
    }

    public getCalcSupplyTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['calcSupplyTemp'].id; // 43009
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCalcSupplyTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCalcSupplyTemp(), maxAgeSeconds);
    }

    public getElectricHeaterPower (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['electricHeaterPower'].id; // 43084
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getElectricHeaterPowerAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getElectricHeaterPower(), maxAgeSeconds);
    }

    public getCompressorFrequency (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorFrequency'].id; // 43136
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompressorFrequencyAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCompressorFrequency(), maxAgeSeconds);
    }

    public getCompressorInPower (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorInPower'].id; // 43141
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompressorInPowerAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCompressorInPower(), maxAgeSeconds);
    }

    public getCompressorState (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compressorState'].id; // 43427
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompressorStateAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getCompressorState(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case  20: return 'Stopped';
            case  40: return 'Starting';
            case  60: return 'Running';
            case 100: return 'Stopping';
            default: return '?(' + v + ')';
        }
    }

    public getSupplyPumpState (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyPumpState'].id; // 43431
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyPumpStateAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getSupplyPumpState(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case 10: return 'off';
            case 15: return 'starting';
            case 20: return 'on';
            case 40: return '10-day-mode';
            case 80: return 'calibration';
            default: return '?(' + v + ')';
        }
    }


    public getBrinePumpState (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brinePumpState'].id; // 43433
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getBrinePumpStateAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getBrinePumpState(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case 10: return 'off';
            case 15: return 'starting';
            case 20: return 'on';
            case 40: return '10-day-mode';
            case 80: return 'calibration';
            default: return '?(' + v + ')';
        }
    }


    public getSupplyPumpSpeed (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyPumpSpeed'].id; // 40437
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyPumpSpeedAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyPumpSpeed(), maxAgeSeconds);
    }

    public getBrinePumpSpeed (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brinePumpSpeed'].id; // 40439
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getBrinePumpSpeedAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getBrinePumpSpeed(), maxAgeSeconds);
    }



    
    // **************************************************

    public getOutdoorTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['outdoorTemp'].id; // 40004
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getOutdoorTempAsNumber (maxAgeSeconds = 90 * 60): number | null {
        return this.getValueAsNumber(this.getOutdoorTemp(), maxAgeSeconds);
    }

    public getRoomTemp (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['roomTemp'].id; // 40033
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getRoomTempAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getRoomTemp(), maxAgeSeconds);
    }

    public getEnergyCompAndElHeater (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['energyCompAndElHeater'].id; // 42439
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getEnergyCompAndElHeaterAsNumber (maxAgeSeconds = 3600): number | null {
        const rv = this.getValueAsNumber(this.getEnergyCompAndElHeater(), maxAgeSeconds);
        return typeof rv === 'number' ? rv * 1000 : rv;
    }

    // outdoorTempAverage: [40067]
    // currentL1:          [40079]
    // currentL2:          [40081]
    // currentL3:          [40083]

    public getEnergyCompressor (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['energyCompressor'].id; // 42447
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getEnergyCompressorAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getEnergyCompressor(), maxAgeSeconds);
    }

    public getCompFrequTarget (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compFrequTarget'].id; // 43182
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompFrequTargetAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCompFrequTarget(), maxAgeSeconds);
    }

    // compPower10Min [43375]

    public getCompNumberOfStarts (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compNumberOfStarts'].id; // 43416
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompNumberOfStartsAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCompNumberOfStarts(), maxAgeSeconds);
    }

    public getCompTotalOperationTime (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['compTotalOperationTime'].id; // 43420
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getCompTotalOperationTimeAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getCompTotalOperationTime(), maxAgeSeconds);
    }

    public getAlarm (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['alarm'].id; // 45001
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getAlarmAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getAlarm(), maxAgeSeconds);
    }

    public getAlarmAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getAlarm(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case    0: return 'Kein Fehler';
            case  163: return 'Hohe Kondensatortemperatur';
            default:   return '?(' + v + ')';
        }
    }

    // alarmReset [45171]

    public getHeatCurveS1 (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['heatCurveS1'].id; // 47007
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getHeatCurveS1AsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getHeatCurveS1(), maxAgeSeconds);
    }

    public getHeatOffsetS1 (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['heatOffsetS1'].id; // 47011
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getHeatOffsetS1AsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getHeatOffsetS1(), maxAgeSeconds);
    }

    public getSupplyMinS1 (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyMinS1'].id; // 47015
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyMinS1AsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyMinS1(), maxAgeSeconds);
    }

    public getSupplyMaxS1 (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyMaxS1'].id; // 47019
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyMaxS1AsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyMaxS1(), maxAgeSeconds);
    }

    // ownHeatCurveP7 [47020]
    // ownHeatCurveP6 [47021]
    // ownHeatCurveP5 [47022]
    // ownHeatCurveP4 [47023]
    // ownHeatCurveP3 [47024]
    // ownHeatCurveP2 [47025]
    // ownHeatCurveP1 [47026]

    public getRegMaxSupplyDiff (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['regMaxSupplyDiff'].id; // 47100
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getRegMaxSupplyDiffAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyMaxS1(), maxAgeSeconds);
    }

    public getRegMinCompFrequ (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['regMinCompFrequ'].id; // 47103
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getRegMinCompFrequAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getRegMinCompFrequ(), maxAgeSeconds);
    }

    public getRegMaxCompFrequ (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['regMaxCompFrequ'].id; // 47104
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getRegMaxCompFrequAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getRegMaxCompFrequ(), maxAgeSeconds);
    }

    public getOperationalMode (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['operationalMode'].id; // 47137
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getOperationalModeAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getOperationalMode(), maxAgeSeconds);
    }

    public getOperationalModeAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getOperationalMode(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case 0: return 'auto';
            case 1: return 'manual';
            case 2: return 'add heat only';
            default:   return '?(' + v + ')';
        }
    }

    public getSupplyPumpMode (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['supplyPumpMode'].id; // 47138
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getSupplyPumpModeAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getSupplyPumpMode(), maxAgeSeconds);
    }

    public getSupplyPumpModeAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getSupplyPumpMode(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case 10: return 'intermittent';
            case 20: return 'continous';
            case 30: return 'economy';
            case 40: return 'auto';
            default: return '?(' + v + ')';
        }
    }

    public getBrinePumpMode (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['brinePumpMode'].id; // 47139
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getBrinePumpModeAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getBrinePumpMode(), maxAgeSeconds);
    }

    public getBrinePumpModeAsString (maxAgeSeconds = 20): string | null {
        const v = this.getValueAsNumber(this.getBrinePumpMode(), maxAgeSeconds);
        if (!v) { return null; }
        switch (v) {
            case 10: return 'intermittent';
            case 20: return 'continous';
            case 30: return 'economy';
            case 40: return 'auto';
            default: return '?(' + v + ')';
        }
    }

    public getDmStartHeating (): Nibe1155Value | null {
        const id = <Nibe1155ModbusIds>Nibe1155ModbusRegisters.regDefByLabel['dmStartHeating'].id; // 47206
        const v = this._values && this._values[id];
        return v instanceof Nibe1155Value ? v : null;
    }

    public getDmStartHeatingAsNumber (maxAgeSeconds = 20): number | null {
        return this.getValueAsNumber(this.getDmStartHeating(), maxAgeSeconds);
    }


    // **************************************************

    public getBrinePumpPowerAsNumber (maxAgeSeconds = 20): number | null {
        const v = this.getBrinePumpSpeedAsNumber(maxAgeSeconds);
        if (v === null) { return null; }
        return 30 / 100 * v;
    }

    public getSupplyPumpPowerAsNumber (maxAgeSeconds = 20): number | null {
        const v = this.getSupplyPumpSpeedAsNumber(maxAgeSeconds);
        if (v === null) { return null; }
        return 30 / 100 * v;

    }

    public getFSetpointAsNumber(maxAgeSeconds = 20): number | null {
        if (!this._controller) { return null; }
        const tMin = Date.now() - maxAgeSeconds * 1000;
        const ts = this._controller.createdAt;
        if (!(ts instanceof Date)  || ts.getTime() < tMin) { return null; }
        let rv: number | undefined;
        switch (this._controller.config.mode) {
            case 'off': rv = 0; break;
            case 'frequency': rv = this._controller.config.fSetpoint; break;
            case 'temperature': rv = this._controller.config.fSetpoint; break;
            default: {
                const x = (this._controller.config as unknown as { fSetpoint?: number }).fSetpoint;
                if (typeof x === 'number' ) {
                    rv = x;
                }
            }
        }
        if (!(rv >= 0)) { return null; }
        return rv;

    }

    // **************************************************



    // **************************************************

    private getValueAsNumber (value: { valueAt: Date, value: number }, maxAgeSeconds: number): number | null {
        if (!value) { return null; }
        const tMin = Date.now() - maxAgeSeconds * 1000;
        const ts = value.valueAt;
        if (!(ts instanceof Date)  || ts.getTime() < tMin) { return null; }
        return value.value;
    }

    private getValueAsString (value: { valueAt: Date, value: string }, maxAgeSeconds: number): string | null {
        if (!value) { return null; }
        const tMin = Date.now() - maxAgeSeconds * 1000;
        const ts = value.valueAt;
        if (!(ts instanceof Date)  || ts.getTime() < tMin) { return null; }
        return value.value;
    }

}

export class Nibe1155MonitorRecordError extends Error {
    constructor (public data: INibe1155MonitorRecord, msg: string, public cause?: Error) { super(msg); }
}
