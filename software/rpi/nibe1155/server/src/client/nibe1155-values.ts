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

export interface IHeatpumpMode {
    createdAt: Date;
    desiredMode: string;
    currentMode?: string;
    pin?: string;
    fSetpoint?: number;
    fMin?: number;
    fMax?: number;
    tempSetpoint?: number;
    tempMin?: number;
    tempMax?: number;
}
