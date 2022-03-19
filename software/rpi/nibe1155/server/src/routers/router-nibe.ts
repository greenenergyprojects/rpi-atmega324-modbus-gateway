
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterNibe');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';
import { Nibe1155 } from '../devices/nibe1155';
import { HeatPump } from '../devices/heat-pump';
import { Server } from '../server';
import { INibe1155Controller, Nibe1155Controller } from '../data/common/nibe1155/nibe1155-controller';
import { IHomeControlData } from '../data/common/nibe1155/home-control-data';
import { HeatpumpControllerMode, IHeatPumpControllerConfig } from '../data/common/nibe1155/heat-pump-config';


export class RouterNibe {

    public static getInstance(): express.Router {
        if (!this._instance) {
            this._instance = new RouterNibe();
        }
        return this._instance._router;
    }

    private static _instance: RouterNibe;

    // ******************************************************

    private _router: express.Router;

    private constructor () {
        this._router = express.Router();
        // this._router.all('/*', (req, res, next) => this.all(req, res, next));
        // this._router.get('/register', (req, res, next) => this.getRegister(req, res, next));
        // this._router.get('/status', (req, res, next) => this.getStatus(req, res, next));
        this._router.post('/mode', (req, res, next) => this.postMode(req, res, next));
        this._router.post('/home-control', (req, res, next) => this.postHomeControl(req, res, next));
    }

    private async all (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            // res.send('OK');
            debug.info('---> %s', req.url);
            debugger;
            next();
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }


    private async getRegister (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.query || !req.query.id) {
                throw new Error('illegal query');
            }
            const rv: { id: number, at: Date, value?: number, error?: any } [] = [];
            const ids = Array.isArray(req.query.id) ? req.query.id : [ req.query.id ];
            const value = +req.query.value;

            if (ids.length === 1 && value >= 0 && value <= 65535) {
                try {
                    const id = +ids[0];
                    const v = await Nibe1155.Instance.writeRegisterById(id, value);
                } catch (e) {
                    rv.push({ id: ids[0], at: new Date, error: e } );
                }
            }

            if (rv.length === 0) {
                for (const idString of ids) {
                    const id = +idString;
                    if (Number.isNaN(id) || id < 0 || id > 65535) { throw new Error('illegal id ' + id); }
                    try {
                        const v = await Nibe1155.Instance.readRegisterById(id);
                        rv.push( { id: id, at: v.responseAt, value: v.response.u16At(3) } );
                    } catch (err) {
                        rv.push({ id: id, at: new Date, error: err } );
                    }
                }
            }

            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    private async getStatus (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const rv: any = {};
            try {
                rv.heatpump = HeatPump.getInstance().toObject();
            } catch (err) {}
            try {
                rv.nibe1155 = Nibe1155.Instance.toExtendedNibe1155ValuesObject();
            } catch (err) {}
            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }


    private postMode (req: express.Request, res: express.Response, next: express.NextFunction) {
        this.postModeAsync(req, res, next)
            .catch( error => debug.warn('postModeAsync() fails\n%e', error) );
    }

    private async postModeAsync (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const body: { controller: IHeatPumpControllerConfig, pin: string } = req.body;
            if (body.pin && !Server.getInstance().isPinOK(body.pin)) { throw new AuthenticationError('missing/invalid PIN'); }
            try {
                const rv = await HeatPump.getInstance().setDesiredMode(body.controller);
                debug.fine('%s %s %s%s %o -> response: %o', req.method, req.hostname, req.baseUrl, req.url, body, rv);
                res.json(rv);
            } catch (err) {
                throw new BadRequestError('cannot set mode', err);
            }
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    private postHomeControl (req: express.Request, res: express.Response, next: express.NextFunction) {
        this.postHomeControlAsync(req, res, next)
            .catch( error => debug.warn('postModeAsync() fails\n%e', error) );
    }

    private async postHomeControlAsync (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const body: { monitorRecord?: IHomeControlData, pin?: string } = req.body;
            if (body.pin && !Server.getInstance().isPinOK(body.pin)) { throw new AuthenticationError('missing/invalid PIN'); }
            try {
                res.json({});
            } catch (err) {
                throw new BadRequestError('cannot handle home-control', err);
            }
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }


}
