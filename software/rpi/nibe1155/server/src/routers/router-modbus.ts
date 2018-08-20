
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:RouterModebus');


import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';



export class RouterModbus {

    public static get Instance(): express.Router {
        if (!this._instance) {
            this._instance = new RouterModbus;
        }
        return this._instance._router;
    }

    private static _instance: RouterModbus;

    // ******************************************************

    private _router: express.Router;

    private constructor () {
        this._router = express.Router();
        this._router.get('/register', (req, res, next) => this.getRegister(req, res, next));
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
            for (const id of ids) {
                if (id < 0 || id > 65535) { throw new Error('illegal id ' + id); }
                
                rv.push({ id: id, at: new Date, error: 'not implemented yet'} );
            }

            debug.fine('query %o -> response: %o', req.query, rv);
            res.json(rv);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}
