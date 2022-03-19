import { AttributeParser as ap } from '../attribute-parser';
import { CommonLogger } from '../../common-logger';

export enum HeatpumpControllerMode {
    off = 'off',
    init = 'init',
    frequency = 'frequency',
    temperature = 'temperature',
    test = 'test',
    error = 'error',
    disabled = 'disabled'
}

export interface IHeatPumpConfigOff {
    mode: HeatpumpControllerMode.off;
}

export interface IHeatPumpConfigFrequency {
    mode: HeatpumpControllerMode.frequency;
    fSetpoint: number;
    pAddHeater: 0 | 500 | 1000 | 1500 | 2000 | 2500 | 3000 | 3500 | 4000 | 4500 | 5000 | 5500 | 6000 | 6500 | number;
}

export interface IHeatPumpConfigTemperature {
    mode: HeatpumpControllerMode.temperature;
    fSetpoint: number;
    tMin: number;
    tMax: number;
}

export interface IHeatPumpConfigTest {
    mode: HeatpumpControllerMode.test;
}

export type IHeatPumpControllerConfig = IHeatPumpConfigOff | IHeatPumpConfigFrequency | IHeatPumpConfigTemperature | IHeatPumpConfigTest;

export interface IHeatPumpConfig {
    disabled?: boolean;
    start?: IHeatPumpControllerConfig [];
}

export class HeatPumpConfig implements IHeatPumpConfig {

    public static parseHeatPumpControllerConfig (config: IHeatPumpControllerConfig): IHeatPumpControllerConfig {
        switch (config.mode) {
            case HeatpumpControllerMode.off: {
                return { mode: HeatpumpControllerMode.off };
            }
            case HeatpumpControllerMode.frequency: {
                return {
                    mode: HeatpumpControllerMode.frequency,
                    fSetpoint: ap.parseNumber(config.fSetpoint, 'fSetpoint', { min: 20, max: 100 }),
                    pAddHeater: ap.parseNumber(config.pAddHeater, 'pAddHeater', { min: 0, max: 6500 })
                };
            }
            case HeatpumpControllerMode.temperature: {
                return {
                    mode: HeatpumpControllerMode.temperature,
                    fSetpoint: ap.parseNumber(config.fSetpoint, 'fSetpoint', { min: 20, max: 100 }),
                    tMin: ap.parseNumber(config.tMin, 'tMin', { min: 20, max: 60 }),
                    tMax: ap.parseNumber(config.tMin, 'tMax', { min: 20, max: 60 })
                };
            }
        }
        if (config.mode === HeatpumpControllerMode.test) {
            return config;
        }
        throw new Error ('invalid mode ' + (config as unknown as { mode: unknown }).mode);
    }

    // ------------------------------------------------------------------------

    public readonly disabled?: boolean;
    public readonly start: IHeatPumpControllerConfig [];

    constructor (config: IHeatPumpConfig) {
        try {
            this.disabled = ap.parseBoolean(config.disabled, 'disabled', { allowUndefined: true });
            this.start = [];
            if (config.start) {
                for (const cfg of config.start) {
                    try {
                        const cx = HeatPumpConfig.parseHeatPumpControllerConfig(cfg);
                        this.start.push(cx);
                    } catch (error) {
                        CommonLogger.warn('skip config %o (%s)', JSON.stringify(cfg), error.message);
                    }
                }
            }
            ap.removeUndefined(this);

        } catch (error) {
            throw new HeatPumpConfigError('constructor HeatPumpConfig fails', config, error);
        }
    }

    public toObject (): IHeatPumpConfig {
        return ap.toObject<IHeatPumpConfig>(this);
    }

}

export class HeatPumpConfigError extends Error {
    constructor (message: string, public readonly config: IHeatPumpConfig, public readonly cause?: unknown) {
        super(message);
    }
}
