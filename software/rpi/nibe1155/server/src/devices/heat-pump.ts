
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('devices:HeatPump');
const debugAction: debugsx.IDefaultLogger = debugsx.createDefaultLogger('HeatPump.Action');
const debugState: debugsx.IDefaultLogger = debugsx.createDefaultLogger('HeatPump.State');

import { Nibe1155 } from './nibe1155';
import { key } from 'nconf';

export type Mode = 'init' | 'off' | 'stop' |
                   'onlyBrinePumpOn' | 'onlySupplyPumpOn' | 'pumpsOn' | 'min' | 'maxHeatPump' | 'max' | 'power' | 'temp';

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
    private _currentAction: Action;
    private _actionHistory: Action [] = [];

    private constructor (nibe1155: Nibe1155) {
        this._nibe1155 = nibe1155;
        this._currentMode = 'init';
    }


    public async start (mode: Mode) {
        if (mode === 'stop') { throw new Error('invalid mode argument'); }
        this.desiredMode = mode;
        if (this._timer) {
            debugState.warn('start() command, but heat pump already started');
        } else {
            this._timer = setInterval( () => this.nextState(), 2000);
            debugState.info('heat pump controlling started (desired mode "%s")', mode);
        }
    }

    public async stop () {
        this.desiredMode = 'stop';
        if (!this._timer) {
            debugState.warn('stop() command, but heat pump already stopped');
        } else {
            debugState.info('heat pump is now shutting down to mode "stop"');
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

    private async init () {
        this._desiredMode = 'off';
        process.nextTick( () => this.nextState() );
    }

    private endAction (error?: Error) {
        const a = this._currentAction;
        if (!a) { debug.warn('cannot end action, no action in progress'); return; }
        a.finish(error);
        this._currentAction = null;
    }


    private startAction (desired: Mode, timeoutSecs?: number): void;
    private startAction (desired: Mode, next: Mode, timeoutSecs: number): void;
    private startAction (desired: Mode, next?: Mode | number, timeoutSecs?: number): void {
        this._desiredMode = desired;
        let n: Mode;
        if (timeoutSecs === undefined && typeof next === 'number') {
            timeoutSecs = next;
            n = undefined;
        } else if (typeof next === 'string') {
            n = next;
        }
        const a = new Action(this._currentMode, desired, n ? n : desired, timeoutSecs);
        this._actionHistory.push(a);
        this._currentAction = a;
    }

    private async nextState () {
        if (this._currentAction) {
            if (Date.now() > this._currentAction.timeoutAtMillis) {
                debug.warn('action timeout, cannot reach desired mode %s', this._currentAction.desiredMode);
                this.endAction(new Error('Timeout'));
            } else  if (debug.finest.enabled) {
                debug.finest('action in progress since %s, skipping handleTimer()', this._currentAction.at.toLocaleTimeString());
            }
            if (this._currentMode === this._desiredMode) {
                this.endAction();
            }
            return;
        }

        if (this._currentMode !== this._desiredMode) {
            switch (this._currentMode) {
                case 'init':             this.handleStateInit(); break;
                case 'off':              this.handleStateOff(); break;
                case 'onlyBrinePumpOn':  this._desiredMode = 'off'; this.startAction('off'); break;
                case 'onlySupplyPumpOn': this._desiredMode = 'off'; this.startAction('off'); break;
                case 'pumpsOn':          this.handleStatePumpsOn(); break;
                case 'min':              this._desiredMode = 'off'; this.startAction('off'); break;
                case 'maxHeatPump':      this._desiredMode = 'off'; this.startAction('off'); break;
                case 'max':              this._desiredMode = 'off'; this.startAction('off'); break;
                case 'power':            this._desiredMode = 'off'; this.startAction('off'); break;
                case 'temp':             this._desiredMode = 'off'; this.startAction('off'); break;
                case 'stop':             this._desiredMode = 'off'; this.startAction('off'); break;
                default: {
                    debug.warn('mode %s not supported, change to state "off"', this._currentMode);
                    this._desiredMode = 'off';
                    this.startAction('off');
                }
            }
        }
    }

    private async handleStateInit () {
        debugState.fine('handleStateInit(): (desiredMode = %s)', this._desiredMode);
        this._currentMode = 'off';
    }

    private async handleStateOff () {
        debugState.fine('handleStateOff(): (desiredMode = %s)', this._desiredMode);
        switch (this._desiredMode) {
            case 'pumpsOn': {
                this.startAction('pumpsOn', 20);
                if (this._nibe1155.brinePumpState.value === 20 && this._nibe1155.supplyPumpState.value === 20) {
                    debugState.fine('pumps switched on');
                    this._currentMode = 'pumpsOn';
                    this.endAction();
                } else {
                    while (this._currentAction) {
                        try {
                            await this._nibe1155.writeBrinePumpMode('continous');
                            debugState.fine('brine pump switched on');
                            break;
                        } catch (err) { debug.warn(err); }
                    }
                    while (this._currentAction) {
                        try {
                            await this._nibe1155.writeSupplyPumpMode('continous');
                            debugState.fine('supply pump switched on');
                            break;
                        } catch (err) { debug.warn(err); }
                    }
                    debugState.fine('pumps switched on');
                    const eventHandler = function (value: number) {
                        if (this._nibe1155.brinePumpState.value === 20 && this._nibe1155.supplyPumpState.value === 20) {
                            debugState.fine('pumps switched on');
                            this._currentMode = 'pumpsOn';
                            this._nibe1155.off('supplyPumpState', eventHandler);
                            this._nibe1155.off('brinePumpState', eventHandler);
                            this.endAction();
                        }
                    };
                    this._nibe1155.on('supplyPumpState', (value) => eventHandler.bind(this)(value) );
                    this._nibe1155.on('brinePumpState', (value) => eventHandler.bind(this)(value) );
                }
                break;
            }
        }
    }

    private async handleStatePumpsOn () {
        debugState.fine('handleStatePumpsOn(): (desiredMode = %s)', this._desiredMode);
        switch (this._desiredMode) {
            case 'off': {
                this.startAction('off', 20);
                if (this._nibe1155.brinePumpState.value === 40 && this._nibe1155.supplyPumpState.value === 30) {
                    debugState.fine('pumps switched off');
                    this._currentMode = 'off';
                    this.endAction();
                } else {
                    while (this._currentAction) {
                        try {
                            await this._nibe1155.writeBrinePumpMode('auto');
                            debugState.fine('brine pump switched off (mode auto)');
                            break;
                        } catch (err) { debug.warn(err); }
                    }
                    while (this._currentAction) {
                        try {
                            await this._nibe1155.writeSupplyPumpMode('economy');
                            debugState.fine('supply pump switched off (mode economy)');
                            break;
                        } catch (err) { debug.warn(err); }
                    }
                    debugState.fine('pumps switched off');
                    const eventHandler = function (value: number) {
                        if (this._nibe1155.brinePumpState.value === 40 && this._nibe1155.supplyPumpState.value === 30) {
                            debugState.fine('pumps switched off');
                            this._currentMode = 'off';
                            this._nibe1155.off('supplyPumpState', eventHandler);
                            this._nibe1155.off('brinePumpState', eventHandler);
                            this.endAction();
                        }
                    };
                    this._nibe1155.on('supplyPumpState', (value) => eventHandler.bind(this)(value) );
                    this._nibe1155.on('brinePumpState', (value) => eventHandler.bind(this)(value) );
                }
                break;
            }
        }
    }

}

class Action {

    private _at: Date;
    private _currentMode: Mode;
    private _nextMode: Mode;
    private _desiredMode: Mode;
    private _callStack: string;
    private _timeoutAtMillis: number;
    private _finishedAt: Date;
    private _error: Error;

    constructor (current: Mode, desired: Mode, next?: Mode, maxTimeSecs?: number) {
        this._at = new Date();
        this._currentMode = current;
        this._desiredMode = desired;
        this._nextMode = next;
        this._callStack = new Error().stack;
        if (maxTimeSecs > 0) {
            this._timeoutAtMillis = Date.now() + maxTimeSecs * 1000;
        }
        if (debugAction.info.enabled) {
            debugAction.info('new Action %s', this.toString());
        }
    }

    public finish (error?: Error) {
        if (this._finishedAt) { throw new Error('action already finished'); }
        this._finishedAt = new Date();
        if (error) {
            this._error = error;
            if (debugAction.warn.enabled) {
                debugAction.warn('Action finished with error %s', this.toString());
            }
        } else if (debugAction.info.enabled) {
            debugAction.info('Action finished %s', this.toString());
        }
    }

    public get at(): Date {
        return this._at;
    }

    public get currentMode (): Mode {
        return this._currentMode;
    }

    public get nextMode (): Mode {
        return this._nextMode;
    }

    public get desiredMode (): Mode {
        return this._desiredMode;
    }

    public get callStack (): string {
        return this._callStack;
    }

    public get timeoutAtMillis (): number {
        return this._timeoutAtMillis;
    }

    public get finishedAt (): Date {
        return this.finishedAt;
    }

    public get error (): Error {
        return this._error;
    }

    public toString (): string {
        const rv = JSON.stringify(this, (k, v) => {
            if (k === '_callStack') { return undefined; }
            if (k === '_timeoutAtMillis' && this._timeoutAtMillis > 0) {
                return '+' + (this._timeoutAtMillis - this._at.getTime()) + 'ms';
            }
            return v;
        });
        return rv;
    }


}
