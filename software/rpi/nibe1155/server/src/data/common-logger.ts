import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('common-class');


export class CommonLogger {

    public static info (src: any, msg: string) {
        debug.info(msg);
    }

    public static warn (src: any, msg: string, cause?: any) {
        if (msg && cause instanceof Error) {
            debug.warn('%s\n%e', msg, cause);
        } else if (msg) {
            debug.warn(msg);
        } else if (cause instanceof Error) {
            debug.warn('%e', cause);
        } else {
            debug.warn(src);
        }
    }

}
