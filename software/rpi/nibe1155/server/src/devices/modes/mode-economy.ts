import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('ModeEconomy');


import { Nibe1155 } from '../nibe1155';
import { INibe1155Controller } from '../../data/common/nibe1155/nibe1155-controller';
import { sprintf } from 'sprintf-js';

export class ModeEconomy {

    private _dev: Nibe1155;
    private _limits = {
        f:          { min: 26, default: 30, max: 90 },
        temp:       { min: 20, default: 30, max: 55, thresholdMin: 5 },
        onSeconds:  { min: 5 * 60, max: Number.POSITIVE_INFINITY },
        offSeconds: { min: 5 * 60, max: Number.POSITIVE_INFINITY }
    };

    private _isCancelled: { promise: Promise<void>; res: () => void; rej: (error: any) => void; };
    private _isTimerActive: { timerId: NodeJS.Timer; promise: Promise<void>; res: () => void; rej: (error: any) => void; };

    private _fMin: number;
    private _fMax: number;
    private _fSetpoint: number;
    private _fDiffChangeAt: number;
    private _tempMin: number;
    private _fControllerSetpoint: number;
    private _fControllerKi: number;
    private _tempMax: number;
    private _compressor: {
        lastStartMillis: number;
        lastStopMillis: number;
    };

    constructor (dev: Nibe1155) {
        this._dev = dev;
        this._fMin = this._limits.f.min;
        this._fMax = this._limits.f.max;
        this._tempMin = this._limits.temp.min;
        this._tempMax = this._limits.temp.min + this._limits.temp.thresholdMin;
        this._compressor = { lastStartMillis: 0, lastStopMillis: 0 };
        this._fControllerKi = 0.01;
    }

    public setParams (mode: INibe1155Controller) {
        this._fMin = this.limitNumber(mode.fMin, this._limits.f, this._limits.f.default);
        this._fMax = this.limitNumber(mode.fMax, this._limits.f, this._limits.f.default);
        if (this._fMin > this._fMax) {
            this._fMin = this._fMax;
        }
        this._tempMin = this.limitNumber(mode.tempMin, this._limits.temp,  this._limits.temp.default);
        this._tempMax = this.limitNumber(mode.tempMax, this._limits.temp,  this._limits.temp.default);
        if (this._tempMin > (this._tempMax + this._limits.temp.thresholdMin)) {
            this._tempMax = this.limitNumber(this._tempMin + this._limits.temp.thresholdMin, this._limits.temp, this._limits.temp.max);
        }
        if (this._tempMax > this._limits.temp.max) {
            this._tempMax = this._limits.temp.max;
            this._tempMin = this._tempMax - this._limits.temp.thresholdMin;
        }
    }


    public cancel (): Promise<void> {
        let p: Promise<void>;
        if (this._isCancelled) {
            p = this._isCancelled.promise;
        } else {
            p = new Promise<void>( (res, rej) => {
                this._isCancelled = { promise: p, res: res, rej: rej };
            });
            if (this._isTimerActive) {
                clearTimeout(this._isTimerActive.timerId);
                this._isTimerActive.rej(new CancellationError());
                this._isTimerActive = null;
            }
        }
        return p;
    }

    public async start () {
        debug.info('start');
        try {
            debug.fine('start() - begin');
            let cnt = 5;
            this._compressor.lastStopMillis = Date.now();
            this._compressor.lastStartMillis = Date.now();
            if (this._dev.condensorOutTemp.value >= 57.0) {
                debug.warn('condensorOutTemp (%s) above maximum, skipping compressor start', this._dev.condensorOutTemp.value);
                return;
            }
            if (this._dev.compressorFrequency.value > 0) {
                this._fControllerSetpoint = this._dev.compressorFrequency.value;
            }
            while (this._dev.compressorFrequency.value === 0) {
                // if (this._isCancelled) { throw new CancellationError(); }
                if (this._isCancelled) { debug.warn('isCancelled -> %o', this._isCancelled); }
                try {
                    this._fControllerSetpoint = (this._fMin + this._fMax) / 2;
                    await this.startCompressor();
                } catch (err) {
                    if (--cnt <= 0) { throw new Error('compressor start fails'); }
                    debug.warn('compressor start fails, pause 5 seconds before trying again');
                    await this.delay(5, 'sec');
                }
            }

        } catch (err) {
            const e = err instanceof CancellationError ?
                new ModeEconomyError('start() fails', err) : new ModeEconomyError('start() cancelled', err);
            debug.warn('%e', e);
            throw e;
        } finally {
            debug.fine('start() - end');
        }
    }


    public async stop () {
        debug.info('stop');
        try {
            debug.fine('stop() - begin');
            let cnt = 5;
            while (this._dev.compressorFrequency.value > 0) {
                // if (this._isCancelled) { throw new CancellationError(); }
                if (this._isCancelled) { debug.warn('isCancelled -> %o', this._isCancelled); }
                try {
                    await this.stopCompressor('auto');
                } catch (err) {
                    if (--cnt <= 0) { throw new Error('compressor stop fails'); }
                    debug.warn('compressor stop fails, pause 10 seconds before trying again');
                    await this.delay(10, 'sec');
                }
            }
        } catch (err) {
            const e = new ModeEconomyError('stop() fails', err);
            debug.warn('%e', e);
            throw e;

        } finally {
            debug.fine('stop() - end');
        }
    }


    public async run () {
        debug.fine('run() - begin');
        try {
            // first: check temperature limit
            if (this._dev.condensorOutTemp.value >= 57.0) { // 58.8 -> Auto Off Alarm 163
                debug.finer('condensorOutTemp (%s) >= limit (57°C)', this._dev.condensorOutTemp.value);
                if (this._dev.compressorFrequency.value > 0) {
                    await this.stopCompressor();
                }
                return;
            }

            if (this._dev.compressorFrequency.value <= 0) {
                // compressor is off
                if ( (Date.now() - this._compressor.lastStopMillis) < (this._limits.offSeconds.min * 1000) ) {
                    debug.finer('minimal stop time not reached');
                } else if (this._dev.supplyTemp.value < this._tempMin) {
                    debug.finer('min temperature reached, switch on compressor');
                    await this.startCompressor();
                }

            } else {
                // compressor is running
                if (this._dev.supplyS1Temp.value >= this._tempMax) {
                    debug.finer('max temparture reached, switch off compressor');
                    await this.stopCompressor('auto');
                } else if ( (Date.now() - this._compressor.lastStartMillis) < (this._limits.onSeconds.min * 1000) ) {
                    debug.finer('minimal start time not reached');
                    await this.controlCompressorFrequency();
                } else if (this._dev.supplyTemp.value >= this._tempMax) {
                    debug.finer('max temperature reached, switch off compressor');
                    await this.stopCompressor('auto');
                } else {
                    await this.controlCompressorFrequency();
                }
            }

        } catch (err) {
            const e = new ModeEconomyError('run() fails', err);
            debug.warn('%e', e);
            throw e;

        } finally {
            debug.fine('run() - end');
        }
    }


    // *******************************************************************************************************
    // *******************************************************************************************************

    private delay (time: number, unit: 'millisec' | 'sec'): Promise<void> {
        const millis = unit === 'sec' ? time * 1000 : time;
        if (millis <= 0) { return; }
        const p = new Promise<void>( (res, rej) => {
            this._isTimerActive = { promise: p, res: res, rej: rej,
                timerId: setTimeout( () => {
                    this._isTimerActive = null;
                    res();
                }, millis)
            };
        });
        return p;
    }

    private limitNumber (value: number, range: { min: number, max: number }, defaultValue: number): number {
        if (value >= range.min && value <= range.max) {
            return value;
        } else if (value < range.min) {
            return range.min;
        } else if (value > range.max) {
            return range.max;
        } else {
            return defaultValue;
        }
    }


    private async startCompressor () {
        debug.fine('startCompressor() - begin');
        try {
            this._fDiffChangeAt = undefined;
            const t = this._dev.supplyTemp.value;
            await this._dev.writeHeatTempMin(60);
            await this._dev.writeHeatTempMax(60);
            if (this._isCancelled) { throw new CancellationError(); }

            if (this._dev.degreeMinutes.value > -60) {
                await this._dev.writeDegreeMinutes(-60);
                debug.finer('setting DM=-60, wait for compressor starting ...');
            } else {
                debug.finer('DM=%s, checking if compressor is running ...', this._dev.degreeMinutes.value);
            }
            const now = Date.now();
            while ((Date.now() - now) < 90000) {
                if (this._isCancelled) { throw new CancellationError(); }
                await this.delay(500, 'millisec');
                if (this._dev.compressorFrequency.value > 0) {
                    break;
                }
            }
            const setPointTemp = t + 0.1;
            await this._dev.writeHeatTempMin(setPointTemp);
            await this._dev.writeHeatTempMax(setPointTemp);
            if (this._dev.compressorFrequency.value > 0) {
                debug.finer('OK: Compressor is running');
                this._compressor.lastStartMillis = Date.now();
                if (!this._fControllerSetpoint || this._fControllerSetpoint < this._fMin || this._fControllerSetpoint > this._fMax) {
                    this._fControllerSetpoint = (this._fMin + this._fMax) / 2;
                }
            } else {
                throw new Error('compressor has not started');
            }
        } catch (err) {
            const e = new ModeEconomyError('startCompressor fails', err);
            debug.warn('%e', e);
            throw e;

        } finally {
            debug.fine('startCompressor() - end');
        }
    }


    private async stopCompressor (supplyPumpMode: 'economy' | 'auto' = 'economy') {
        debug.fine('stopCompressor() - begin');
        try {
            await this._dev.writeDegreeMinutes(1);
            await this._dev.writeHeatTempMin(20);
            await this._dev.writeHeatTempMax(20);
            await this._dev.writeBrinePumpMode('auto');
            await this._dev.writeSupplyPumpMode(supplyPumpMode);
            if (supplyPumpMode === 'auto') {
                await this._dev.writeAutoHeatMedPumpSpeed(10);
            }
            const now = Date.now();
            while ((Date.now() - now) < 90000) {
                if (this._isCancelled) { throw new CancellationError(); }
                await this.delay(500, 'millisec');
                if (this._dev.compressorFrequency.value <= 0) {
                    this._compressor.lastStopMillis = Date.now();
                    this._fDiffChangeAt = undefined;
                    this._fSetpoint = 0;
                    // this._fControllerSetpoint = 0;
                    return;
                }
            }
            throw new Error('compressor stop fails');
        } catch (err) {
            const e = new ModeEconomyError('stopCompressor fails', err);
            debug.warn('%e', e);
            throw e;
        } finally {
            debug.fine('stopCompressor() - end');
        }
    }


    private async controlCompressorFrequency () {
        debug.fine('controlCompressorFrequency() - begin');
        try {
            const currFrequ = this._dev.compressorFrequency.value;
            const currTemp = this._dev.supplyTemp.value;

            const fLimit = { min: this._fMin, max: this._fMax };
            const tDiff = (this._tempMin + this._tempMax) / 2 - currTemp;
            this._fControllerSetpoint = this.limitNumber(this._fControllerSetpoint, fLimit, this._fMin);
            this._fControllerSetpoint += this._fControllerKi * tDiff;
            debug.finer('fControllerSetpoint %sHz', sprintf('%.02f', this._fControllerSetpoint));

            const desiredFrequency = Math.round(this.limitNumber(this._fControllerSetpoint, fLimit, this._fMin));
            const p1 = { x: 54, y: desiredFrequency };
            const p2 = { x: 56, y: fLimit.min };

            let fSetpoint = desiredFrequency;
            const tV = this._dev.supplyS1Temp.value;
            const t = this._dev.supplyTemp.value;
            await this._dev.writeHeatTempMin(t + 0.1);
            await this._dev.writeHeatTempMax(t + 0.1);

            if (tV < p1.x) {
                fSetpoint = p1.y;
            } else if (t >= p2.x) {
                fSetpoint = p2.y;
            } else {
                const k = (p1.y - p2.y) / (p1.x - p2.x);
                const d = p1.y - k * p1.x;
                fSetpoint = Math.round(k * tV + d);
            }
            this._fSetpoint = fSetpoint;
            const diff = currFrequ - fSetpoint;
            if (Math.abs(diff) > 2) {
                if (!this._fDiffChangeAt || (this._fDiffChangeAt > 0 && (Date.now() - this._fDiffChangeAt) >= 10000)) {
                    const dm = diff > 0 ? Math.min(  -1, this._dev.degreeMinutes.value + 10) :
                                          Math.max(-400, this._dev.degreeMinutes.value - 10);
                    debug.finer('fSetpoint %sHz (%s°C) out of range (f=%sHz), change degreeminutes to %s', fSetpoint, tV, currFrequ, dm);
                    await this._dev.writeDegreeMinutes(dm);
                    this._fDiffChangeAt = Date.now();
                }
            }

        } catch (err) {
            const e = new ModeEconomyError('controlCompressorFrequency fails', err);
            debug.warn(e);
            throw e;
        } finally {
            debug.fine('controlCompressorFrequency() - end');
        }
    }

}

export class CancellationError extends Error {}

export class ModeEconomyError extends Error {
    public cause: any;
    constructor (message?: string, cause?: any) {
        super (message);
        this.cause = cause;
    }
}
