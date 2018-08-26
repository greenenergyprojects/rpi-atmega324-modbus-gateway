import { INibe1155Value } from '../devices/nibe1155-value';

export interface INibe1155Values {
    controller?: {
        createdAt: Date;
        state: string;
        running: boolean;
        desiredState?: string;
        inProgressSince?: Date;
        setPointTemp?: number;
        fSetpoint?: number;
    };
    completeValues?: { [id: string ]: INibe1155Value };
    simpleValues?: { [id: string ]: { rawValue: number; rawValueAt: number } };
    logsetIds?: number [];
}
