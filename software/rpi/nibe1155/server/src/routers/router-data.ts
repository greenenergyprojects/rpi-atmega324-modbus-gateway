
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterData');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';
import { Statistics } from '../statistics';



export class RouterData {

    public static get Instance(): express.Router {
        if (!this._instance) {
            this._instance = new RouterData;
        }
        return this._instance._router;
    }

    private static _instance: RouterData;

    // ******************************************************

    private _router: express.Router;

    private constructor () {
        this._router = express.Router();
        this._router.get('/monitor', (req, res, next) => this.getMonitorJson(req, res, next));
        // this._router.get('/*', (req, res, next) => this.getAll(req, res, next));

    }

    private async getAll (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            res.send('OK');
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    // private async getFroniusMeterJson (req: express.Request, res: express.Response, next: express.NextFunction) {
    //     try {
    //         const fd = FroniusMeter.getInstance(req.query.address ? req.query.address : 1);
    //         let rv: any;
    //         if (!fd) {
    //             rv = { error: 'device not found' };
    //         } else {
    //             rv = fd.toValuesObject();
    //         }
    //         debug.fine('query %o -> response: %o', req.query, rv);
    //         res.json(rv);
    //     } catch (err) {
    //         handleError(err, req, res, next, debug);
    //     }
    // }




    private async getMonitorJson (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const statistics = Statistics.Instance;
            const rv: any [] = [];
            if (req.query.latest !== undefined || Object.keys(req.query).length === 0) {
                const d = statistics.latest;
                if (d) {
                    rv.push(d !== undefined ? d : {});
                }
            }
            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}
