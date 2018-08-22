
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterNibe');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';
import { Nibe1155 } from '../devices/nibe1155';
import { Nibe1155Modbus } from '../devices/nibe1155-modbus';
import { HeatPump } from '../devices/heat-pump';


export class RouterNibe {

    public static get Instance(): express.Router {
        if (!this._instance) {
            this._instance = new RouterNibe;
        }
        return this._instance._router;
    }

    private static _instance: RouterNibe;

    // ******************************************************

    private _router: express.Router;

    private constructor () {
        this._router = express.Router();
        this._router.get('/register', (req, res, next) => this.getRegister(req, res, next));
        this._router.get('/status', (req, res, next) => this.getStatus(req, res, next));
        // this._router.get('/*', (req, res, next) => this.getAll(req, res, next));

    }

    private async getAll (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            res.send('OK');
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
            rv.heatpump = HeatPump.Instance.toObject();
            rv.nibe1155 = Nibe1155.Instance.toExtendedNibe1155ValuesObject();
            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}