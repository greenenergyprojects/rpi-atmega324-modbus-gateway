
export interface IUdpMessage {
	nibe1155?: {
		checkhash?: {
			nibe1155?: number;
			controller?: number;
		}
		change?: {
			nibe1155?: IChange<INibe1155>;
			controller?: IChange<IController>;
		}
	};
}


export interface IChange<T> {
	fromHash?: number;
	from?: T;
	to?: T;
}

export interface INibe1155 {
}

export interface IController {
	at: Date | number | string;
	controller: INibe1155Controller;
	state: EnumNibe1155ControllerModeValues;
	compressorFrequencyInHz: number;
	addHeaterPowerInWatt: number;
	storageTemperaturInCelsius: number;
	heatSupplyInCelsius: number;
	heatReturnInCelsius: number;
	condensorOutInClesius: number;
	brinePumpSpeedInPercent: number;
	heatSupplyPumpInPercent: number;
}

export interface INibe1155Controller {
    mode: EnumNibe1155ControllerModeValues;
	set: { at: Date; by: string; };
	frequency?: {
		fSetpoint: number;
		pAddHeater: 0 | 500 | 1000 | 1500 | 2000 | 2500 | 3000 | 3500 | 4000 | 4500 | 5000 | 5500 | 6000 | 6500 | number;
	};
	temperature?: {
		fSetpoint: number;
    	tMin: number;
    	tMax: number;
	};
}

export type EnumNibe1155ControllerModeValues = keyof typeof EnumNibe1155ControllerMode;
export enum EnumNibe1155ControllerMode {
    off = 'off',
    init = 'init',
    frequency = 'frequency',
    temperature = 'temperature',
    test = 'test',
    error = 'error',
    disabled = 'disabled'
}
