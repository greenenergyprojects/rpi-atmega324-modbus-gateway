
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:HeatPump');
const debugState: debugsx.IFullLogger = debugsx.createFullLogger('HeatPump.State');

import { Nibe1155 } from './nibe1155';
import { HeatpumpControllerMode, Nibe1155Controller, INibe1155Controller } from '../data/common/nibe1155/nibe1155-controller';
import { ModeEconomy } from './modes/mode-economy';
import { runInThisContext } from 'vm';

const allowElectricHeat = true;

// export type State = 'init' | 'off' | 'error' | 'test' | 'frequency' | 'economy';

// export interface IController {
//     createdAt: Date;
//     state: HeatpumpControllerMode;
//     running: boolean;
//     desiredState?: HeatpumpControllerMode;
//     inProgressSince?: Date;
//     setPointTemp?: number;
//     fSetpoint?: number;
// }

export interface IHeatPumpControllerStartConfig {
    disabled: boolean;
    mode: HeatpumpControllerMode;
    fSetpoint?: number;
    tmin?: number;
    tmax?: number;
    pmax?: number; // add heater electrical power maximum
}

export interface IHeatPumpConfig {
    disabled: boolean;
    start?: IHeatPumpControllerStartConfig [];
}

export class HeatPump {

    public static async createInstance (nibe1155: Nibe1155, config: IHeatPumpConfig): Promise<HeatPump> {
        if (this._instance) { throw new Error('instance already created'); }
        const rv = new HeatPump(nibe1155, config);
        this._instance = rv;
        return rv;
    }

    public static getInstance (): HeatPump {
        if (!this._instance) { throw new Error('no instance created yet'); }
        return this._instance;
    }

    private static _instance: HeatPump;

    // ******************************************************************

    private _config: IHeatPumpConfig;
    private _nibe1155: Nibe1155;
    private _state: HeatpumpControllerMode;
    private _desiredState: HeatpumpControllerMode;
    private _recentState: HeatpumpControllerMode;
    private _inProgressSince: Date;
    private _timer: NodeJS.Timer | undefined;

    private _dmWrittenAt: number;
    private _addHeaterEnabled: boolean | undefined;
    private _fmin = 20;
    private _fmax = 100;
    private _fmaxTHigh = 70;

    private _f = 0;       // frequency setpoint for frequency mode
    private _tmin = 42;   // tmin for temperature mode (-> on)
    private _tmax = 45;   // tmax for temperature mode (-> off)
    private _pmax = 0;    // maximum electrical heater power

    private _regTempMin: number | undefined;
    private _regTempMax: number | undefined;

    private constructor (nibe1155: Nibe1155, config?: IHeatPumpConfig) {
        this._config = config || { disabled: true };
        this._nibe1155 = nibe1155;
        this._state = HeatpumpControllerMode.init;
    }


    public async start (startConfig?: IHeatPumpControllerStartConfig) {
        if (this._config.disabled) {
            debug.warn('Heatpump disabled -> skip starting');
            this._state = HeatpumpControllerMode.disabled;
            return;
        }
        if (this._timer) { throw new Error('already started'); }
        if ((!startConfig || startConfig.disabled) && Array.isArray(this._config.start)) {
            for (const cfg of this._config.start) {
                if (!cfg.disabled) {
                    startConfig = cfg;
                    break;
                }
            }
        }
        if (!startConfig || startConfig.disabled) {
            debug.warn('invalid startConfig %o -> start in OFF', startConfig);
            startConfig = { disabled: false, mode: HeatpumpControllerMode.off };
        }
        this._f = typeof startConfig.fSetpoint === 'number' && startConfig.fSetpoint >= 20 && startConfig.fSetpoint <= 100
            ? startConfig.fSetpoint
            : 0;

        this._pmax = typeof startConfig.pmax === 'number' && startConfig.pmax >= 0 && startConfig.fSetpoint <= 6500
            ? startConfig.pmax
            : 0;

        this._tmin = typeof startConfig.tmin === 'number' && startConfig.tmin >= 25 && startConfig.tmin <= 50
            ? startConfig.tmin
            : 42;

        this._tmax = typeof startConfig.tmax === 'number' && startConfig.tmax >= 28 && startConfig.tmax <= 55
            ? Math.max(startConfig.tmin, this._tmin + 3)
            : this._tmin + 3;

        this._desiredState = startConfig.mode;
        this._timer = setInterval( () => this.handleStateMachine(), 2000);
        process.nextTick( () => this.handleStateMachine() );
    }

    public async stop () {
        if (this._timer) { throw new Error('not started'); }
        clearInterval(this._timer);
        this._timer = undefined;
        this._state = HeatpumpControllerMode.disabled;
    }

    public get state (): HeatpumpControllerMode {
        return this._state;
    }

    public async setDesiredMode (mode: INibe1155Controller): Promise<INibe1155Controller> {
        console.log('===> setDesiredMode', mode);
        switch (mode.desiredMode) {
            case 'off':         this._desiredState = HeatpumpControllerMode.off; break;
            case 'frequency':   this._desiredState =  HeatpumpControllerMode.frequency; break;
            case 'temperature': this._desiredState =  HeatpumpControllerMode.temperature; break;
            case 'test':        this._desiredState = HeatpumpControllerMode.test; break;
            default: {
                throw new Error('unsupported mode ' + mode.desiredMode);
            }
        }
        this._f = typeof mode.fSetpoint === 'number' && mode.fSetpoint >= 20 && mode.fSetpoint <= 100
            ? mode.fSetpoint
            : 0;

        let pmax = typeof mode.addHeaterPowerMax === 'number' && mode.addHeaterPowerMax >= 0 && mode.fSetpoint <= 6500
            ? mode.addHeaterPowerMax
            : 0;
        if (pmax > 0) {
            pmax = Math.round(pmax / 500) * 500;
        }
        if (pmax !== this._pmax) {
            this._pmax = pmax;
            this._addHeaterEnabled = undefined;
        }

        this._tmin = typeof mode.tempMin === 'number' && mode.tempMin >= 20 && mode.tempMin <= 60
            ? mode.tempMin
            : 42;

        this._tmax = typeof mode.tempMax === 'number' && mode.tempMax >= 20 && mode.tempMax <= 60
            ? Math.max(mode.tempMax, this._tmin + 3)
            : this._tmin + 3;



        const rv: INibe1155Controller = {
            createdAt: new Date(),
            currentMode: this._state,
            desiredMode: this._desiredState,
            fSetpoint: this._f,
            tempMin: this._tmin,
            tempMax: this._tmax,
            addHeaterPowerMax: this._pmax
        };
        debug.info('setting desired mode %o', rv);
        return rv;
    }

    public toObject (preserveDate = true): INibe1155Controller {
        const rv: INibe1155Controller = {
            createdAt:        preserveDate ? new Date() : Date.now(),
            running:          this._timer !== undefined,
            currentMode:      this._state,
            inProgressSince:  preserveDate ? this._inProgressSince : this._inProgressSince.getTime(),
            fSetpoint:        this._f,
            tempMin:          this._tmin,
            tempMax:          this._tmax,
            addHeaterPowerMax: this._pmax
        };
        if (this._state !== this._desiredState) {
            rv.desiredMode = this._desiredState;
        }
        return rv;
    }


    // private async handleModeAutoAsync (config: IHeatPumpControllerStartConfig): Promise<void> {
    //     debug.finer('handleModeAutoAsync()');
    //     // tslint:disable-next-line: max-line-length
    //     console.log('AUTO/Temp: Puffer=' + this._nibe1155.supplyTemp.value + ', Vorlauf=' + this._nibe1155.supplyS1Temp.value + ', Rücklauf=' + this._nibe1155.supplyS1ReturnTemp.value + ', f=' + this._nibe1155.compressorFrequency.value + 'Hz');
    //     if (Date.now() - this._modeAutoChangeAtMillis < (1000 * 60 * 10)) {
    //         console.log('time blocked');
    //     } else {
    //         switch (this._desiredState) {
    //             case HeatpumpControllerMode.off: {
    //                 if (this._nibe1155.supplyTemp.value < 45) {
    //                     this._modeAutoChangeAtMillis = Date.now();
    //                     debug.info('handleModeAutoAsync: -> ON');
    //                     this._fSetpoint = 23;
    //                     this._desiredState = HeatpumpControllerMode.frequency;
    //                 }
    //                 break;
    //             }
    //             case HeatpumpControllerMode.frequency: {
    //                 if (this._nibe1155.supplyTemp.value >= 47 && this._nibe1155.supplyS1Temp.value >= 50) {
    //                     this._modeAutoChangeAtMillis = Date.now();
    //                     debug.info('handleModeAutoAsync: -> OFF');
    //                     this._desiredState = HeatpumpControllerMode.off;
    //                 }
    //                 break;
    //             }
    //         }
    //     }
    //     await this.disableElectricHeater();
    // }

    private async delay (milliSeconds: number) {
        return new Promise<void> ( (res, rej) => {
            setTimeout( () => { res(); }, milliSeconds);
        });
    }

    // private limitNumber (value: number, min: number, max: number, defaultValue: number): number {
    //     if (value >= min && value <= max) {
    //         return value;
    //     } else if (value < min) {
    //         return min;
    //     } else if (value > max) {
    //         return max;
    //     } else {
    //         return defaultValue;
    //     }
    // }

    private async handleStateMachine () {
        if (this._inProgressSince) { return; }
        try {
            this._inProgressSince = new Date();
            let nextState: HeatpumpControllerMode;
            switch (this._state) {
                case 'init':        nextState = await this.handleStateInit(); break;
                case 'off':         nextState = await this.handleStateOff(); break;
                case 'frequency':   nextState = await this.handleStateFrequency(); break;
                case 'test':        nextState = await this.handleStateTest(); break;
                case 'temperature': nextState = await this.handleStateTemperature(); break;
                case 'error':       nextState = await this.handleStateError(); break;
                default:
                    debugState.warn('state %s not supported', this._state); break;
            }
            if (nextState && nextState !== this._state) {
                this._recentState = this._state;
                this._state = nextState;
            } else {
                this._recentState = this._state;
            }
        } catch (err) {
            debug.warn (err);
        } finally {
            this._inProgressSince = undefined;
        }
    }

    private async handleStateInit (): Promise<HeatpumpControllerMode> {
        if (this._recentState !== HeatpumpControllerMode.init) {
            debugState.info('[INIT]: starting...');
        }
        try {
            let x = 0;

            // const dm = await this._nibe1155.getRegisterValue(43005, -1);
            // debug.info('[INIT]: current DM (47212) = ', dm);

            // await this._nibe1155.writeAddHeaterMaxPower(0);         // 47212
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // x = await this._nibe1155.getRegisterValue(47212, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // debug.info('[INIT]: add heater max power (47212) = ', x);

            // // await this._nibe1155.writeActivateCutOffFreq1(false);
            // await this._nibe1155.writeCutOffFreq1Start(100);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // await this._nibe1155.writeCutOffFreq1Stop(120);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // await this._nibe1155.writeActivateCutOffFreq1(true);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf1Activated = await this._nibe1155.getRegisterValue(48660, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf1Start = await this._nibe1155.getRegisterValue(48662, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf1End = await this._nibe1155.getRegisterValue(48664, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // debug.info('[INIT]: cut off frequency 1 %s (%s..%sHz)',
            //     cf1Activated === 1 ? 'activated' : 'deactivated', cf1Start, cf1End
            // );

            // // await this._nibe1155.writeActivateCutOffFreq2(false);
            // await this._nibe1155.writeCutOffFreq2Start(70);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // await this._nibe1155.writeCutOffFreq2Stop(100);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // await this._nibe1155.writeActivateCutOffFreq2(false);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf2Activated = await this._nibe1155.getRegisterValue(48659, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf2Start = await this._nibe1155.getRegisterValue(48661, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // const cf2End = await this._nibe1155.getRegisterValue(48663, -1);
            // if (dm < 0) { await this._nibe1155.writeDegreeMinutes(dm); }
            // debug.info('[INIT]: cut off frequency 2 %s (%s..%sHz)',
            //     cf2Activated === 1 ? 'activated' : 'deactivated', cf2Start, cf2End
            // );

            debugState.info('[INIT]: OK');
            return this._desiredState;

        } catch (error) {
            debugState.warn('[INIT]: fails -> switch to OFF\n%e', error);
            return HeatpumpControllerMode.off;
        }
    }

    private async handleStateOff (): Promise<HeatpumpControllerMode> {
        debugState.finer('handleStateOff(): recentState = %s', this._recentState);
        if (this._recentState !== HeatpumpControllerMode.off) {
            debug.info('[OFF]: start handleStateOff()');
            this._f = 0;
            this._pmax = 0;
        }
        await this.switchOffAsync(60000, HeatpumpControllerMode.off);
        return this._desiredState;
    }

    private async handleStateFrequency (): Promise<HeatpumpControllerMode> {
        debugState.finer('handleStateFrequency(): recentState = %s', this._recentState);
        if (this._recentState !== HeatpumpControllerMode.frequency) {
            debug.info('[FREQUENCY]: start handleStateFrequency()');
        }
        await this.updateTempMinMaxAsync(HeatpumpControllerMode.frequency);
        if (this._nibe1155.compressorFrequency.value <= 0) {
            try {
                await this.switchOnAsync(60, HeatpumpControllerMode.frequency);
            } catch (error) {
                debug.warn('[FREQUENCY]: switch on fails\n%e', error);
            }
        } else {
            await this.updateDmAsync(HeatpumpControllerMode.frequency);
        }

        return this._desiredState;
    }

    private async handleStateTemperature (): Promise<HeatpumpControllerMode> {
        debugState.finer('handleStateTemperature(): recentState = %s', this._recentState);
        if (this._recentState !== HeatpumpControllerMode.temperature) {
            debug.info('[TEMPERATURE]: start handleStateTemperature()');
        }
        await this.updateTempMinMaxAsync(HeatpumpControllerMode.temperature);

        if (this._nibe1155.compressorFrequency.value > 0) {
            debug.info('check switch off...');
            if (this._nibe1155.supplyTemp.value > this._tmax) {
                try {
                    await this.switchOffAsync(60, HeatpumpControllerMode.temperature);
                } catch (error) {
                    debug.warn('[TEMPERATURE]: switch off fails\n%e', error);
                }
            } else {
                await this.updateDmAsync(HeatpumpControllerMode.temperature);
            }

        } else {
            debug.info('check switch on... %d < %d', this._nibe1155.supplyTemp.value, this._tmin);
            if (this._nibe1155.supplyTemp.value < this._tmin) {
                try {
                    await this.switchOnAsync(60, HeatpumpControllerMode.temperature);
                } catch (error) {
                    debug.warn('[TEMPERATURE]: switch on fails\n%e', error);
                }
            }
        }

        return this._desiredState;
    }

    private async handleStateTest (): Promise<HeatpumpControllerMode> {
        debugState.finer('handleStateTest(): recentState = %s', this._recentState);
        if (this._recentState !== HeatpumpControllerMode.test) {
            debug.info('[TEST]: start handleStateTest()');
        }
        if (this._f <= 0) {
            if (this._nibe1155.compressorFrequency.value > 0) {
                try {
                    await this.switchOffAsync(60, HeatpumpControllerMode.test);
                } catch (error) {
                    debug.warn('[TEST]: switch on fails\n%e', error);
                }
            }
        } else {
            await this.updateTempMinMaxAsync(HeatpumpControllerMode.test);
            if (this._nibe1155.compressorFrequency.value <= 0) {
                try {
                    await this.switchOnAsync(60, HeatpumpControllerMode.temperature);
                } catch (error) {
                    debug.warn('[TEST]: switch on fails\n%e', error);
                }
            }
            if (this._nibe1155.condensorOutTemp.value <= 55) {
                const dm = await this.updateDmAsync(HeatpumpControllerMode.test);
                await this.disableAddHeaterAsync(HeatpumpControllerMode.test, dm);

            } else {
                await this.enableAddHeaterAsync(HeatpumpControllerMode.test);            }

        }

        if (this._desiredState !== HeatpumpControllerMode.test) {
            await this.disableAddHeaterAsync(HeatpumpControllerMode.test);
        }

        return this._desiredState;
    }

    private async handleStateError (): Promise<HeatpumpControllerMode> {
        debugState.finer('handleStateError(): recentState = %s', this._recentState);
        if (this._recentState !== HeatpumpControllerMode.error) {
            debug.info('[ERROR]: start handleStateError()');
        }
        return this._desiredState;
    }

    private async updateTempMinMaxAsync (checkState: HeatpumpControllerMode): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] updateTempMinMax';
        const t = this._nibe1155.supplyTemp.value;
        if (typeof t === 'number' && t > 0 && t < 80) {
            const tmin = Math.round((t - 0.2) * 10) / 10;
            const tmax = Math.round((t + 0.2) * 10) / 10;
            if (this._regTempMin === undefined || this._regTempMin < tmin || this._regTempMin > tmax) {
                debug.info('%s: writeHeatTempMin(' + tmin + ')...', msgHeader);
                await this._nibe1155.writeHeatTempMin(tmin);
                debug.info('%s: writeHeatTempMin(' + tmin + ')...done', msgHeader);
                this._regTempMin = tmin;
            }
            if (this._regTempMax === undefined || this._regTempMax < tmin || this._regTempMax > tmax) {
                debug.info('%s: writeHeatTempMax(' + tmax + ')...', msgHeader);
                await this._nibe1155.writeHeatTempMax(tmax);
                this._regTempMax = tmax;
                debug.info('%s: writeHeatTempMax(' + tmax + ')...done', msgHeader);
            }
        } else {
            debug.warn('%s: updateTempMinMaxAsync fails, t=%s', msgHeader, t);
        }
    }

    private async switchOffAsync (timeoutSeconds: number, checkState: HeatpumpControllerMode): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] switchOff';
        try {
            if (this._nibe1155.compressorFrequency.value > 0 || this._nibe1155.degreeMinutes.value <= 0) {
                debug.info('%s: write registers...', msgHeader);
                await this._nibe1155.writeDegreeMinutes(1);
                await this._nibe1155.writeHeatTempMin(20);
                await this._nibe1155.writeHeatTempMax(20);
                await this._nibe1155.writeBrinePumpMode('auto');
                await this._nibe1155.writeSupplyPumpMode('economy');
                await this._nibe1155.writeAddHeaterMaxPower(0);
                debug.info('%s: write registers... done', msgHeader);

            } else if (this._nibe1155.brinePumpSpeed.value > 0) {
                debug.info('%s: write register brine pump mode...', msgHeader);
                await this._nibe1155.writeBrinePumpMode('auto');
                debug.info('%s: write register brine pump mode...done', msgHeader);

            } else if (this._nibe1155.supplyPumpSpeed.value > 0) {
                debug.info('%s: write register supply pump mode...', msgHeader);
                await this._nibe1155.writeSupplyPumpMode('economy');
                debug.info('%s: write register supply pump mode...done', msgHeader);

            } else if (this._recentState !== HeatpumpControllerMode.off) {
                debug.info('%s: heat pump already off, no register change needed', msgHeader);
            }

            if (timeoutSeconds > 0) {
                const expired = Date.now() + timeoutSeconds * 1000;
                while (Date.now() < expired) {
                    const f = this._nibe1155.compressorFrequency.value;
                    const brineSpeed = this._nibe1155.brinePumpSpeed.value;
                    const supplySpeed = this._nibe1155.supplyPumpSpeed.value;
                    if (f === 0 && brineSpeed === 0 && supplySpeed === 0) {
                        return;
                    }
                    if (checkState && this._desiredState !== checkState) {
                        throw new Error(msgHeader + ': switch on fails caused by state abort');
                    }
                    debug.info('%s: waiting for heat pump is off...', msgHeader);
                    await this.delay(1000);
                }
                throw new Error(msgHeader + ': switch off expired');
            }

        } catch (error) {
            debug.warn('%s: switchOffAsync() fails\n%e', msgHeader, error);
            throw error;
        }
    }

    private async switchOnAsync (timeoutSeconds: number, checkState: HeatpumpControllerMode): Promise<void> {
        // debugger;
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] switchOn';
        try {
            if (this._nibe1155.compressorFrequency.value <= 0 || this._nibe1155.degreeMinutes.value >= 0) {
                const expired = timeoutSeconds > 0 ? Date.now() + timeoutSeconds * 1000 : Date.now();
                do {
                    if (checkState && checkState !== this._desiredState) {
                        throw new Error(msgHeader + ': switch on fails caused by state abort');
                    }
                    debug.info('%s: DM=-60...', msgHeader);
                    await this._nibe1155.writeDegreeMinutes(-60);
                    await this.delay(1000);
                    const f = this._nibe1155.compressorFrequency.value;
                    const brineSpeed = this._nibe1155.brinePumpSpeed.value;
                    const supplySpeed = this._nibe1155.supplyPumpSpeed.value;

                    if (f > 0 && brineSpeed > 0 && supplySpeed > 0) {
                        debug.info('%s: RUNNING (f=%dHz, brine=%d%%, supply=%d%%)', msgHeader, f, brineSpeed, supplySpeed);
                        return;
                    } else {
                        debug.info('%s: WAITING (f=%dHz, brine=%d%%, supply=%d%%)', msgHeader, f, brineSpeed, supplySpeed);
                    }

                } while (Date.now() < expired);

                throw new Error(msgHeader + ': timeout expired');
            }

        } catch (error) {
            debug.warn('%s: switchOnAsync() fails\n%e', msgHeader, error);
            throw error;
        }
    }

    private async updateDmAsync (checkState: HeatpumpControllerMode): Promise<number> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] updateDm';
        try {
            const tCond = this._nibe1155.condensorOutTemp.value;
            const tSupply = this._nibe1155.supplyS1Temp.value;
            const fComp = this._nibe1155.compressorFrequency.value;
            const oldDm = this._nibe1155.degreeMinutes.value;
            if (typeof tCond !== 'number' || typeof tSupply !== 'number' || typeof fComp !== 'number' || typeof oldDm !== 'number') {
                throw new Error(msgHeader + ': updateDmAsync() fails, invalid register values');
            }

            if (typeof tCond === 'number' && tCond > 62.0) {
                debug.info('%s: Maximal Condensator temperature reached (%s°C) -> switch to OFF', msgHeader, tCond);
                await this.switchOffAsync(60, checkState);
                return oldDm;
            }
            if (this._f <= 0) {
                debug.info('%s: fSetpoint=0Hz -> switch to OFF', msgHeader, tCond);
                await this.switchOffAsync(60, checkState);
                return oldDm;
            }

            const fMax = tCond > 55.0 ? this._fmaxTHigh : this._fmax;

            const fTarget = this._f < this._fmin
                ? this._fmin
                : ( this._f > this._fmax ? this._fmax : this._f );

            // debugger;
            let dm = oldDm;
            if (!this._dmWrittenAt || (this._dmWrittenAt > 0 && (Date.now() - this._dmWrittenAt) >= 10000)) {
                const diff = fComp - fTarget;
                if (Math.abs(diff) > 30) {
                    dm = diff > 0 ? oldDm + 30 : oldDm - 30;

                } else if (Math.abs(diff) > 20) {
                    dm = diff > 0 ? oldDm + 20 : oldDm - 20;

                } else if (Math.abs(diff) > 10) {
                    dm = diff > 0 ? oldDm + 10 : oldDm - 10;

                } else if (Math.abs(diff) > 5) {
                    dm = diff > 0 ? oldDm + 5 : oldDm - 5;

                } else if (Math.abs(diff) > 1) {
                    dm = diff > 0 ? oldDm + 1 : oldDm - 1;
                }
            }
            if (dm >= 0) {
                dm = -1;
            } else if (dm < -380) {
                dm = -380;
            }
            if (dm !== oldDm) {
                debug.info('%s: fSetpoint=%dHz, fTarget=%dHz, f=%dHz, tCond=%d°C, current DM=%d -> write new DM %d',
                    msgHeader, this._f, fTarget, fComp, tCond, oldDm, dm);
                await this._nibe1155.writeDegreeMinutes(dm); // 43005
                this._dmWrittenAt = Date.now();
            } else {
                debug.info('%s: fSetpoint=%dHz, fTarget=%dHz, f=%dHz, tCond=%d°C, current DM=%d',
                    msgHeader, this._f, fTarget, fComp, tCond, oldDm);
            }

            return dm;

        } catch (error) {
            debug.warn('%s: updateDmAsync() fails\n%e', msgHeader, error);
            return this._nibe1155.degreeMinutes.value;
        }
    }

    private async enableAddHeaterAsync (checkState: HeatpumpControllerMode,): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] enableAddHeater';
        if (this._addHeaterEnabled === true) { return; }

        try {
            let x = 0;

            await this._nibe1155.writeActivateCutOffFreq2(true);
            await this._nibe1155.writeDegreeMinutes(-800);
            x = await this._nibe1155.getRegisterValue(48659, -1);
            await this._nibe1155.writeDegreeMinutes(-800);
            debug.info('%s: ActivateCutOffFreq2=%s', msgHeader, x);

            await this._nibe1155.writeAddHeaterMaxPower(this._pmax);
            await this._nibe1155.writeDegreeMinutes(-800);
            x = await this._nibe1155.getRegisterValue(47212, -1);
            await this._nibe1155.writeDegreeMinutes(-800);
            debug.info('%s: AddHeaterMaxPower=%s', msgHeader, x);

            this._addHeaterEnabled = true;

        } catch (error) {
            debug.warn(msgHeader + ': enableAddHeaterAsync() fails\n%e', error);
            this._addHeaterEnabled = undefined;
        }
    }

    private async disableAddHeaterAsync (checkState: HeatpumpControllerMode, dm?: number): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] disableAddHeater';
        if (this._addHeaterEnabled === false) { return; }
        try {
            dm = dm !== undefined ? dm  : this._nibe1155.degreeMinutes.value;
            let x = -1;

            await this._nibe1155.writeActivateCutOffFreq2(false);
            await this._nibe1155.writeDegreeMinutes(dm);
            x = await this._nibe1155.getRegisterValue(48659, -1);
            await this._nibe1155.writeDegreeMinutes(dm);
            debug.info('%s: ActivateCutOffFreq2=%s', msgHeader, x);

            await this._nibe1155.writeAddHeaterMaxPower(0);
            await this._nibe1155.writeDegreeMinutes(dm);
            x = await this._nibe1155.getRegisterValue(47212, -1);
            await this._nibe1155.writeDegreeMinutes(dm);
            debug.info('%s: AddHeaterMaxPower=%s', msgHeader, x);

            this._addHeaterEnabled = false;

        } catch (error) {
            debug.warn(msgHeader + ': disableAddHeaterAsync() fails\n%e', error);
            this._addHeaterEnabled = undefined;
        }
    }



    // private async handleStateOff (): Promise<HeatpumpControllerMode> {
    //     debugState.finer('handleStateOff(): recentState = %s', this._recentState);
    //     if (this._desiredState !== 'off') {
    //         debugState.info('stop OFF -> %s', this._desiredState);
    //         return this._desiredState;
    //     }
    //     if (this._recentState !== 'off') {
    //         debugState.info('start OFF');
    //         this._fTarget = undefined;
    //         this._setPointTemp = undefined;
    //         this._fDiffChangeAt = undefined;
    //         await this._nibe1155.writeDegreeMinutes(1);
    //         await this._nibe1155.writeHeatTempMin(20);
    //         await this._nibe1155.writeHeatTempMax(20);
    //         await this._nibe1155.writeBrinePumpMode('auto');
    //         await this._nibe1155.writeSupplyPumpMode('economy');
    //         await this.disableElectricHeater();

    //     }
    //     return HeatpumpControllerMode.off;
    // }

    // private async handleStateError (): Promise<HeatpumpControllerMode> {
    //     debugState.finer('handleStateError(): recentState = %s', this._recentState);
    //     if (this._desiredState !== 'error') {
    //         debugState.info('stop ERROR -> %s', this._desiredState);
    //         return this._desiredState;
    //     }
    //     if (this._recentState !== 'error') {
    //         debugState.info('start ERROR');
    //         try {
    //             const alarm = await this._nibe1155.readAlarm(0);
    //             if (alarm !== 0) {
    //                 debug.warn('Nibe1155 Alarm %s', alarm);
    //             } else {
    //                 debug.info('Nibe1155 shows no alarm');
    //             }
    //         } catch (err) { debug.warn(err); }
    //         this._fTarget = undefined;
    //         this._setPointTemp = undefined;
    //         this._fDiffChangeAt = undefined;
    //         await this._nibe1155.writeDegreeMinutes(1);
    //         await this._nibe1155.writeHeatTempMin(20);
    //         await this._nibe1155.writeHeatTempMax(20);
    //         await this._nibe1155.writeBrinePumpMode('auto');
    //         await this._nibe1155.writeSupplyPumpMode('economy');
    //     }
    //     return HeatpumpControllerMode.error;
    // }

    // private async disableElectricHeater (): Promise<void> {
    //     if (!this._elctricHeaterEnabled) { return; }
    //     debug.info('==== DISABLE ELCTRIC HEATER ====');
    //     await this._nibe1155.writeAllowAdditiveHeating(false);  // 47370
    //     await this._nibe1155.writeAddHeatingStartDm(-2000);     // 47210
    //     await this._nibe1155.writeAddHeatingStep(0);            // 47209
    //     await this._nibe1155.writeAddHeaterMaxPower(0);         // 47212
    //     this._elctricHeaterEnabled = false;
    // }

    // private async initNibe1155RegisterAsync (): Promise<void> {
    //     debug.info('==== INITIALIZATION NIBE1155 ==== START');
    //     let x = 0;

    //     await this._nibe1155.writeAddHeaterMaxPower(0);         // 47212
    //     x = await this._nibe1155.getRegisterValue(47212, -1);
    //     console.log('==> add heater max power (47212)= ', x);

    //     // await this._nibe1155.writeActivateCutOffFreq1(false);
    //     await this._nibe1155.writeCutOffFreq1Start(100);
    //     await this._nibe1155.writeCutOffFreq1Stop(120);
    //     await this._nibe1155.writeActivateCutOffFreq1(true);

    //     await this._nibe1155.writeActivateCutOffFreq2(false);
    //     await this._nibe1155.writeCutOffFreq2Start(70);
    //     await this._nibe1155.writeCutOffFreq2Stop(100); // range: start + 3 -> start + 49
    //     // await this._nibe1155.writeActivateCutOffFreq2(true);

    //     x = await this._nibe1155.getRegisterValue(48660, -1);
    //     console.log('==> cutOffFrequActivated1 (48660)= ', x);

    //     x = await this._nibe1155.getRegisterValue(48662, -1);
    //     console.log('==> cutOffFrequStart1 (48662)= ', x); // 20

    //     x = await this._nibe1155.getRegisterValue(48664, -1);
    //     console.log('==> cutOffFrequStop1 (48664)= ', x); // 22

    //     x = await this._nibe1155.getRegisterValue(48659, -1);
    //     console.log('==> cutOffFrequActivated2 (48659)= ', x);

    //     x = await this._nibe1155.getRegisterValue(48661, -1);
    //     console.log('==> cutOffFrequStart2 (48661)= ', x); // 90

    //     x = await this._nibe1155.getRegisterValue(48663, -1);
    //     console.log('==> cutOffFrequStop2 (48663)= ', x); // 118

    //     debug.info('==== INITIALIZATION NIBE1155 ==== END');
    // }


    // private async enableElectricHeater (): Promise<void> {
    //     if (this._elctricHeaterEnabled) { return; }
    //     debug.info('==== ENABLE ELECTRIC HEATER ==== START');
    //     let x = 0;

    //     // x = await this._nibe1155.getRegisterValue(47137, -1);
    //     // console.log('==> operational Mode (47137) = ', x);

    //     // await this._nibe1155.writeAllowHeating(true); // // 47371
    //     // x = await this._nibe1155.getRegisterValue(47371, -1);
    //     // console.log('==> allow heating (47371)= ', x);

    //     // await this._nibe1155.writeAllowAdditiveHeating(true);  // 47370
    //     // x = await this._nibe1155.getRegisterValue(47370, -1);
    //     // console.log('==> allow additive heating (47370)= ', x);

    //     // await this._nibe1155.writeAddHeatingStartDm(-400);     // 47210

    //     // await this._nibe1155.writeRegisterValue(47210, -500, false); // not working why -> ???
    //     // x = await this._nibe1155.readRegisterValue(47210, false);
    //     // console.log('==> DM start additive heating (47210)= ', x);

    //     // await this._nibe1155.writeAddHeatingStep(0);            // 47209
    //     // x = await this._nibe1155.getRegisterValue(47209, -1);
    //     // console.log('==> allow add heating step (47209)= ', x);

    //     await this._nibe1155.writeAddHeaterMaxPower(0);         // 47212
    //     x = await this._nibe1155.getRegisterValue(47212, -1);
    //     console.log('==> allow add heater max power (47212)= ', x);

    //     // x = await this._nibe1155.getRegisterValue(43005, -1);
    //     // console.log('==> degree minutes (43005)= ', x);

    //     // let dwH = await this._nibe1155.readRegisterValue(40079, false);
    //     // let dwL = await this._nibe1155.readRegisterValue(40080, false);
    //     // console.log('==> current 1 (40079, 40080)= ', dwH, dwL);

    //     // dwH = await this._nibe1155.readRegisterValue(40081, false);
    //     // dwL = await this._nibe1155.readRegisterValue(40082, false);
    //     // console.log('==> current 2 (40081, 40082)= ', dwH, dwL);

    //     // dwH = await this._nibe1155.readRegisterValue(40083, false);
    //     // dwL = await this._nibe1155.readRegisterValue(40084, false);
    //     // console.log('==> current 3 (40083, 40084)= ', dwH, dwL);


    //     // await this._nibe1155.writeCutOffFreq1Start(99);
    //     // await this._nibe1155.writeCutOffFreq1Stop(120);
    //     // await this._nibe1155.writeActivateCutOffFreq1(true);

    //     // await this._nibe1155.writeCutOffFreq2Start(70);
    //     // await this._nibe1155.writeCutOffFreq2Stop(100); // range: start + 3 -> start + 49
    //     // await this._nibe1155.writeActivateCutOffFreq2(false);

    //     // await this._nibe1155.writeCutOffFreq2Stop(92);
    //     // await this._nibe1155.writeActivateCutOffFreq2(true);
    //     // await this._nibe1155.writeCutOffFreq2Start(60);

    //     // debug.info('set cut off 1 -> 50Hz .. 70Hz');

    //     // await this._nibe1155.writeCutOffFreq1Start(60);
    //     // await this._nibe1155.writeCutOffFreq2Start(65);
    //     // await this._nibe1155.writeCutOffFreq1Stop(70);
    //     // await this._nibe1155.writeActivateCutOffFreq1(true);


    //     // x = await this._nibe1155.getRegisterValue(48661, -1);
    //     // console.log('==> cutOffFrequStart2 (48661)= ', x); // 90

    //     // x = await this._nibe1155.getRegisterValue(48663, -1);
    //     // console.log('==> cutOffFrequStop2 (48663)= ', x); // 118

    //     // await this._nibe1155.writeRegMaxCompFrequ(65);
    //     // x = await this._nibe1155.getRegisterValue(47104, -1);
    //     // console.log('==> maxCompFrequ (47104)= ', x); // 90


    //     // x = await this._nibe1155.getRegisterValue(43136, -1);
    //     // console.log('==> Compressor frequency (43136)= ', x);

    //     // x = await this._nibe1155.getRegisterValue(48660, -1);
    //     // console.log('==> cutOffFrequActivated1 (48660)= ', x);

    //     // x = await this._nibe1155.getRegisterValue(48659, -1);
    //     // console.log('==> cutOffFrequActivated2 (48659)= ', x);

    //     // x = await this._nibe1155.getRegisterValue(48662, -1);
    //     // console.log('==> cutOffFrequStart1 (48662)= ', x); // 20

    //     // x = await this._nibe1155.getRegisterValue(48664, -1);
    //     // console.log('==> cutOffFrequStop1 (48664)= ', x); // 22

    //     // x = await this._nibe1155.getRegisterValue(48661, -1);
    //     // console.log('==> cutOffFrequStart2 (48661)= ', x); // 90

    //     // x = await this._nibe1155.getRegisterValue(48663, -1);
    //     // console.log('==> cutOffFrequStop2 (48663)= ', x); // 118

    //     // x = await this._nibe1155.getRegisterValue(47103, -1);
    //     // console.log('==> minimal allowed frequency (47103)= ', x);

    //     // x = await this._nibe1155.getRegisterValue(47104, -1);
    //     // console.log('==> maximal allowed frequency (47104)= ', x);


    //     this._elctricHeaterEnabled = true;
    //     debug.info('==== ENABLE ELECTRIC HEATER ==== DONE');
    // }

    // private async handleStateFrequency (): Promise<HeatpumpControllerMode> {
    //     // debugState.finer('handleStateTest(): recentState = %s', this._recentState);

    //     // console.log('supplyTemp=' + this._nibe1155.supplyTemp.value + ', supplyS1Temp=' + this._nibe1155.supplyS1Temp.value + ', supplyS1ReturnTemp=' + this._nibe1155.supplyS1ReturnTemp.value);

    //     const t = this._nibe1155.supplyTemp.value;
    //     if (this._desiredState !== 'frequency') {
    //         debugState.info('stop ON (Frequency) -> %s', this._desiredState);
    //         return this._desiredState;
    //     }
    //     if (this._recentState !== 'frequency') {
    //         debugState.info('start ON (Frequency)');
    //         if (t >= 60) {
    //             debugState.info('supply temperature %s reached, switch to OFF', t);
    //             return HeatpumpControllerMode.off;
    //         }
    //         await this.disableElectricHeater();
    //         await this._nibe1155.writeHeatTempMin(65);
    //         await this._nibe1155.writeHeatTempMax(65);
    //         if (this._nibe1155.degreeMinutes.value > -60) {
    //             await this._nibe1155.writeDegreeMinutes(-60);
    //             debugState.fine('setting DM=-60, wait for compressor starting ...');
    //         } else {
    //             debugState.fine('DM=%s, checking if compressor is running ...', this._nibe1155.degreeMinutes.value);
    //         }
    //         const now = Date.now();
    //         while ((Date.now() - now) < 90000) {
    //             await this.delay(500);
    //             if (this._nibe1155.compressorFrequency.value > 0) {
    //                 break;
    //             }
    //         }
    //         this._setPointTemp = t + 0.1;
    //         await this._nibe1155.writeHeatTempMin(this._setPointTemp);
    //         await this._nibe1155.writeHeatTempMax(this._setPointTemp);
    //         if (this._nibe1155.compressorFrequency.value > 0) {
    //             debugState.fine('OK: Compressor is running');
    //         } else {
    //             debugState.warn('ERROR: compressor does not start');
    //             return HeatpumpControllerMode.error;
    //         }
    //     }
    //     if (this._nibe1155.condensorOutTemp.value >= 65.0) { 
    //         debug.info('Temperature %s (Condensor out %s°C) reached, switch to OFF', t, this._nibe1155.condensorOutTemp.value);
    //         return HeatpumpControllerMode.off;

    //     } else {
    //         let fTarget;
    //         const tV = this._nibe1155.supplyS1Temp.value;
    //         // const p1 = { x: 53, y: this._fSetpoint };
    //         // const p2 = { x: 56, y: 26 };
    //         // let fTarget: number;
    //         // const tV = this._nibe1155.supplyS1Temp.value;
    //         // if (tV < p1.x) {
    //         //     fTarget = p1.y;
    //         // } else if (t >= p2.x) {
    //         //     fTarget = p2.y;
    //         // } else {
    //         //     const k = (p1.y - p2.y) / (p1.x - p2.x);
    //         //     const d = p1.y - k * p1.x;
    //         //     fTarget = Math.round(k * tV + d);
    //         // }



    //         fTarget = this._nibe1155.condensorOutTemp.value >= 55.0
    //                 ? (this._fSetpoint >= 60 ) ? 60.0 : this._fSetpoint // 89Hz * 0,75 = 66Hz -> 60 Hz
    //                 : this._fSetpoint;

    //         this._fTarget = fTarget;
    //         const diff = this._nibe1155.compressorFrequency.value - fTarget;
    //         if (Math.abs(diff) > 3) {
    //             if (!this._fDiffChangeAt || (this._fDiffChangeAt > 0 && (Date.now() - this._fDiffChangeAt) >= 10000)) {
    //                 const dm = diff > 0 ? Math.min(  -1, this._nibe1155.degreeMinutes.value + 10) :
    //                                       Math.max(-350, this._nibe1155.degreeMinutes.value - 10);
    //                 debug.info('fSetpoint on %s°C = %sHz out of range (f=%sHz), change degreeminutes to %s',
    //                             tV, fTarget, this._nibe1155.compressorFrequency.value, dm);
    //                 await this._nibe1155.writeDegreeMinutes(dm); // 43005
    //                 this._fDiffChangeAt = Date.now();
    //             }
    //         }

    //     }

    //     if ((t + 0.2) > this._setPointTemp || (t - 0.2) < this._setPointTemp) {
    //         this._setPointTemp = t + 0.1;
    //         debug.finer('Adjust setpoint temp to %s',  this._setPointTemp);
    //         await this._nibe1155.writeHeatTempMin(this._setPointTemp);
    //         await this._nibe1155.writeHeatTempMax(this._setPointTemp);
    //     }

    //     return HeatpumpControllerMode.frequency;
    // }

    // private async handleStateTest (): Promise<HeatpumpControllerMode> {
    //     // debugState.finer('handleStateTest(): recentState = %s', this._recentState);

    //     const t = this._nibe1155.supplyTemp.value;
    //     if (this._desiredState !== 'test') {
    //         debugState.info('stop TEST -> %s', this._desiredState);
    //         return this._desiredState;
    //     }
    //     if (this._nibe1155.condensorOutTemp.value > 62.0) {
    //         debug.info('[TEST]: Temperature %s (Condensor out %s°C) reached, switch to OFF', t, this._nibe1155.condensorOutTemp.value);
    //         await this.initNibe1155RegisterAsync();
    //         return HeatpumpControllerMode.off;
    //     }

    //     if (this._recentState !== 'test') {
    //         debugState.info('start TEST');
    //         this._setPointTemp = t + 2;
    //         await this._nibe1155.writeHeatTempMin(this._setPointTemp);
    //         await this._nibe1155.writeHeatTempMax(this._setPointTemp);
    //         await this.enableElectricHeater();
    //     }

    //     if (this._nibe1155.compressorFrequency.value === 0) {
    //         do {
    //             if (this._desiredState !== HeatpumpControllerMode.test) {
    //                 return this._desiredState;
    //             }
    //             debugState.info('[TEST] NOT RUNNING  f=%sHz, DM=%s, waiting...',
    //                 this._nibe1155.compressorFrequency.value, this._nibe1155.degreeMinutes.value);
    //             await this._nibe1155.writeDegreeMinutes(-300);
    //             await this.delay(500);
    //         } while (this._nibe1155.compressorFrequency.value === 0);
    //         debugState.info('[TEST] OK: Compressor is running');
    //     }

    //     await this._nibe1155.writeDegreeMinutes(-800);
    //     if (t > 55) {
    //         await this._nibe1155.writeActivateCutOffFreq2(true);
    //         await this._nibe1155.writeDegreeMinutes(-800);
    //         await this._nibe1155.writeAddHeaterMaxPower(2000);
    //     } else {
    //         await this._nibe1155.writeActivateCutOffFreq2(false);
    //         await this._nibe1155.writeDegreeMinutes(-800);
    //         await this._nibe1155.writeAddHeaterMaxPower(1000);
    //     }
    //     await this._nibe1155.writeDegreeMinutes(-800);

    //     let adj = '-----';
    //     if ((t + 0.2) > this._setPointTemp || (t - 0.2) < this._setPointTemp) {
    //         this._setPointTemp = t + 0.1;
    //         // debug.fine('[TEST] Adjust setpoint temp to %s',  this._setPointTemp);
    //         adj = Math.round(this._setPointTemp * 10) / 10 + '°C';
    //         await this._nibe1155.writeHeatTempMin(this._setPointTemp);
    //         await this._nibe1155.writeDegreeMinutes(-800);
    //         await this._nibe1155.writeHeatTempMax(this._setPointTemp);
    //     }

    //     debug.info('[TEST] %s DM=%s, f=%sHz, P=%sW, T-Cond=%s°C, T-Puffer=%s°C, T-Vor=%s°C, T-Rueck=%s°C',
    //         adj,
    //         this._nibe1155.degreeMinutes.value,
    //         this._nibe1155.compressorFrequency.value,
    //         this._nibe1155.electricHeaterPower.value,
    //         this._nibe1155.condensorOutTemp.value,
    //         this._nibe1155.supplyTemp.value,
    //         this._nibe1155.supplyS1Temp.value,
    //         this._nibe1155.supplyS1ReturnTemp.value
    //     );






    //     // let fTarget;
    //     // const tV = this._nibe1155.supplyS1Temp.value;

    //     // fTarget = this._nibe1155.condensorOutTemp.value >= 55.0
    //     //     ? (this._fSetpoint >= 60 ) ? 60.0 : this._fSetpoint // 89Hz * 0,75 = 66Hz -> 60 Hz
    //     //     : this._fSetpoint;

    //     // this._fTarget = fTarget;
    //     // const diff = this._nibe1155.compressorFrequency.value - fTarget;

    //     // let dm = this._nibe1155.degreeMinutes.value;
    //     // const pAddHeater = this._nibe1155.electricHeaterPower.value;
    //     // const tVorlauf = this._nibe1155.supplyS1Temp.value;

    //     // // dm = diff > 0
    //     // //     ? this._nibe1155.degreeMinutes.value + 10
    //     // //     : this._nibe1155.degreeMinutes.value - 10
    //     // // if (dm > -600) { dm = -600; }
    //     // // if (dm < -800) { dm = -800; }

    //     // // debug.info('[TEST] fSetpoint on %s°C = %sHz out of range (f=%sHz), change degreeminutes to %s',
    //     // //     tV, fTarget, this._nibe1155.compressorFrequency.value, dm);

    //     // await this._nibe1155.writeDegreeMinutes(-800); // 43005
    //     // this._fDiffChangeAt = Date.now();
 
    //     // debug.info('[TEST] DM=%s, f=%sHz, t=%s°C, P=%sW, Vorlauf=%s°C',
    //     //     dm, this._nibe1155.compressorFrequency.value, this._nibe1155.condensorOutTemp.value, pAddHeater, tVorlauf);

    //     // if ((t + 0.2) > this._setPointTemp || (t - 0.2) < this._setPointTemp) {
    //     //     this._setPointTemp = t + 0.1;
    //     //     debug.finer('[TEST] Adjust setpoint temp to %s',  this._setPointTemp);
    //     //     await this._nibe1155.writeHeatTempMin(this._setPointTemp);
    //     //     await this._nibe1155.writeHeatTempMax(this._setPointTemp);
    //     // }

    //     return HeatpumpControllerMode.test;
    // }


}
