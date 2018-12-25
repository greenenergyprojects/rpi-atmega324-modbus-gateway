
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterData');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';

import { HeatPump } from '../devices/heat-pump';
import { Nibe1155 } from '../devices/nibe1155';
import { Nibe1155Value } from '../data/common/nibe1155/nibe1155-value';
import { INibe1155MonitorRecord, Nibe1155MonitorRecord } from '../data/common/nibe1155/nibe1155-monitor-record';
import { Nibe1155ModbusIds, Nibe1155ModbusRegisters } from '../data/common/nibe1155/nibe1155-modbus-registers';

import * as serverHttp from '../data/common/nibe1155/server-http';

export class RouterData {

    public static getInstance(): express.Router {
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


    private async getMonitorJson (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const query: serverHttp.IHttpGetDataMonitorQuery = req.query;
            const ids: number [] = [];
            if (query.valueIds !== undefined || query.completeValues) {
                if (query.valueIds === '' || query.valueIds === 'none') {

                } else if (query.valueIds === '*' || query.valueIds === 'all' || query.completeValues) {
                    const idsString = Object.getOwnPropertyNames(Nibe1155ModbusRegisters.regDefById);
                    for (const strId of idsString) {
                        ids.push(+strId);
                    }
                } else {
                    const strIds: string [] = [];
                    if (!Array.isArray(query.valueIds)) {
                        strIds.push(query.valueIds.toString());
                    } else {
                        for (const x of query.valueIds) { strIds.push(x.toString()); }
                    }
                    for (const strId of strIds) {
                        const id = +strId;
                        if (id < 0 || id > 0xffff) {
                            throw new BadRequestError('invalid id');
                        }
                        ids.push(id);
                    }
                }
            }
            const n = Nibe1155.Instance;
            const values = n.values;
            // const rv: INibe1155MonitorRecord = { createdAt: Date.now() };
            const rv: serverHttp.IHttpGetDataMonitorResponse = { createdAt: Date.now() };
            if (query.id) { rv.id = query.id; }
            if (query.controller) { rv.controller = HeatPump.getInstance().toObject(); }
            if (query.logsetIds) { rv.logsetIds = n.logsetIds; }
            if (ids.length > 0) {
                rv.values = {};
                for (const id of ids) {
                    const v = values[id];
                    rv.values[<Nibe1155ModbusIds>id] = v instanceof Nibe1155Value ? v.toObject() : null;
                }
            }
            debug.fine('--> query %o -> response: %o', query, rv);
            debug.finer('query %o -> response: %o', query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}
