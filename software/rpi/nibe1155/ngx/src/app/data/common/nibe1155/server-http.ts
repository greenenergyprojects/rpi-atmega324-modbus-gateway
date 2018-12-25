
import { INibe1155Value } from '../nibe1155/nibe1155-value';
import { INibe1155Controller } from '../nibe1155/nibe1155-controller';
import { INibe1155MonitorRecord } from '../nibe1155/nibe1155-monitor-record';

export interface IHttpGetDataMonitorQuery {
    id?: number | string;
    valueIds?: '*' | 'all' | 'none' | string | string[] | number | number [];
    completeValues?: boolean | 'true' | 'false';
    controller?: boolean | 'true' | 'false';
    logsetIds?: boolean | 'true' | 'false';
}

export interface IHttpGetDataMonitorResponse extends INibe1155MonitorRecord {
    id?: number | string;
}
