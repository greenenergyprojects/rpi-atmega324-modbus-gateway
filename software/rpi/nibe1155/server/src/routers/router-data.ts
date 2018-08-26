
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterData');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';
import { Statistics } from '../statistics';
import { INibe1155Values } from '../client/nibe1155-values';
import { HeatPump } from '../devices/heat-pump';
import { Nibe1155 } from '../devices/nibe1155';
import { Nibe1155Value } from '../devices/nibe1155-value';


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
            const ids: number [] = [];
            if (req.query.id !== undefined) {
                const strIds: string [] = Array.isArray(req.query.id) ? req.query.id : [ req.query.id ];
                for (const strId of strIds) {
                    const id = +strId;
                    if (id < 0 || id > 0xffff) {
                        throw new BadRequestError('invalid id');
                    }
                    ids.push(id);
                }
            }
            debugger;
            const n = Nibe1155.Instance;
            const rv: INibe1155Values = {
                controller: req.query.controller && req.query.controller === 'false' ? undefined : HeatPump.Instance.toObject(),
                // monitor: statistics.latest.toObject(),
                // others: {}
                simpleValues: req.query.simpleValues && req.query.simpleValues === 'false' ? undefined : {},
                completeValues: req.query.completeValues && req.query.completeValues === 'false' ? undefined : {},
                logsetIds: req.query.logsetIds && req.query.logsetIds === 'false' ? undefined : n.logsetIds
            };
            const values = n.values;
            for (const id in values) {
                if (!values.hasOwnProperty(id)) { continue; }
                const x = values[id];
                if (ids.length > 0 && !ids.find( (i) => i === x.id)) { continue; }
                if (!(x instanceof Nibe1155Value)) { continue; }
                if (rv.completeValues) {
                    rv.completeValues[id] = x.toObject();
                }
                if (rv.simpleValues) {
                    rv.simpleValues[id] = {
                        rawValue: x.rawValue,
                        rawValueAt: x.valueAt ? x.valueAt.getTime() : null
                    };
                }
            }
            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}
