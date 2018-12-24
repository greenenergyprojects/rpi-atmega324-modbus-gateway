import { IUserAuth } from './user';

export interface IServerVersion {
    name: string;
    version: string;
    user?: IUserAuth;
}
