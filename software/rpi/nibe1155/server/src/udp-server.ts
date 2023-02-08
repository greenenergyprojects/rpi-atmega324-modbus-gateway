import * as dgram from 'dgram';

import { AttributeParser } from './data/common/attribute-parser';
import { HeatpumpControllerMode } from './data/common/nibe1155/heat-pump-config';
import { EnumNibe1155ControllerMode, EnumNibe1155ControllerModeValues, IController, INibe1155Controller, IUdpMessage } from './data/common/udb';
import { HeatPump } from './devices/heat-pump';


export interface IUdpServerConfig {
	disabled?: boolean;
	port?: number;
	clients: { host: string, port: number, keyfile?: string } [];
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
			this.config.clients.push({
				host: AttributeParser.parseString(cx.host, 'host'),
				port: AttributeParser.parseNumber(cx.port, 'udpPort', { min: 0, max: 65_535})
			})
		}
	}

	private async initAsync (): Promise<void> {
		if (this.config.disabled) { return; }
		this.socket = dgram.createSocket('udp4');
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
        
        const to: IController = {
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
        const message: IUdpMessage = { nibe1155: { change: { controller: { to }}}};
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
