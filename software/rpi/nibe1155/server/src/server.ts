
import * as debugsx from 'debug-sx';
const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('server');

import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

import * as nconf from 'nconf';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';

import { handleError, RouterError, BadRequestError, AuthenticationError, NotFoundError } from './routers/router-error';
import { Auth } from './auth';
import { IUser, User } from './db/user';

import { RouterData } from './routers/router-data';
import { RouterModbus } from './routers/router-modbus';
import { RouterNibe } from './routers/router-nibe';

interface IServerConfig {
    start: boolean;
    port: number;
    morgan: {
        disabled?: boolean,
        config?: string
    };
    pin?: string;
}

export class Server {

    private static _instance: Server;

    public static get Instance (): Server {
        if (Server._instance === undefined) {
            Server._instance = new Server();
        }
        return Server._instance;
    }

    // ************************************************

    private _express: express.Express;
    private _config: IServerConfig;
    private _server: http.Server;

    private constructor (config?: IServerConfig) {
        config = config || nconf.get('server');
        if (!config) { throw new Error('missing config'); }
        if (config.start === undefined || config.start === true) {
            if (config.port < 0 || config.port > 0xffff) { throw new Error('invalid/missing port in config'); }
        }
        this._config = config;
    }

    public async stop () {
        if (this._server) {
            this._server.close();
            this._server = null;
        }
    }

    public async start (port?: number): Promise<void> {
        this._express = express();
        this._express.set('views', path.join(__dirname, '/views'));
        const pugEngine = this._express.set('view engine', 'pug');
        pugEngine.locals.pretty = true;

        this._express.use(cors());
        if (this._config.morgan && this._config.morgan.disabled !== true) {
            this._express.use(morgan(this._config.morgan.config || 'tiny'));
        }
        this._express.use(bodyParser.json());
        this._express.use(bodyParser.urlencoded({ extended: true }) );

        this._express.post('/auth', (req, res, next) => Auth.Instance.handlePostAuth(req, res, next));

        this._express.use('/data', RouterData.Instance);
        this._express.use('/modbus', RouterModbus.Instance);
        this._express.use('/nibe', RouterNibe.Instance);
        this._express.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
        this._express.use('/ngx', express.static(path.join(__dirname, '../../ngx/dist')));
        this._express.use('/assets', express.static(path.join(__dirname, '../../ngx/dist/assets')));
        // this._express.use('/res', RouterRes.routerInstance);

        this._express.get('/*', (req, res, next) => this.handleGet(req, res, next));
        this._express.use((req, res, next) => Auth.Instance.authorizeRequest(req, res, next));
        this._express.get('/auth', (req, res, next) => Auth.Instance.handleGetAuth(<any>req, res, next));
        this._express.get('/test', (req, res, next) => this.handleGetTest(<any>req, res, next));
        // this._express.use('/data', RouterData.Instance);

        this._express.use(
            (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => this.errorHandler(err, req, res, next)
        );

        const server = http.createServer(this._express).listen(this._config.port, () => {
            debug.info('Server gestartet: http://localhost:%s', this._config.port);
        });
        server.on('connection', socket => {
            debug.fine('Connection established: %s:%s', socket.remoteAddress, socket.remotePort);
            // socket.destroy();
        });
        server.on('close', () => {
            debug.info('Server gestoppt');
        });
        server.on('error', err => {
            debug.warn(err);
        });
        this._server = server;
    }

    public isPinOK (pin: string): boolean {
        return typeof this._config.pin === 'string' && this._config.pin.length === 4 && this._config.pin === pin;
    }

    private errorHandler (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        const now = new Date();
        const ts = now.toISOString();
        debug.warn('Internal Server Error: %s\n%e', ts, err);
        if (req.headers.accept && req.headers.accept.indexOf('application/json') >= 0) {
            res.status(500).json({ error: 'Internal Server Error', ts: ts });
        } else {
            res.status(500).send('Internal Server Error (' + ts + ')');
        }
    }


    private handleGet (req: express.Request, res: express.Response,
                       next: express.NextFunction) {
        debug.info(req.url);

        if (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/app') ) {
            const indexFileName = path.join(__dirname, '../../ngx/dist/ngx/index.html');
            res.sendFile(indexFileName);
            return;
        }
        if (req.url === '/favicon.ico') {
            const fileName = path.join(__dirname, '..', 'dist/public/favicon.ico');
            debug.info(fileName);
            res.sendFile(fileName);
            return;
        }
        // if (req.url.startsWith('/ngx/')) {
        //     if (req.url === '/ngx/vendor.bundle.js') {
        //         debug.fine('/ngx/vendor.bundle.js not avilable, send empty response');
        //         res.end();
        //         return;
        //     }
        //     handleError(new NotFoundError(req.url + 'not found'), req, res, next, debug);
        //     return;
        // }

        let fn = path.join(__dirname, '../../ngx/dist/ngx/', req.url);
        try {
            const index = fn.indexOf('?');
            if (index > 0) {
                fn = fn.substr(0, index);
            }
            fs.accessSync(fn, fs.constants.R_OK);
            res.sendFile(fn);
            return;
        } catch (err) {
        }

        next();
    }


    private async handleGetTest (req: IAuthorizedRequest, res: express.Response, next: express.NextFunction) {
        try {
            res.json({});
            // throw new Error('Testerror');
            // throw new BadRequestError('Test', new Error('Cause'));
            // throw new NotFoundError('Test');
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }


}

export interface IRequestUser {
    id: string;
    iat: number;
    exp: number;
    model: User;
}

export interface IRequestWithUser extends express.Request {
    user: IRequestUser;
}

interface IAuthorizedRequest extends express.Request {
    user: User;
}

