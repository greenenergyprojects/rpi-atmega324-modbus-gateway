


interface IModbusSerialConfig {
    device:  string;
    options: SerialPort.OpenOptions;
}

import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('modbus:ModbusSerial');

import * as SerialPort from 'serialport';
import { sprintf } from 'sprintf-js';
import * as nconf from 'nconf';
import { ModbusAsciiFrame } from './modbus-ascii-frame';


export class ModbusSerial {

    private _config: IModbusSerialConfig;
    private _serialPort: SerialPort;
    private _openPromise: { resolve: () => void, reject: (err: Error) => void};
    private _writePromise: { resolve: (f: ModbusAsciiFrame) => void, reject: (err: Error) => void};
    private _frame: string;
    private _receivedFrames: ModbusAsciiFrame [] = [];

    public constructor (config?: IModbusSerialConfig) {
        this._config = config || nconf.get('modbus-serial');
        if (!this._config || !this._config.device || !this._config.options) { throw new Error('missing/wrong config'); }
        this._config.options.autoOpen = false;
    }

    public async open () {
        if (this._openPromise) {
            return Promise.reject(new Error('open already called, execute close() first.'));
        }
        const rv: Promise<void> = new Promise<void>( (resolve, reject) => {
            this._serialPort = new SerialPort(this._config.device, this._config.options);
            // this._serialPort.on('open', this.handleOnSerialOpen.bind(this));
            this._serialPort.on('error', this.handleOnSerialError.bind(this));
            this._serialPort.on('data', this.handleOnSerialData.bind(this));
            this._openPromise = { resolve: resolve, reject: reject };
            this._serialPort.open( (err) => {
                if (!this._openPromise || !this._openPromise.resolve) { return; }
                if (err) {
                    debug.warn('cannot open serial port ' + this._config.device);
                    this._openPromise.reject(err);
                } else {
                    const o = Object.assign(this._config.options);
                    delete o.autoOpen;
                    debug.info('serial port ' + this._config.device + ' opened (' + JSON.stringify(o) + ')');
                    this._openPromise.resolve();
                }
                this._openPromise = null;
            });
        });
        return rv;
    }

    public async write (request: ModbusAsciiFrame): Promise<ModbusAsciiFrame> {
        if (!this._serialPort || this._openPromise) { throw new Error('serialPort not open'); }
        if (this._writePromise) { throw new Error('request pending'); }
        const rv: Promise<ModbusAsciiFrame> = new Promise<ModbusAsciiFrame>(  (resolve, reject) => {
            this._serialPort.write(request.frame);
            this._writePromise = { resolve: resolve, reject: reject };
        });
        return rv;
    }

    private handleOnSerialError (err: any) {
        debug.warn(err);
    }

    private handleOnSerialData (data: Buffer) {

        if (!(data instanceof Buffer)) {
            debug.warn('serial input not as expected...');
            return;
        }
        if (!this._writePromise) {
            debug.warn('unexpected bytes (no request pending) received (%o)', data);
        } else {
            for (const b of data) {
                const c = String.fromCharCode(b);
                if (c === ':') {
                    if (this._frame) {
                        debug.warn('unexpected start of frame, ignore recent bytes (%s)', this._frame);
                    }
                    this._frame = ':';
                } else if (c !== '\n') {
                    this._frame += c;
                } else {
                    this._frame += c;
                    try {
                        const f = new ModbusAsciiFrame(this._frame);
                        if (f.lrcOk) {
                            debug.finer('Valid modbus frame received: %s', f.frame);
                        } else {
                            debug.warn('Modbus frame with LRC error received: %s', f.frame);
                        }
                        this._receivedFrames.push(new ModbusAsciiFrame(this._frame));
                        if (this._receivedFrames.length === 2) {
                            if (this._writePromise) {
                                this._writePromise.resolve(this._receivedFrames[1]);
                                this._writePromise = null;
                                this._receivedFrames = [];
                            }
                        }
                    } catch (err) {
                        debug.warn('invalid modbus frame received\n%e', err);
                    }
                    this._frame = null;
                }
            }
        }
    }

}
