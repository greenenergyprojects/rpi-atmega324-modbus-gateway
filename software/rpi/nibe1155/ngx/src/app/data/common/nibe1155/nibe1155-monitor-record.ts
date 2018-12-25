
import { DataRecord } from '../data-record';
import { INibe1155Value, Nibe1155Value, Nibe1155CompressorStateValue, Nibe1155PumpStateValue, Nibe1155PumpModeValue,
         Nibe1155AlarmValue, Nibe1155OperationModeValue } from './nibe1155-value';
import { Nibe1155ModbusRegisters, Nibe1155ModbusIds } from './nibe1155-modbus-registers';
import { INibe1155Controller, Nibe1155Controller } from './nibe1155-controller';
import { CommonLogger } from '../../common-logger';

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

    public constructor (data: INibe1155MonitorRecord) {
        super(data);
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
                            CommonLogger.warn('Nibe1155MonitorRecord.constructor', msg, err);
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
        if (this._controller)          { rv.controller =          this._controller.toObject(preserveDate); }
        if (this._logsetIds)           { rv.logsetIds =           Array.from(this._logsetIds); }
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

}

export class Nibe1155MonitorRecordError extends Error {
    constructor (public data: INibe1155MonitorRecord, msg: string, public cause?: Error) { super(msg); }
}
