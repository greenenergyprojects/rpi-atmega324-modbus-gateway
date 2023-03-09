import * as dgram from 'dgram';

import { AttributeParser } from './data/common/attribute-parser';
import { HeatpumpControllerMode } from './data/common/nibe1155/heat-pump-config';
import { EnumNibe1155ControllerMode, EnumNibe1155ControllerModeValues, EnumNibe1155PumpStateValues, IController, INibe1155, INibe1155Controller, IUdpMessage } from './data/common/udb';
import { HeatPump } from './devices/heat-pump';
import { Nibe1155 } from './devices/nibe1155';


export interface IUdpServerConfig {
	disabled?: boolean;
	port?: number;
	clients: { disabled?: boolean; host: string, port: number, keyfile?: string } [];
}

export class UdpServer {

	private static instance: UdpServer | null | undefined;

	public static async createInstanceAsync (config: IUdpServerConfig): Promise<UdpServer> {
		if (this.instance !== undefined) {
			throw new Error('instance already created');
		}
		try {
			const instance = new UdpServer(config);
			await instance.initAsync();
			this.instance = instance;
			return instance;
		} catch (error) {
			this.instance = undefined;
			throw error;
		}
	}

	public static getInstance (): UdpServer {
		if (!this.instance) {
			throw new Error('instance not created yet');
		}
		return this.instance;
	}

	// ------------------------------------------------------------------------

	private config: IUdpServerConfig;
	private socket?: dgram.Socket;
	
	private constructor (config: IUdpServerConfig) {
		this.config = {
			disabled: AttributeParser.parseBoolean(config.disabled, 'disabled', { allowUndefined: true }),
			port: AttributeParser.parseNumber(config.port, 'port', { min: 0, max: 65_535, allowUndefined: true }),
			clients: []
		}
		if (!Array.isArray(config.clients)) { throw new TypeError('invalid config.clients'); }
		for (const cx of config.clients) {
			if (!cx.disabled) {
				this.config.clients.push({
					host: AttributeParser.parseString(cx.host, 'host'),
					port: AttributeParser.parseNumber(cx.port, 'udpPort', { min: 0, max: 65_535})
				});
			}
		}
	}

	private async initAsync (): Promise<void> {
		if (this.config.disabled) { return; }
		const socket = dgram.createSocket('udp4');
		this.socket = socket;
		this.socket.on('listening', () => {
			for (const cx of this.config.clients || []) {
				if (cx.host.includes('255')) {
					console.log('activate broadcast...');
					socket.setBroadcast(true);
					return;
				}
			}
		});
		this.socket.on('error', error => {
			console.warn('socket error event', error);
		});
		this.socket.on('message', (message, rinfo) => this.handleIncomingMessage(message, rinfo) );

		if (this.config.port !== undefined) {
			this.socket.bind(this.config.port, ()=> {
				console.info('udp server listening on port ', this.config.port);
			});
		}
        setInterval( () => this.handleTimer(), 2000);
	}

	// ------------------------------------------------------------------------

    private handleTimer (): void {
        this.handleTimerAsync().catch( error => console.log('handleTimerAsync() fails', error));
    }

    private async handleTimerAsync (): Promise<void> {
        if (!Array(this.config.clients) || this.config.clients.length === 0) { return; }
        let controllerTo: IController | undefined;
		{
			const heatPump = HeatPump.getInstance();
			const x = heatPump.toObject();
			const controller: INibe1155Controller = {
				mode: x.controller.mode,
				set: x.controller.set
			}
			if (x.controller.mode === 'frequency') {
				controller.frequency = {
					fSetpoint: x.controller.fSetpoint,
					pAddHeater: x.controller.pAddHeater
				}
			}
			if (x.controller.mode === 'temperature') {
				controller.temperature = {
					fSetpoint: x.controller.fSetpoint,
					tMin: x.controller.tMin,
					tMax: x.controller.tMax
				}
			}
			
			controllerTo = {
				at: x.createdAt,
				controller,
				state: x.state,
				compressorFrequencyInHz: x.fCompressor,
				addHeaterPowerInWatt: x.pAddHeater,
				storageTemperaturInCelsius: x.tPuffer,
				heatSupplyInCelsius: x.tSupply,
				heatReturnInCelsius: x.tSupplyReturn,
				condensorOutInClesius: x.tCondOut,
				brinePumpSpeedInPercent: x.speedBrinePump,
				heatSupplyPumpInPercent: x.speedSupplyPump
			};
		}

		const nibe1155To: Partial<INibe1155> =  { at: Date.now() };
		{
			{
				const v = Nibe1155.Instance.brineInTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.brineInTemperatureInCelsius = to;
				}
				// console.log('===>brineInTemp', nibe1155To.brineInTemperatureInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.brineOutTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.brineOutTemperatureInCelsius = to;
				}
				// console.log('===>brineOutTemp', nibe1155To.brineOutTemperatureInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.degreeMinutes;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.degreeMinutes = to;
				}
				// console.log('===>degreeMinutes', nibe1155To.degreeMinutes, v);
			}
			{
				const v = Nibe1155.Instance.electricHeaterPower;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.electricHeaterPowerInWatt = to;
				}
				// console.log('===>electricHeaterPower', nibe1155To.electricHeaterPowerInWatt, v);
			}
			{
				const v = Nibe1155.Instance.addHeatingMaxPower;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.maxElectricHeaterPowerInKW = to;
				}
				// console.log('===>addHeatingMaxPower', nibe1155To.maxElectricHeaterPowerInKW, v);
			}
			{
				const v = Nibe1155.Instance.compressorState;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.compressorState = to;
				}
				// console.log('===>compressorState', nibe1155To.compressorState, v);
			}
			{
				const v = Nibe1155.Instance.compressorFrequency;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.compressorFrequencyInHz = to;
				}
				// console.log('===>compressorFrequency', nibe1155To.compressorFrequencyInHz, v);
			}
			{
				const v = Nibe1155.Instance.compressorInPower;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.compressorPowerInWatt = to;
				}
				// console.log('===>compressorPowerInWatt', nibe1155To.compressorPowerInWatt, v);
			}
			{
				const v = Nibe1155.Instance.condensorOutTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.condensorOutTemperatureInCelsius = to;
				}
				// console.log('===>condensorOutTemp', nibe1155To.condensorOutTemperatureInClesius, v);
			}
			{
				const v = Nibe1155.Instance.supplyPumpState;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.heatPumpState = to;
				}
				// console.log('===>supplyPumpState', nibe1155To.supplyPumpState, v);
			}
			{
				const v = Nibe1155.Instance.brinePumpState;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.brinePumpState = to;
				}
				// console.log('===>brinePumpState', nibe1155To.brinePumpState, v);
			}
			{
				const v = Nibe1155.Instance.supplyPumpSpeed;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.heatPumpSpeedInPercent = to;
				}
				// console.log('===>supplyPumpSpeed', nibe1155To.supplyPumpSpeedInPercent, v);
			}
			{
				const v = Nibe1155.Instance.brinePumpSpeed;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.brinePumpSpeedInPercent = to;
				}
				// console.log('===>brinePumpSpeed', nibe1155To.brinePumpSpeedInPercent, v);
			}
			{
				const v = Nibe1155.Instance.outdoorTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.outdoorTemperatureInCelsius = to;
				}
				// console.log('===>outdoorTemp', nibe1155To.outdoorTemperatureInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.supplyTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.heatStorageTemperaturInCelsius = to;
				}
				// console.log('===>supplyTemp', nibe1155To.storageTemperaturInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.supplyS1Temp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.heatSupplyTemperatureInCelsius = to;
				}
				// console.log('===>supplyS1Temp', nibe1155To.heatSupplyInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.supplyS1ReturnTemp;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.heatReturnTemperatureInCelsius = to;
				}
				// console.log('===>supplyS1ReturnTemp', nibe1155To.heatReturnInCelsius, v);
			}
			{
				const v = Nibe1155.Instance.allowAdditiveHeating;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value === 0 ? false : true, id: v.id };
					nibe1155To.allowElectricHeating = to;
				}
				// console.log('===>allowAdditiveHeating', nibe1155To.allowElectricHeating, v);
			}
			{
				const v = Nibe1155.Instance.allowHeating;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value === 0 ? false : true, id: v.id };
					nibe1155To.allowHeating = to;
				}
				// console.log('===>allowHeating', nibe1155To.allowHeating, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequActivated1;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value === 0 ? false : true, id: v.id };
					nibe1155To.cutOffFrequency1Activated = to;
				}
				// console.log('===>cutOffFrequActivated1', nibe1155To.cutOffFrequency1Activated, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequActivated2;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value === 0 ? false : true, id: v.id };
					nibe1155To.cutOffFrequency2Activated = to;
				}
				// console.log('===>cutOffFrequActivated2', nibe1155To.cutOffFrequency2Activated, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequStart1;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.cutOffFrequency1StartInHz = to;
				}
				// console.log('===>cutOffFrequStart1', nibe1155To.cutOffFrequency1StartInHz, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequStart2;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.cutOffFrequency2StartInHz = to;
				}
				// console.log('===>cutOffFrequStart2', nibe1155To.cutOffFrequency2StartInHz, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequStop1;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.cutOffFrequency1StopInHz = to;
				}
				//console.log('===>cutOffFrequStop1', nibe1155To.cutOffFrequency1StopInHz, v);
			}
			{
				const v = Nibe1155.Instance.cutOffFrequStop2;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.cutOffFrequency2StopInHz = to;
				}
				// console.log('===>cutOffFrequStop2', nibe1155To.cutOffFrequency2StopInHz, v);
			}
			{
				const v = Nibe1155.Instance.operationalMode;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.operationalMode = to;
				}
				// console.log('===>operationalMode', nibe1155To.operationalMode, v);
			}
			{
				const v = Nibe1155.Instance.energyCompAndElHeater;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.totalEnergyInMWh = to;
				}
				// console.log('===>energyCompAndElHeater', nibe1155To.totalEnergyInMWh, v);
			}
			{
				const v = Nibe1155.Instance.alarm;
				if (v.valueAt && v.valueAt instanceof Date && typeof v.value === 'number' && !Number.isNaN(v.value)) {
					const to = { at: v.valueAt.getTime(), value: v.value, id: v.id };
					nibe1155To.alarmCode = to;
				}
				// console.log('===>alarm', nibe1155To.alarmCode, v);
			}
		}

		const schedule = HeatPump.getInstance().scheduleTable;

		const message: IUdpMessage = { nibe1155: { controller: controllerTo, nibe1155: nibe1155To, schedule }};
        for (const client of this.config.clients) {
            await this.sendPacketAsync(message, client);
            // console.log('send udp message to ' + client.host + ':' + client.port + '\n', JSON.stringify(message));
        }
    }

	private handleIncomingMessage (message: Buffer, rinfo: dgram.RemoteInfo): void {
		this.handleIncomingMessageAsync(message, rinfo)
			.catch( error => console.warn('handleIncomingMessageAsync() fails', error));
	}

	private async handleIncomingMessageAsync (message: Buffer, rinfo: dgram.RemoteInfo): Promise<void> {
		// console.log('handleIncomingMessage(), message="%s"\nrinfo=', message, rinfo);
		try {
			const messageObject = JSON.parse(message.toString()) as IUdpMessage;
			if (typeof messageObject !== 'object') { throw new TypeError('invalid message'); }

			if (messageObject.nibe1155) {
				try {
					
					// await this.sendPacketAsync(checkPacket, { host: rinfo.address, port: rinfo.port });

				} catch (error) {
					console.warn('handleIncomingMessageAsync() fails for froniusSymo', error);
				}
			}

		} catch (error) {
			console.warn('handleIncomingMessage() fails\nmessage=', message.toString(), '\nrinfo=', rinfo, '\nerror=', error);
		}
	}


	private async sendPacketAsync (message: IUdpMessage, to?: { host: string, port: number }): Promise<void> {
		const promises: Promise<void> [] = [];
		const clients: { host: string, port: number } [] = to ? [ to ] : this.config.clients;
		for (const cx of clients) {
			const p = new Promise<void>( (resolve, reject) => {
				if (!this.socket) {
					return reject(new Error('no socket available'));
				}
				this.socket.send(Buffer.from(JSON.stringify(message)), cx.port, cx.host, error => {
					if (error) {
						reject(new UdpServerError('send fails', error));
					} else {
						resolve();
					}
				});
			});
			promises.push(p);
		}
		await Promise.all(promises);
	}
}

export class UdpServerError extends Error {
	constructor (message: string, public causedBy?: unknown) {
		super(message);
	}
}
