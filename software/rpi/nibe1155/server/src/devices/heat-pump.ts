
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:HeatPump');
const debugState: debugsx.IFullLogger = debugsx.createFullLogger('HeatPump.State');

import { Nibe1155 } from './nibe1155';
import { Nibe1155Controller, INibe1155Controller } from '../data/common/nibe1155/nibe1155-controller';
import { HeatPumpConfig, HeatpumpControllerMode, IHeatPumpConfig, IHeatPumpControllerConfig } from '../data/common/nibe1155/heat-pump-config';
import * as fs from 'fs';
import { sprintf } from 'sprintf-js';
import { setFlagsFromString } from 'v8';


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

    private config: HeatPumpConfig;
    private nibe1155: Nibe1155;
    private controller: IHeatPumpControllerConfig;
    private state: HeatpumpControllerMode;
    // private _desiredState: HeatpumpControllerMode;
    private recentState: HeatpumpControllerMode;
    private inProgressSince: Date;
    private timer: NodeJS.Timer | undefined;

    private _dataLogAt: number | undefined;
    private _dm: { writtenAt: number; refreshAt?: number; value: number } | undefined;
    private _addHeaterEnabled: boolean | undefined;
    private _fmin = 20;
    private _fmax = 100;
    private _fmaxTHigh = 70;
    private _tHigh = 55.0;
    private _cut1 = { max: 118, min: 71 };
    private _cut2 = { max: 71, min: 22 };

    // private _f = 0;       // frequency setpoint for frequency mode
    // private _tmin = 42;   // tmin for temperature mode (-> on)
    // private _tmax = 45;   // tmax for temperature mode (-> off)
    // private _pmax = 0;    // maximum electrical heater power

    private _regTempMin: number | undefined;
    private _regTempMax: number | undefined;


    private constructor (nibe1155: Nibe1155, config?: IHeatPumpConfig) {
        this.config = new HeatPumpConfig(config || { disabled: true });
        this.controller = { mode: HeatpumpControllerMode.off };
        this.nibe1155 = nibe1155;
        this.state = this.config.disabled
            ? HeatpumpControllerMode.disabled
            : HeatpumpControllerMode.init;
    }


    public async start () {
        if (this.config.disabled) {
            debug.warn('start() fails, heat-pump disabled');
            return;
        }
        if (this.timer) {
            throw new Error('already started');
        }
        this.controller = this.config.start.length > 0
            ? this.config.start[0]
            : { mode: HeatpumpControllerMode.off };

        this.timer = setInterval( () => this.handleStateMachineAsync(), 2000);
        process.nextTick( () => this.handleStateMachineAsync() );
    }

    public async stop () {
        if (this.timer) { throw new Error('not started'); }
        clearInterval(this.timer);
        this.timer = undefined;
        this.state = HeatpumpControllerMode.disabled;
    }

    public getState (): HeatpumpControllerMode {
        return this.state;
    }

    public async setDesiredMode (config: IHeatPumpControllerConfig): Promise<INibe1155Controller> {
        try {
            const x = HeatPumpConfig.parseHeatPumpControllerConfig(config);
            this.controller = x;
            const rv = this.toObject();
            debug.info('setting desired mode %o -> %o', config, rv);
            return rv;

        } catch (error) {
            debug.warn('setDesiredMode() fails\nconfig=%o\n%e', config, error);
        }
    }

    public toObject (): INibe1155Controller {
        const rv: INibe1155Controller = {
            createdAt: new Date(),
            config: this.controller,
            state: this.state,
            fCompressor: this.nibe1155.compressorFrequency.value,
            pAddHeater: this.nibe1155.electricHeaterPower.value,
            tPuffer: this.nibe1155.supplyTemp.value,
            tSupply: this.nibe1155.supplyS1Temp.value,
            tSupplyReturn: this.nibe1155.supplyS1ReturnTemp.value,
            tCondOut: this.nibe1155.condensorOutTemp.value,
            speedBrinePump: this.nibe1155.brinePumpSpeed.value,
            speedSupplyPump: this.nibe1155.supplyPumpSpeed.value
        };
        return rv;
    }

    // ---------------------------------------------------------------------

    private async delayAsync (milliSeconds: number) {
        return new Promise<void> ( res => {
            setTimeout( () => { res(); }, milliSeconds);
        });
    }

    private async handleStateMachineAsync (): Promise<void> {
        if (this.inProgressSince) { return; }
        try {
            this.inProgressSince = new Date();
            let nextState: HeatpumpControllerMode;
            switch (this.state) {
                case 'init':        nextState = await this.handleStateInitAsync(); break;
                case 'off':         nextState = await this.handleStateOffAsync(); break;
                case 'frequency':   nextState = await this.handleStateFrequencyAsync(); break;
                case 'test':        nextState = await this.handleStateTestAsync(); break;
                case 'temperature': nextState = await this.handleStateTemperatureAsync(); break;
                case 'error':       nextState = await this.handleStateErrorAsync(); break;
                default:
                    debugState.warn('state %s not supported', this.state); break;
            }
            if (nextState && nextState !== this.state) {
                this.recentState = this.state;
                this.state = nextState;
            } else {
                this.recentState = this.state;
            }

        } catch (error) {
            debug.warn ('handleStateMachineAsync() fails\n%e', error);

        } finally {
            this.inProgressSince = undefined;
        }
    }

    private async handleStateInitAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[INIT]';
        if (this.recentState !== HeatpumpControllerMode.init) {
            debugState.info('[INIT]: start handleStateInit()');
        }
        try {
            let dm = await this.nibe1155.getRegisterValue(43005, -1);
            let fSet = 0;
            switch (this.controller.mode) {
                case 'frequency': fSet = this.controller.fSetpoint; break;
                case 'temperature': fSet = this.controller.fSetpoint; break;
                default: {
                    const x = (this.controller as unknown as { fSetpoint: unknown }).fSetpoint;
                    if (x !== undefined && typeof x === 'number' && x >= 0 && x <= 120) {
                        debug.warn('[INIT]: set unintended fSetpoint to %sHz', x);
                        fSet = x;
                    }
                }
            }

            debug.info('%s: fSet=%sHz, current DM (47212) = ', msgHeader, fSet, dm);
            const startdm = {
                rising: { 40: -200, 50: -246, 63: -257, 70: -257, 80: -307, 90: -292 }, // 3.3°C, Puffer 41°, VL/RL: 45°, 40°
                falling: { 40: -202, 60: -218,  } // 60: -181  // 80: -260
            };
            if (fSet >= 80) {
                dm = -300;
            } else if (fSet >= 60) {
                dm = -250;
            } else if (fSet >= 40) {
                dm = -200;
            } else if (fSet >= 20) {
                dm = -150;
            } else {
                dm = 100;
            }

            if (dm < 0) {
                await this.nibe1155.writeDegreeMinutes(dm);
                this._dm = {
                    writtenAt: Date.now(),
                    value: dm
                };
            }

            let desiredPMax = 0;
            switch (this.controller.mode) {
                case HeatpumpControllerMode.frequency: desiredPMax = this.controller.pAddHeater; break;
            }
            let pmax = await this.nibe1155.getRegisterValue(47212, -1);
            while (pmax !== desiredPMax) {
                debug.info('%s: writeAddHeaterMaxPower(' + desiredPMax + ')', msgHeader);
                await this.nibe1155.writeAddHeaterMaxPower(desiredPMax); // 47212
                if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
                pmax = await this.nibe1155.getRegisterValue(47212, -1);
            }
            debug.info('[INIT]: add heater max power (47212) = ', pmax);


            const fmax = this.nibe1155.condensorOutTemp.value <= this._tHigh ? this._fmax : this._fmaxTHigh;
            const fTarget = fSet > fmax ? fmax : fSet;

            const rv = await this.updateCutOffFrequAsync(HeatpumpControllerMode.init, fTarget, dm);
            debug.info('%s: fcut1 -> activated=%s, %s ... %sHz ', msgHeader, rv.cut1.isActive, rv.cut1.stop, rv.cut1.start);
            debug.info('%s: fcut2 -> activated=%s, %s ... %sHz ', msgHeader, rv.cut2.isActive, rv.cut2.stop, rv.cut2.start);

            debug.info('[INIT]: OK');
            return this.controller.mode;

        } catch (error) {
            debug.warn('%s: handleStateInitAsync() fails -> switch to OFF\n%e', msgHeader, error);
            return HeatpumpControllerMode.off;
        }
    }

    private async handleStateOffAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[OFF]';
        try {
            if (this.recentState !== HeatpumpControllerMode.off) {
                debug.info('%s: start handleStateOff()', msgHeader);
            }
            await this.switchOffAsync(60000, HeatpumpControllerMode.off);
            return this.controller.mode;

        } catch (error) {
            debug.warn('%s: handleStateOff() fails\n%e', msgHeader, error);
            return HeatpumpControllerMode.off;
        }
    }

    private async handleStateFrequencyAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[FREQUENCY]';
        try {
            if (this.recentState !== HeatpumpControllerMode.frequency) {
                debug.info('%s: start handleStateFrequency()', msgHeader);
            }
            await this.updateTempMinMaxAsync(HeatpumpControllerMode.frequency);

            let desiredPMax = 0;
            switch (this.controller.mode) {
                case HeatpumpControllerMode.frequency: desiredPMax = this.controller.pAddHeater; break;
            }
            const pmax = await this.nibe1155.getRegisterValue(47212, -1);
            if (desiredPMax !== pmax) {
                debug.info('%s: writeAddHeaterMaxPower(%s)', msgHeader, desiredPMax);
                await this.nibe1155.writeAddHeaterMaxPower(desiredPMax);
            }

            let fSet = 0;
            switch (this.controller.mode) {
                case 'frequency': fSet = this.controller.fSetpoint; break;
            }
            const fmax = this.nibe1155.condensorOutTemp.value <= this._tHigh ? this._fmax : this._fmaxTHigh;
            const fTarget = fSet > fmax ? fmax : fSet;
            await this.updateCutOffFrequAsync(HeatpumpControllerMode.frequency, fTarget);

            if (this.nibe1155.compressorFrequency.value <= 0) {
                await this.switchOnAsync(0, HeatpumpControllerMode.frequency);
            } else {
                this.updateDmAsync(HeatpumpControllerMode.frequency, fTarget);
            }
            return this.controller.mode;

        } catch (error) {
            debug.warn('%s: handleStateFrequencyAsync() fails\n%e', msgHeader, error);
            return this.controller.mode;
        }
    }

    private async handleStateTemperatureAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[TEMPERATURE]';
        try {
            if (this.recentState !== HeatpumpControllerMode.temperature) {
                debug.info('[TEMPERATURE]: start handleStateTemperature()');
            }
            await this.updateTempMinMaxAsync(HeatpumpControllerMode.temperature);

            let tMin = 42;
            let tMax = 46;
            switch (this.controller.mode) {
                case 'temperature': {
                    tMin = this.controller.tMin;
                    tMax = this.controller.tMax;
                    break;
                }
            }

            if (this.nibe1155.compressorFrequency.value > 0) {
                debug.info('%s: check switch off...', msgHeader);
                if (this.nibe1155.supplyTemp.value > tMax) {
                    try {
                        await this.switchOffAsync(60, HeatpumpControllerMode.temperature);
                    } catch (error) {
                        debug.warn('%s: switch off fails\n%e', msgHeader, error);
                    }
                } else {
                    await this.updateDmAsync(HeatpumpControllerMode.temperature);
                }

            } else {
                debug.info('%s: check switch on... %d < %d', msgHeader, this.nibe1155.supplyTemp.value, tMin);
                if (this.nibe1155.supplyTemp.value < tMin) {
                    try {
                        await this.switchOnAsync(60, HeatpumpControllerMode.temperature);
                    } catch (error) {
                        debug.warn('%s: switch on fails\n%e', msgHeader, error);
                    }
                }
            }

            return this.controller.mode;

        } catch (error) {
            debug.warn('%s: handleStateTemperatureAsync() fails\n%e', msgHeader, error);
            return this.controller.mode;
        }
    }

    private async handleStateTestAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[TEST]';
        try {
            if (this.recentState !== HeatpumpControllerMode.test) {
                debug.info('%s: start handleStateTest()', msgHeader);
            }
            return this.controller.mode;

        } catch (error) {
            debug.warn('%s: handleStateTestAsync() fails\n%e', msgHeader, error);
            return this.controller.mode;
        }
    }

    private async handleStateErrorAsync (): Promise<HeatpumpControllerMode> {
        const msgHeader = '[ERROR]';
        try {

            if (this.recentState !== HeatpumpControllerMode.error) {
                debug.info('%s: start handleStateError()', msgHeader);
            }
            return HeatpumpControllerMode.off;

        } catch (error) {
            debug.warn('%s: handleStateErrorAsync() fails\n%e', msgHeader, error);
            return this.controller.mode;
        }
    }

    // ------------------------------------------------------------------------

    private async updateTempMinMaxAsync (checkState: HeatpumpControllerMode): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] updateTempMinMax';
        const t = this.nibe1155.supplyTemp.value;
        if (typeof t === 'number' && t > 0 && t < 80) {
            const tmin = Math.round((t - 0.2) * 10) / 10;
            const tmax = Math.round((t + 0.2) * 10) / 10;
            if (this._regTempMin === undefined || this._regTempMin < tmin || this._regTempMin > tmax) {
                await this.nibe1155.writeHeatTempMin(tmin);
                debug.info('%s: writeHeatTempMin(' + tmin + ')', msgHeader);
                this._regTempMin = tmin;
            }
            if (this._regTempMax === undefined || this._regTempMax < tmin || this._regTempMax > tmax) {
                await this.nibe1155.writeHeatTempMax(tmax);
                this._regTempMax = tmax;
                debug.info('%s: writeHeatTempMax(' + tmax + ')', msgHeader);
            }
        } else {
            debug.warn('%s: updateTempMinMaxAsync fails, t=%s', msgHeader, t);
        }
    }

    private async updateCutOffFrequAsync (checkState: HeatpumpControllerMode, fTarget: number, dm?: number): Promise<ICutoffFrequencies> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] - updateCutOffFrequAsync';
        if (typeof dm !== 'number') {
            dm = this._dm && typeof this._dm.value === 'number'
                ? this._dm.value
                : this.nibe1155.degreeMinutes.value;
        }

        const cf1 = { isActive: -1, start: -1, stop:  -1, activate: 1, min: this._cut1.min, max: this._cut1.max };
        const cf2 = { isActive: -1, start: -1, stop:  -1, activate: 1, min: this._cut2.min, max: this._cut2.max };

        fTarget = fTarget + 5;

        if (fTarget < cf1.min) {
            cf1.activate = 1;
            cf2.activate = 1;
            if (fTarget > cf2.min) {
                cf2.min = fTarget + 1;
            }
            if ( (cf2.max - cf2.min) < 5) {
                cf2.max = cf2.min + 5;
            }
        } else {
            cf1.activate = 1;
            cf2.activate = 0;
            if (fTarget > cf1.min) {
                cf1.min = fTarget + 1;
            }
            if ( (cf1.max - cf1.min) < 5) {
                cf1.min = cf2.max - 5;
            }
        }

        do {
            cf1.start = await this.nibe1155.getRegisterValue(48662, -1);
            if (cf1.start !== cf1.min) {
                debug.info('%s: writeCutOffFreq1Start(%s)', msgHeader, cf1.min);
                await this.nibe1155.writeCutOffFreq1Start(cf1.min);
            }
            cf1.stop = await this.nibe1155.getRegisterValue(48664, -1);
            if (cf1.stop !== cf1.max) {
                debug.info('%s: writeCutOffFreq1Stop(%s)', msgHeader, cf1.stop);
                await this.nibe1155.writeCutOffFreq1Stop(cf1.stop);
            }
            if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
            if (checkState !== HeatpumpControllerMode.init && this.controller.mode !== checkState) { throw new Error('state aborted'); }
        } while (cf1.start !== cf1.min || cf1.stop !== cf1.max);

        do {
            cf1.isActive = await this.nibe1155.getRegisterValue(48660, -1);
            if (cf1.isActive !== cf1.activate) {
                debug.info('%s: writeActivateCutOffFreq1(%s)', msgHeader, cf1.activate);
                await this.nibe1155.writeActivateCutOffFreq1(cf1.activate ? true : false);
            }
            if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
            if (checkState !== HeatpumpControllerMode.init && this.controller.mode !== checkState) { throw new Error('state aborted'); }
        } while (cf1.activate !== cf1.isActive);

        if (cf2.activate === 0) {
            // switch off fcut2 before changing start/stop to default values  
            do {
                cf2.isActive = await this.nibe1155.getRegisterValue(48659, -1);
                if (cf2.isActive !== cf2.activate) {
                    debug.info('%s: writeActivateCutOffFreq2(%s)', msgHeader, cf2.activate);
                    await this.nibe1155.writeActivateCutOffFreq2(cf2.activate ? true : false);
                }
                if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
                if (checkState !== HeatpumpControllerMode.init && this.controller.mode !== checkState) { throw new Error('state aborted'); }
            } while (cf2.activate !== cf2.isActive);
        }

        do {
            cf2.start = await this.nibe1155.getRegisterValue(48661, -1);
            if (cf2.start !== cf2.min) {
                debug.info('%s: writeCutOffFreq2Start(%s)', msgHeader, cf2.min);
                await this.nibe1155.writeCutOffFreq2Start(cf2.min);
            }
            cf2.stop = await this.nibe1155.getRegisterValue(48663, -1);
            if (cf2.stop !== cf2.max) {
                debug.info('%s: writeCutOffFreq2Stop(%s)', msgHeader, cf2.max);
                await this.nibe1155.writeCutOffFreq2Stop(cf2.max);
            }
            if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
            if (checkState !== HeatpumpControllerMode.init && this.controller.mode !== checkState) { throw new Error('state aborted'); }
        } while (cf2.start !== cf2.min || cf2.stop !== cf2.max);

        if (cf2.activate === 1) {
            do {
                cf2.isActive = await this.nibe1155.getRegisterValue(48659, -1);
                if (cf2.isActive !== cf2.activate) {
                    debug.info('%s: writeActivateCutOffFreq2(%s)', msgHeader, cf2.activate);
                    await this.nibe1155.writeActivateCutOffFreq2(cf2.activate ? true : false);
                }
                if (dm < 0) { await this.nibe1155.writeDegreeMinutes(dm); }
                if (checkState !== HeatpumpControllerMode.init && this.controller.mode !== checkState) { throw new Error('state aborted'); }
            } while (cf2.activate !== cf2.isActive);
        }

        return {
            cut1: cf1,
            cut2: cf2
        };
    }

    private async switchOffAsync (timeoutSeconds: number, checkState: HeatpumpControllerMode): Promise<void> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] switchOff';
        try {
            let f = this.nibe1155.compressorFrequency.value;
            let brineSpeed = this.nibe1155.brinePumpSpeed.value;
            let supplySpeed = this.nibe1155.supplyPumpSpeed.value;
            let dm = this.nibe1155.degreeMinutes.value;

            if (f > 0 || dm <= 0 ) {
                debug.info('%s: switchOffAsync() starts with timeoutSeconds=%s', msgHeader, timeoutSeconds);
                debug.info('%s: writeAddHeaterMaxPower(0)', msgHeader);
                await this.nibe1155.writeAddHeaterMaxPower(0);
                debug.info('%s: writeDegreeMinutes(1)', msgHeader);
                await this.nibe1155.writeDegreeMinutes(1);
                this._dm = {
                    writtenAt: Date.now(),
                    value: 1
                };
                debug.info('%s: writeHeatTempMin(20)', msgHeader);
                await this.nibe1155.writeHeatTempMin(20);
                debug.info('%s: writeHeatTempMax(20)', msgHeader);
                await this.nibe1155.writeHeatTempMax(20);
                debug.info('%s: writeBrinePumpMode(auto)', msgHeader);
                await this.nibe1155.writeBrinePumpMode('auto');
                debug.info('%s: writeSupplyPumpMode(economy)', msgHeader);
                await this.nibe1155.writeSupplyPumpMode('economy');

            } else if (brineSpeed > 0) {
                debug.info('%s: switchOffAsync() starts with timeoutSeconds=%s', msgHeader, timeoutSeconds);
                debug.info('%s: writeBrinePumpMode(auto)', msgHeader);
                await this.nibe1155.writeBrinePumpMode('auto');

            } else if (supplySpeed > 0) {
                debug.info('%s: switchOffAsync() starts with timeoutSeconds=%s', msgHeader, timeoutSeconds);
                debug.info('%s: writeSupplyPumpMode(economy)', msgHeader);
                await this.nibe1155.writeSupplyPumpMode('economy');

            } else if (this.recentState !== HeatpumpControllerMode.off) {
                debug.info('%s: heat pump already off, no register change needed', msgHeader);
            }

            if (timeoutSeconds > 0) {
                const expired = Date.now() + timeoutSeconds * 1000;
                let i = 0;
                while (Date.now() < expired) {
                    f = this.nibe1155.compressorFrequency.value;
                    brineSpeed = this.nibe1155.brinePumpSpeed.value;
                    supplySpeed = this.nibe1155.supplyPumpSpeed.value;
                    if (f === 0 && brineSpeed === 0 && supplySpeed === 0) {
                        if (i > 0) {
                            debug.info('%s: heat pump is off', msgHeader);
                        }
                        return;
                    }
                    if (this.controller.mode !== checkState) {
                        throw new Error(msgHeader + ': switch on fails caused by state abort');
                    }
                    debug.info('%s: f=%sHz, speed-brine=%s%%, speed-supply=%s%% -> waiting for heat pump is off...',
                        msgHeader, f, brineSpeed, supplySpeed);
                    i++;
                    await this.delayAsync(1000);
                }
                throw new Error(msgHeader + ': switch off expired');
            }

        } catch (error) {
            debug.warn('%s: switchOffAsync() fails\n%e', msgHeader, error);
        }
    }

    private async switchOnAsync (timeoutSeconds: number, checkState: HeatpumpControllerMode): Promise<boolean> {
        // debugger;
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] switchOn';
        try {
            if (this.nibe1155.compressorFrequency.value <= 0 || this.nibe1155.degreeMinutes.value >= 0) {
                const expired = timeoutSeconds > 0 ? Date.now() + timeoutSeconds * 1000 : Date.now();
                do {
                    if (checkState && checkState !== this.controller.mode) {
                        throw new Error(msgHeader + ': switch on fails caused by state abort');
                    }
                    await this.updateTempMinMaxAsync(checkState);
                    debug.info('%s: DM=-100...', msgHeader);
                    await this.nibe1155.writeDegreeMinutes(-100);
                    this._dm = {
                        writtenAt: Date.now(),
                        value: -100
                    };
                    await this.delayAsync(1000);
                    const f = this.nibe1155.compressorFrequency.value;
                    const brineSpeed = this.nibe1155.brinePumpSpeed.value;
                    const supplySpeed = this.nibe1155.supplyPumpSpeed.value;

                    if (f > 0 && brineSpeed > 0 && supplySpeed > 0) {
                        debug.info('%s: RUNNING (f=%dHz, brine=%d%%, supply=%d%%)', msgHeader, f, brineSpeed, supplySpeed);
                        return true;
                    } else if (timeoutSeconds > 0) {
                        debug.info('%s: WAITING (f=%dHz, brine=%d%%, supply=%d%%)', msgHeader, f, brineSpeed, supplySpeed);
                    } else {
                        debug.info('%s: NOT RUNNING (f=%dHz, brine=%d%%, supply=%d%%)', msgHeader, f, brineSpeed, supplySpeed);
                    }

                } while (Date.now() < expired);

                if (timeoutSeconds > 0) {
                    throw new Error(msgHeader + ': timeout expired');
                }

                return false;
            }

        } catch (error) {
            debug.warn('%s: switchOnAsync() fails\n%e', msgHeader, error);
        }
    }

    private async updateDmAsync (checkState: HeatpumpControllerMode, fTarget?: number): Promise<number> {
        const msgHeader = '[' + checkState.toLocaleUpperCase() + '] updateDm';
        try {
            const pAdd = this.nibe1155.electricHeaterPower.value;
            const tCond = this.nibe1155.condensorOutTemp.value;
            const tPuffer = this.nibe1155.supplyTemp.value;
            const tSupplyS1 = this.nibe1155.supplyS1Temp.value;
            const tSupplyS1Return = this.nibe1155.supplyS1ReturnTemp.value;
            const fComp = this.nibe1155.compressorFrequency.value;
            const oldDm = this.nibe1155.degreeMinutes.value;
            if (typeof tCond !== 'number' || typeof tSupplyS1 !== 'number' || typeof fComp !== 'number' || typeof oldDm !== 'number') {
                throw new Error(msgHeader + ': updateDmAsync() fails, invalid register values');
            }

            if (typeof tCond === 'number' && tCond > 62.0) {
                debug.info('%s: Maximal Condensator temperature reached (%s°C) -> switch to OFF', msgHeader, tCond);
                await this.switchOffAsync(60, checkState);
                return oldDm;
            }
            let fSet = 0;
            switch (this.controller.mode) {
                case 'frequency': case 'temperature': {
                    fSet = this.controller.fSetpoint;
                    break;
                }
                default: {
                    const x = (this.controller as unknown as { fSetpoint: unknown}).fSetpoint;
                    if (x !== undefined && typeof x === 'number' && x >= 0 && x <= 120) {
                        fSet = x;
                        debug.warn('%s: fSet = %sHz', msgHeader, fSet);
                    }
                }
            }

            if (fSet <= 0) {
                debug.info('%s: fSetpoint=0Hz -> switch to OFF', msgHeader, tCond);
                await this.switchOffAsync(60, checkState);
                return oldDm;
            }

            const fMax = tCond > 55.0 ? this._fmaxTHigh : this._fmax;
            if (fTarget === undefined) {
                fTarget = fSet;
            }
            fTarget = fTarget > fMax
                ? fMax
                : ( fTarget < this._fmin ? this._fmin : fTarget);

            // debugger;
            let dm = this._dm ? this._dm.value : oldDm;
            if (!this._dm || !this._dm.refreshAt || (this._dm.refreshAt > 0 && (Date.now() - this._dm.refreshAt) >= 10000)) {
                if (this._dm) {
                    this._dm.refreshAt = Date.now();
                }

                const diff = fComp - fTarget;

                // if (diff > 30) {
                //     dm = dm + 30;
                // } else if (diff > 20) {
                //     dm = dm + 20;
                // } else if (diff > 10) {
                //     dm = dm + 5;
                // } else if (diff > 5) {
                //     dm = dm + 3;
                // } else if (diff > 0) {
                //     dm = dm + 2;
                // } else if (diff > -1) {

                //     dm = dm;

                // } else if (diff >= -5) {
                //     dm = dm - 2;
                // } else if (diff >= -10) {
                //     dm = dm - 3;
                // } else if (diff >= -20) {
                //     dm = dm - 5;
                // } else if (diff >= -30) {
                //     dm = dm - 20;
                // } else {
                //     dm = dm - 30;
                // }

                if (diff > 5) {
                    dm = dm + 2;
                } else if (diff > 0) {
                    dm = dm + 1;
                } else if (diff > -0.5) {
                    dm = dm;
                } else if (diff > -5) {
                    dm = dm - 2;
                } else {
                    dm = dm - 1;
                }
            }

            let pMax = 0;
            switch (this.controller.mode) {
                case 'frequency': pMax = this.controller.pAddHeater; break;
                default: {
                    const x = (this.controller as unknown as { pAddHeater: unknown}).pAddHeater;
                    if (x !== undefined && typeof x === 'number' && x >= 0 && x <= 6500) {
                        pMax = x;
                        debug.warn('%s: pMax = %sW', msgHeader, pMax);
                    }
                }
            }

            if (fSet < this._fmin + 3) {
                dm = pMax > 0 ? -450 : -50;
            } else if (pMax > 0 && dm >= -450) {
                dm = -450;
            } else if (dm >= 0) {
                dm = -10;
            }
            if (dm < -1200) {
                dm = -1200;
            }
            if (fSet >= 0) {
                try {
                    let s = '';
                    if (this._dataLogAt === undefined) {
                        this._dataLogAt = Date.now();
                        s += 'Epoch-Time\tdt\tfSet\tfTarget\tfComp\tpMax\tpAdd\ttCond\ttVL\ttRL\ttPuf\toldDm\tdm\n';
                    }
                    const now = Date.now();
                    const dt = Math.round((now - this._dataLogAt) / 100) / 10;
                    s += sprintf('%d\t%.1f\t%.1f\t%.1f\t%.1f\t%d\t%d\t%.1f\t%.1f\t%.1f\t%.1f\t%d\t%d\n',
                        now, dt, fSet, fTarget, fComp, pMax, pAdd, tCond, tSupplyS1, tSupplyS1Return, tPuffer, oldDm, dm);
                    s = s.replace(/\./g, ',');
                    fs.appendFile('/var/log/nibe1155/data.log', s, (error) => {
                        if (error) {
                            debug.warn('%s: data log fs.appendFile() fails\n%e', msgHeader, error);
                        }
                        this._dataLogAt = now;
                    });
                } catch (error) {
                    debug.warn('%s: write to data log fails\n%e', msgHeader, error);
                }
            }

            if (dm !== oldDm) {
                debug.info('%s: fSet=%dHz, Padd=%sW --> fTarget=%dHz --> f=%dHz, Padd=%sW, tCond=%d°C, current DM=%d -> write new DM %d',
                    msgHeader, fSet, pMax, fTarget, fComp, pAdd, tCond, oldDm, dm);
                await this.nibe1155.writeDegreeMinutes(dm); // 43005
                const refreshAt = this._dm.refreshAt;
                this._dm = {
                    value: dm,
                    writtenAt: Date.now(),
                    refreshAt
                };
            } else {
                debug.info('%s: fSet=%dHz, Padd=%sW --> fTarget=%dHz --> f=%dHz, Padd=%sW, tCond=%d°C, current DM=%d',
                    msgHeader, fSet, pAdd, fTarget, fComp, pAdd, tCond, oldDm);
            }

            return dm;

        } catch (error) {
            debug.warn('%s: updateDmAsync() fails\n%e', msgHeader, error);
            return this.nibe1155.degreeMinutes.value;
        }
    }

}

interface ICutoffFrequencies {
    cut1: {
        isActive: 0 | 1 | number;
        start: number;
        stop: number;
    };
    cut2: {
        isActive: 0 | 1 | number;
        start: number;
        stop: number;
    };
}