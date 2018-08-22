
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:HeatPump');
const debugState: debugsx.IDefaultLogger = debugsx.createDefaultLogger('HeatPump.State');

import { Nibe1155 } from './nibe1155';
import { key } from 'nconf';
import { Action } from './actions/action';
import { Actions } from './actions/actions';

export type Mode = 'error' | 'test' | 'init' | 'off' | 'stop' |
                   'onlyBrinePumpOn' | 'onlyHeatPumpOn' | 'pumpsOn' | 'min' | 'maxHeatPump' | 'max' | 'power' | 'temp';

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
    private _timer: NodeJS.Timer;

    private _desiredMode: Mode;
    private _currentMode: Mode;
    private _pendingActions: { targetMode: Mode, actions: Action [], currentIndex: number };
    private _actionHistory: Action [] = [];

    private constructor (nibe1155: Nibe1155) {
        this._nibe1155 = nibe1155;
        this._currentMode = 'init';
    }


    public async start (mode: Mode) {
        if (mode === 'stop') { throw new Error('invalid mode argument'); }
        if (this._currentMode !== 'init' && this._currentMode !== 'stop') {
            throw new Error('Heat pump already started');
        }
        this._desiredMode = mode;
        debugState.info('heat pump controlling started (desired mode "%s")', mode);
    }

    public async stop () {
        this._desiredMode = 'stop';
        if (this._currentMode === 'stop') {
            debugState.warn('stop() command, but heat pump already stopped');
        } else {
            debugState.info('heat pump is now shutting down to mode "stop"');
            process.nextTick( () => this.nextState() );
        }
    }

    public get currentMode (): Mode {
        return this._currentMode;
    }

    public get desiredMode (): Mode {
        return this._desiredMode;
    }

    public set desiredMode (value: Mode) {
        if (value === 'init' || value === 'stop') { throw new Error('invalid argument'); }
        debugState.fine('set desiredMode %s', value);
        this._desiredMode = value;
        process.nextTick( () => this.nextState() );
    }

    public toObject (): any {
        return {
            currentMode: this._currentMode,
            desiredMode: this._desiredMode,
            setPointDM: this._nibe1155.setPointDegreeMinutes
        };
    }

    private async init () {
        this._desiredMode = 'off';
        process.nextTick( () => this.nextState() );
    }


    private async executeActions (targetMode: Mode, actions: Action [], timeoutSecs?: number): Promise<void> {
        if (this._pendingActions) { throw new Error('cannot start actions when older actions pending'); }
        if (actions.length === 0) {
            this._pendingActions = null;
            return Promise.resolve();
        }

        this._pendingActions = {
            targetMode: targetMode,
            actions: actions,
            currentIndex: -1,
        };

        return this.handleActions(timeoutSecs);
    }


    private async handleActions (timeoutSecs: number): Promise<void> {
        let cancel = false;
        if (timeoutSecs > 0) {
            this._timer = setTimeout( () => {
                debug.warn('Timeout: cancel action handling');
                cancel = true;
            }, timeoutSecs);
        }
        for (let i = 0 ; i < this._pendingActions.actions.length; i++) {
            if (cancel) { throw new Error('action handling cancelled'); }
            this._pendingActions.currentIndex = i;
            await this._pendingActions.actions[i].execute();
        }
    }

    private async nextState () {
        if (this._pendingActions) {
            return;
        }

        // if (this._currentMode !== this._desiredMode ) {
            const targetMode = this._desiredMode;
            let mode: Mode;
            try {
                switch (this._currentMode) {
                    case 'init': mode = await this.handleStateInit(targetMode); break;
                    case 'test': mode = await this.handleStateTest(targetMode); break;
                    case 'off': mode = await this.handleStateOff(targetMode); break;
                    case 'onlyBrinePumpOn': mode = await this.handleStateOnlyBrinePumpOn(targetMode);  break;
                    case 'onlyHeatPumpOn': mode = await this.handleStateOnlyHeatPumpOn(targetMode);  break;
                    case 'pumpsOn': mode = await this.handleStatePumpsOn(targetMode); break;
                    case 'min': mode = await this.handleStateMin(targetMode); break;
                    // case 'maxHeatPump':      break;
                    // case 'max':              break;
                    // case 'power':            break;
                    // case 'temp':             break;
                    // case 'stop':             break;
                    case 'error': debug.warn('mode error, fix bugs'); break;
                    default: {
                        debug.warn('mode %s not supported, change to state "error"', this._currentMode);
                        this._desiredMode = 'error';
                    }
                }
                this._currentMode = mode;
                if (this._currentMode === 'error') {
                    debugState.warn('cannot reach %s, enter mode %s', targetMode, mode);
                    this._desiredMode = 'error';
                } else if (this._desiredMode === mode) {
                    debugState.info('desired mode %s reached successfully', mode);
                } else {
                    debugState.info('mode %s reached successfully, continue to reach desired mode %s', mode, this.desiredMode);
                }
            } catch (err) {
                debugState.warn('cannot reach desired mode %s\n%e', targetMode, err);
            } finally {
                debugState.fine('remove pending actions, clear timer');
                this._pendingActions = null;
                if (this._timer) {
                    clearInterval(this._timer);
                    this._timer = null;
                }
            }
        //}

        if (this._currentMode !== this._desiredMode) {
            if (this._desiredMode !== 'error' && this._desiredMode !== 'stop') {
                process.nextTick( () => {
                    this.nextState();
                });
            }
        }

        if (this._currentMode === 'test') {
            await this.handleStateTest('test');
        }
    }

    private async handleStateInit (nextMode: Mode): Promise<Mode> {
        if (nextMode === 'init') { return; }
        debugState.fine('handleStateInit(): (nextMode = %s)', nextMode);
        const m = await this.getCurrentState();
        debugState.info('current state is %s', m);
        return m;
    }

    private async handleStateTest (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStateTest(): (nextMode = %s)', nextMode);
        await this.executeActions(nextMode, [
            new Actions.SetCurve0Temp(30)
        ], 60000);
        return 'test';
    }


    private async handleStateOff (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStateOff(): (nextMode = %s)', nextMode);
        switch (nextMode) {
            case 'off': case 'test': break;

            case 'pumpsOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOn(),
                    new Actions.SwitchBrinePumpOn()
                ], 30000 );
                break;
            }

            case 'stop': {
                await this.executeActions(nextMode, []);
                break;
            }

            case 'onlyBrinePumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOn()
                ], 30000 );
                break;
            }

            case 'onlyHeatPumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOn()
                ], 30000 );
                break;
            }

            case 'min': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOn(),
                    new Actions.SwitchBrinePumpOn(),
                    new Actions.SetCurve(0),
                ], 30000 );
                this._nibe1155.setPointDegreeMinutes = -10;
                break;
            }

            default:
                debugState.warn('off: nextMode %s not implemented', nextMode);
                nextMode = 'error';
        }
        return nextMode;
    }

    private async handleStateOnlyBrinePumpOn (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStateOnlyBrinePumpOn(): (nextMode = %s)', nextMode);
        switch (nextMode) {
            case 'onlyBrinePumpOn': case 'test':  break;

            case 'off': case 'stop': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOn()
                ], 30000 );
                break;
            }

            case 'pumpsOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOn()
                ], 30000 );
                break;
            }

            case 'onlyHeatPumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOff(),
                    new Actions.SwitchHeatPumpOn()
                ], 30000 );
                break;
            }

            case 'min': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOn(),
                    new Actions.SetCurve(0),
                ], 30000 );
                break;
            }

            default:
                debugState.warn('off: nextMode %s not implemented', nextMode);
                nextMode = 'error';


        }
        return nextMode;
    }


    private async handleStateOnlyHeatPumpOn (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStateOnlyHeatPumpOn(): (nextMode = %s)', nextMode);
        switch (nextMode) {
            case 'onlyHeatPumpOn': case 'test':  break;

            case 'off': case 'stop': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOff()
                ], 30000 );
                break;
            }

            case 'onlyBrinePumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOff(),
                    new Actions.SwitchBrinePumpOn()
                ], 30000 );
                break;
            }

            case 'pumpsOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOn()
                ], 30000 );
                break;
            }

            case 'min': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOn(),
                    new Actions.SetCurve(0),
                ], 30000 );
                break;
            }

            default:
                debugState.warn('off: nextMode %s not implemented', nextMode);
                nextMode = 'error';
        }
        return nextMode;
    }


    private async handleStatePumpsOn (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStatePumpsOn(): (nextMode = %s)', nextMode);
        switch (nextMode) {
            case 'test': break;
            case 'pumpsOn': break;

            case 'off': case 'stop': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOff(),
                    new Actions.SwitchBrinePumpOff()
                ], 30000 );
                break;
            }

            case 'onlyBrinePumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOff()
                ], 30000 );
                break;
            }

            case 'onlyHeatPumpOn': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchHeatPumpOff()
                ], 30000 );
                break;
            }

            case 'min': {
                await this.executeActions(nextMode, [
                    new Actions.SwitchBrinePumpOn(),
                    new Actions.SwitchHeatPumpOn(),
                    new Actions.SetCurve0Temp(50),
                    new Actions.SetCurve(0),
                ], 30000 );
                break;
            }

            default:
                debugState.warn('off: nextMode %s not implemented', nextMode);
                nextMode = 'error';

        }
        return nextMode;
    }

    private async handleStateMin (nextMode: Mode): Promise<Mode> {
        debugState.fine('handleStateMin(): (nextMode = %s)', nextMode);
        switch (nextMode) {
            case 'test': break;
            case 'min': {
                if (this._nibe1155.compressorFrequency.value === 0) {
                    this._nibe1155.setPointDegreeMinutes = -100;
                } else {
                    this._nibe1155.setPointDegreeMinutes = -10;
                }
                break;
            }

            case 'off': case 'stop': {
                await this.executeActions(nextMode, [
                    new Actions.SetCurve(1),
                    new Actions.SwitchHeatPumpOff(),
                    new Actions.SwitchBrinePumpOff()
                ], 30000 );
                break;
            }

            default:
                debugState.warn('off: nextMode %s not implemented', nextMode);
                nextMode = 'error';
        }
        return nextMode;
    }



    private async getCurrentState (): Promise<Mode> {
        const hp = Nibe1155.Instance;
        if (hp.supplyPumpState.value === 10 && hp.brinePumpState.value === 10) {
            return 'off';
        }
        if (hp.supplyPumpState.value !== 10 && hp.brinePumpState.value === 10) {
            return 'onlyHeatPumpOn';
        }
        if (hp.supplyPumpState.value === 10 && hp.brinePumpState.value !== 10) {
            return 'onlyBrinePumpOn';
        }
        if (hp.compressorFrequency.value !== 0) {
            return 'min';
        }
        return 'pumpsOn';
    }

}
