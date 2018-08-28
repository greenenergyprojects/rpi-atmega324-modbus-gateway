
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:HeatPump');
const debugState: debugsx.IFullLogger = debugsx.createFullLogger('HeatPump.State');

import { Nibe1155 } from './nibe1155';
import { IHeatpumpMode } from '../client/nibe1155-values';

export type State = 'init' | 'off' | 'error' | 'test' | 'frequency';

export interface IController {
    createdAt: Date;
    state: string;
    running: boolean;
    desiredState?: string;
    inProgressSince?: Date;
    setPointTemp?: number;
    fSetpoint?: number;
}

export class HeatPump {

    public static async createInstance (nibe1155: Nibe1155): Promise<HeatPump> {
        if (this._instance) { throw new Error('instance already created'); }
        const rv = new HeatPump(nibe1155);
        await rv.init();
        this._instance = rv;
        return rv;
    }

    public static get Instance (): HeatPump {
        if (!this._instance) { throw new Error('no instance created yet'); }
        return this._instance;
    }

    private static _instance: HeatPump;

    // ******************************************************************

    private _nibe1155: Nibe1155;
    private _state: State;
    private _desiredState: State;
    private _recentState: State;
    private _inProgressSince: Date;
    private _timer: NodeJS.Timer;

    private _setPointTemp: number;
    private _fDiffChangeAt: number;
    private _fSetpoint: number;
    private _desiredFrequency: number;

    private constructor (nibe1155: Nibe1155) {
        this._nibe1155 = nibe1155;
        this._state = 'init';
        this._desiredFrequency = 40;
    }


    public async start (desiredState: State) {
        if (this._timer) { throw new Error('already started'); }
        this._desiredState = desiredState;
        this._timer = setInterval( () => this.handleStateMachine(), 2000);
        process.nextTick( () => this.handleStateMachine() );
    }

    public async stop () {
        if (this._timer) { throw new Error('not started'); }
        clearInterval(this._timer);
        this._timer = null;
    }

    public get state (): State {
        return this._state;
    }

    public async setDesiredMode (mode: IHeatpumpMode): Promise<IHeatpumpMode> {
        await this.delay(1000);
        if (!(mode.fSetpoint >= 20 && (mode.fSetpoint <= 90))) { throw new Error('illegal fSetpoint'); }
        switch (mode.desiredMode) {
            case 'off': this._desiredState = 'off'; break;
            case 'test': this._desiredState = 'test'; break;
            case 'frequency': {
                this._desiredState = 'frequency';
                this._desiredFrequency = mode.fSetpoint;
                break;
            }
            default: throw new Error('unsupported mode ' + mode.desiredMode);
        }
        const rv: IHeatpumpMode = {
            createdAt: new Date(),
            currentMode: this._state,
            desiredMode: this._desiredState,
            fSetpoint: this._desiredFrequency
        }
        debug.warn(rv);
        return rv;
    }

    public toObject (): IController {
        const rv: any = {
            createdAt: new Date(),
            running: this._timer !== undefined,
            state: this._state,
            inProgressSince: this._inProgressSince,
            setPointTemp: this._setPointTemp,
            fSetpoint: this._fSetpoint,
            desiredFrequency: this._desiredFrequency
        };
        if (this._state !== this._desiredState) {
            rv.desiredState = this._desiredState;
        }
        return rv;
    }

    private async delay (milliSeconds: number) {
        return new Promise ( (res, rej) => {
            setTimeout( () => { res(); }, milliSeconds);
        });
    }

    private async init () {

    }

    private async handleStateMachine () {
        if (this._inProgressSince) { return; }
        try {
            this._inProgressSince = new Date();
            let nextState: State;
            switch (this._state) {
                case 'init':      nextState = await this.handleStateInit(); break;
                case 'off':       nextState = await this.handleStateOff(); break;
                case 'error':     nextState = await this.handleStateError(); break;
                case 'test':      nextState = await this.handleStateTest(); break;
                case 'frequency': nextState = await this.handleStateFrequency(); break;
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

    private async handleStateInit (): Promise<State> {
        debugState.finer('handleStateInit(): recentState = %s', this._recentState);
        return this._desiredState;
    }


    private async handleStateOff (): Promise<State> {
        debugState.finer('handleStateOff(): recentState = %s', this._recentState);
        if (this._desiredState !== 'off') {
            debugState.info('stop OFF -> %s', this._desiredState);
            return this._desiredState;
        }
        if (this._recentState !== 'off') {
            debugState.info('start OFF');
            this._fSetpoint = undefined;
            this._setPointTemp = undefined;
            this._fDiffChangeAt = undefined;
            await this._nibe1155.writeDegreeMinutes(1);
            await this._nibe1155.writeHeatTempMin(20);
            await this._nibe1155.writeHeatTempMax(20);
            await this._nibe1155.writeBrinePumpMode('auto');
            await this._nibe1155.writeSupplyPumpMode('economy');
        }
        return 'off';
    }

    private async handleStateError (): Promise<State> {
        debugState.finer('handleStateError(): recentState = %s', this._recentState);
        if (this._desiredState !== 'error') {
            debugState.info('stop ERROR -> %s', this._desiredState);
            return this._desiredState;
        }
        if (this._recentState !== 'error') {
            debugState.info('start ERROR');
            try {
                const alarm = await this._nibe1155.readAlarm(0);
                if (alarm !== 0) {
                    debug.warn('Nibe1155 Alarm %s', alarm);
                } else {
                    debug.info('Nibe1155 shows no alarm');
                }
            } catch (err) { debug.warn(err); }
            this._fSetpoint = undefined;
            this._setPointTemp = undefined;
            this._fDiffChangeAt = undefined;
            await this._nibe1155.writeDegreeMinutes(1);
            await this._nibe1155.writeHeatTempMin(20);
            await this._nibe1155.writeHeatTempMax(20);
            await this._nibe1155.writeBrinePumpMode('auto');
            await this._nibe1155.writeSupplyPumpMode('economy');
        }
        return 'error';
    }

    private async handleStateFrequency (): Promise<State> {
        // debugState.finer('handleStateTest(): recentState = %s', this._recentState);

        const t = this._nibe1155.supplyTemp.value;
        if (this._desiredState !== 'frequency') {
            debugState.info('stop ON (Frequency) -> %s', this._desiredState);
            return this._desiredState;
        }
        if (this._recentState !== 'frequency') {
            debugState.info('start ON (Frequency)');
            if (t >= 55) {
                debugState.info('supply temperature %s reached, switch to OFF', t);
                return 'off';
            }
            await this._nibe1155.writeHeatTempMin(60);
            await this._nibe1155.writeHeatTempMax(60);
            if (this._nibe1155.degreeMinutes.value > -60) {
                await this._nibe1155.writeDegreeMinutes(-60);
                debugState.fine('setting DM=-60, wait for compressor starting ...');
            } else {
                debugState.fine('DM=%s, checking if compressor is running ...');
            }
            const now = Date.now();
            while ((Date.now() - now) < 90000) {
                await this.delay(500);
                if (this._nibe1155.compressorFrequency.value > 0) {
                    break;
                }
            }
            this._setPointTemp = t + 0.1;
            await this._nibe1155.writeHeatTempMin(this._setPointTemp);
            await this._nibe1155.writeHeatTempMax(this._setPointTemp);
            if (this._nibe1155.compressorFrequency.value > 0) {
                debugState.fine('OK: Compressor is running');
            } else {
                debugState.warn('ERROR: compressor does not start');
                return 'error';
            }
        }
        if (this._nibe1155.condensorOutTemp.value >= 57.0) { // 58.8 -> Auto Off Alarm 163
            debug.info('Temperature %s (Condensor out %s°C) reached, switch to OFF', t, this._nibe1155.condensorOutTemp.value);
            return 'off';

        } else {
            const p1 = { x: 53, y: this._desiredFrequency };
            const p2 = { x: 56, y: 26 };
            let fSetpoint: number;
            const tV = this._nibe1155.supplyS1Temp.value;
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
            const diff = this._nibe1155.compressorFrequency.value - fSetpoint;
            if (Math.abs(diff) > 3) {
                if (!this._fDiffChangeAt || (this._fDiffChangeAt > 0 && (Date.now() - this._fDiffChangeAt) >= 10000)) {
                    const dm = diff > 0 ? Math.min(  -1, this._nibe1155.degreeMinutes.value + 10) :
                                          Math.max(-350, this._nibe1155.degreeMinutes.value - 10);
                    debug.info('fSetpoint on %s°C = %sHz out of range (f=%sHz), change degreeminutes to %s',
                                tV, fSetpoint, this._nibe1155.compressorFrequency.value, dm);
                    await this._nibe1155.writeDegreeMinutes(dm);
                    this._fDiffChangeAt = Date.now();
                }
            }

        }

        if ((t + 0.2) > this._setPointTemp || (t - 0.2) < this._setPointTemp) {
            this._setPointTemp = t + 0.1;
            debug.info('Adjust setpoint temp to %s',  this._setPointTemp);
            await this._nibe1155.writeHeatTempMin(this._setPointTemp);
            await this._nibe1155.writeHeatTempMax(this._setPointTemp);
        }

        return 'frequency';
    }


    private async handleStateTest (): Promise<State> {
        // debugState.finer('handleStateTest(): recentState = %s', this._recentState);

        const t = this._nibe1155.supplyTemp.value;
        if (this._desiredState !== 'test') {
            debugState.info('stop TEST -> %s', this._desiredState);
            return this._desiredState;
        }
        if (this._recentState !== 'test') {
            debugState.info('start TEST');
            this._setPointTemp = t + 2;
            await this._nibe1155.writeHeatTempMin(this._setPointTemp);
            await this._nibe1155.writeHeatTempMax(this._setPointTemp);
            if (this._nibe1155.degreeMinutes.value > -60) {
                await this._nibe1155.writeDegreeMinutes(-60);
                debugState.fine('setting DM=-60, wait for compressor starting ...');
            } else {
                debugState.fine('DM=%s, checking if compressor is running ...');
            }
            const now = Date.now();
            while ((Date.now() - now) < 60000) {
                await this.delay(500);
                if (this._nibe1155.compressorFrequency.value > 0) {
                    break;
                }
            }
            if (this._nibe1155.compressorFrequency.value > 0) {
                debugState.fine('OK: Compressor is running');
            } else {
                debugState.warn('ERROR: compressor does not start');
                return 'error';
            }
        }

        if (this._nibe1155.condensorOutTemp.value >= 58.5) { // 58.8 -> Auto Off Alarm 163
            debug.info('Temperature %s (Condensor out %s°C) reached, switch to OFF', t, this._nibe1155.condensorOutTemp.value);
            return 'off';

        } else {
            this._fSetpoint = undefined;
            const min = -100;
            const max = -100;
            if (this._nibe1155.degreeMinutes.value < min) {
                debug.info('Adjust degree minutes to %s',  min);
                await this._nibe1155.writeDegreeMinutes(min);
            }
            if (this._nibe1155.degreeMinutes.value > max) {
                const x = Math.max(this._nibe1155.degreeMinutes.value - 10, max);
                debug.info('Adjust degree minutes to %s', x);
                await this._nibe1155.writeDegreeMinutes(x);
            }
        }


        if ((t + 1.0) > this._setPointTemp || (t + 0.5) < this._setPointTemp) {
            this._setPointTemp = t + 2;
            debug.info('Adjust setpoint temp to %s',  this._setPointTemp);
            await this._nibe1155.writeHeatTempMin(this._setPointTemp);
            await this._nibe1155.writeHeatTempMax(this._setPointTemp);
        }

        return 'test';


    }


}
