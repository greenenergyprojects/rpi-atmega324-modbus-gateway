import { IScheduleTable } from "../../devices/heat-pump";

export interface IUdpMessage {
	nibe1155?: {
		checkhash?: {
			nibe1155?: number;
			controller?: number;
		}
		nibe1155?: Partial<INibe1155>;
		controller?: IController;
		schedule?: IScheduleTable;
	};
}


export interface IChange<T> {
	fromHash?: number;
	from?: T;
	to?: T;
}

export interface INibe1155 {
	at: Date | number | string;
	brineInTemperatureInCelsius: IValue<number>;
    brineOutTemperatureInCelsius: IValue<number>;
	degreeMinutes: IValue<number>;
	electricHeaterPowerInWatt: IValue<number>;
	maxElectricHeaterPowerInKW: IValue<number>;
	compressorState: number | IValue<EnumNibe1155CompressorStateValues | number>,
	compressorFrequencyInHz: IValue<number>;
	compressorPowerInWatt:  IValue<number>;
	condensorOutTemperatureInCelsius: IValue<number>;
    heatPumpState: IValue<EnumNibe1155PumpStateValues | number>,
    brinePumpState: number | IValue<EnumNibe1155PumpStateValues | number>,
    heatPumpSpeedInPercent: IValue<number>,
    brinePumpSpeedInPercent: IValue<number>,
    outdoorTemperatureInCelsius: IValue<number>,
	heatStorageTemperaturInCelsius:  IValue<number>,
	heatSupplyTemperatureInCelsius: IValue<number>,
	heatReturnTemperatureInCelsius: IValue<number>,
	allowElectricHeating: IValue<boolean>,
	allowHeating: IValue<boolean>,
	cutOffFrequency1Activated: IValue<boolean>,
	cutOffFrequency2Activated: IValue<boolean>,
	cutOffFrequency1StartInHz: IValue<number>,
	cutOffFrequency2StartInHz: IValue<number>,
	cutOffFrequency1StopInHz: IValue<number>,
	cutOffFrequency2StopInHz: IValue<number>,
	operationalMode: IValue<EnumNibe1155OperationalModeValues | number>,
	totalEnergyInMWh: IValue<number>,
	alarmCode: IValue<number>
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

export type EnumNibe1155PumpStateValues = keyof typeof EnumNibe1155PumpState;
export enum EnumNibe1155PumpState {
	'off' = 10,
	'starting' = 15,
	'on' = 20,
	'10-day-mode' = 40,
	'calibration' = 80
}

export type EnumNibe1155PumpModeValues = keyof typeof EnumNibe1155PumpMode;
export enum EnumNibe1155PumpMode {
	'intermittent' = 10,
	'continous' = 20,
	'economy' = 30,
	'auto' = 40
}

export type EnumNibe1155CompressorStateValues = keyof typeof EnumNibe1155CompressorState;
export enum EnumNibe1155CompressorState {
	'stopped' = 20,
	'starting' = 40,
	'running' = 60,
	'stopping' = 100
}

export type EnumNibe1155OperationalModeValues = keyof typeof EnumNibe1155OperationalMode;
export enum EnumNibe1155OperationalMode {
	'auto' = 0,
	'manual' = 1,
	'electrical heating only' = 2
}

export interface IValue<T> {
    at: Date | number | string;
	value: T;
	id: number;
}
