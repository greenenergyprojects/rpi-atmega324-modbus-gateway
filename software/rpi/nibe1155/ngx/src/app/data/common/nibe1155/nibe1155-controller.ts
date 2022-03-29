
import { AttributeParser as ap } from '../attribute-parser';
import { CommonLogger } from '../../common-logger';

import { HeatPumpConfig, HeatpumpControllerMode, IHeatPumpConfig, IHeatPumpControllerConfig } from './heat-pump-config';


export interface INibe1155Controller {
    createdAt: Date | number | string;
    controller: IHeatPumpControllerConfig;
    state: HeatpumpControllerMode;
    fCompressor: number;
    pAddHeater: number;
    tPuffer: number;
    tSupply: number;
    tSupplyReturn: number;
    tCondOut: number;
    speedBrinePump: number;
    speedSupplyPump: number;
}

export class Nibe1155Controller implements INibe1155Controller {

    public readonly createdAt: Date;
    public readonly controller: IHeatPumpControllerConfig;
    public readonly state: HeatpumpControllerMode;
    public readonly fCompressor: number;
    public readonly pAddHeater: number;
    public readonly tPuffer: number;
    public readonly tSupply: number;
    public readonly tSupplyReturn: number;
    public readonly tCondOut: number;
    public readonly speedBrinePump: number;
    public readonly speedSupplyPump: number;

    constructor (data: INibe1155Controller) {
        try {
            this.createdAt = ap.parseDate(data.createdAt, 'createdAt', { allowMillis: true, allowString: true });
            this.controller = HeatPumpConfig.parseHeatPumpControllerConfig(data.controller);
            this.state = ap.parseEnum<HeatpumpControllerMode>(data.state, 'state', HeatpumpControllerMode);
            this.fCompressor = ap.parseNumber(data.fCompressor, 'fCompressor', { min: 0, max: 120 });
            this.pAddHeater = ap.parseNumber(data.pAddHeater, 'pAddHeater', { min: 0, max: 6500 });
            this.tPuffer = ap.parseNumber(data.tPuffer, 'tPuffer', { min: 0, max: 100 });
            this.tSupply = ap.parseNumber(data.tSupply, 'tSupply', { min: 0, max: 100 });
            this.tSupplyReturn = ap.parseNumber(data.tSupplyReturn, 'tSupplyReturn', { min: 0, max: 100 });
            this.speedBrinePump = ap.parseNumber(data.speedBrinePump, 'speedBrinePump', { min: 0, max: 100 });
            this.speedSupplyPump = ap.parseNumber(data.speedSupplyPump, 'speedSupplyPump', { min: 0, max: 100 });

        } catch (err) {
            throw new Nibe1155ControllerError('constructor INibe1155Controller fails', data, err);
        }
    }

    public toObject (): INibe1155Controller {
        return ap.toObject<INibe1155Controller>(this, { callbacks: {
            controller: (x) => x as IHeatPumpControllerConfig
        }});
    }

}

export class Nibe1155ControllerError extends Error {
    constructor (message: string, public readonly data: INibe1155Controller, public readonly cause?: unknown) {
        super(message);
    }
}
