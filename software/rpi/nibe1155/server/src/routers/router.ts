import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('routers:Router');

import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import { handleError, RouterError, BadRequestError, AuthenticationError } from './router-error';




export class Router {

    public static getInstance(): express.Router {
        if (!this._instance) {
            this._instance = new Router;
        }
        return this._instance._router;
    }

    private static _instance: Router;

    // ******************************************************

    private _router: express.Router;

    private constructor () {
        this._router = express.Router();
        this._router.get('/test', (req, res, next) => this.getTest(req, res, next));
    }

    private async getTest (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            res.json({ test: 'xxx' });
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}
