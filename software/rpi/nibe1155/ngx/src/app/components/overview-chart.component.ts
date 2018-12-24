import { Component, OnInit, OnDestroy, ViewChild, HostListener, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { BaseChartDirective } from 'ng4-charts';
import { DataService } from '../services/data.service';
import { IMonitorRecordData, MonitorRecord } from '../data/common/monitor-record';
import { INibe1155Value, Nibe1155Value } from '../data/common/nibe1155/nibe1155-values';
import { sprintf } from 'sprintf-js';

@Component({
    selector: 'app-overview-chart',
    templateUrl: 'overview-chart.component.html',
    styles: [ ``]
})
export class OverviewChartComponent implements OnInit, OnDestroy {

    @ViewChild(BaseChartDirective)
    public chart: BaseChartDirective;

    @ViewChild('container') container: ElementRef;

    public chartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true
    };

    // public barChartLabels: string [] = ['-10', '', '', '', '', '', '0'];
    public chartLabels: string [] = [];
    public chartType = 'line';
    public chartLegend = true;

    public chartData: IBarChartData [] = [
        { data: [], label: 'Netz' },
        { data: [], label: 'Speicher' },
        { data: [], label: 'PV' },
        { data: [], label: 'Verbrauch', type: 'line' },
        { data: [], label: 'Heizung', type: 'line' },
    ];

    public chartColors: any [] = [
        { backgroundColor: 'rgba(0,0,0,0.0)', borderColor: '#000000', pointRadius: 0 },
        { backgroundColor: 'rgba(0,0,0,0.0)', borderColor: '#0000ff', pointRadius: 0 },
        { backgroundColor: 'rgba(0,0,0,0.0)', borderColor: '#00ff00', pointRadius: 0 },
        { backgroundColor: 'rgba(0,0,0,0.0)', borderColor: '#ff0000', pointRadius: 0 },
        { backgroundColor: 'rgba(0,0,0,0.0)', borderColor: '#8b4513', pointRadius: 0 }
    ];

    public showValues: { key: string, value: string, br?: boolean } [] = [];

    private _monitorValuesSubsciption: Subscription;
    // public innerWidth: any;
    // public innerHeight: any;

    constructor (private dataService: DataService) {
        for (let i = 0; i < 60; i++) {
            this.chartLabels.push( (i % 10) === 0 ? (i - 60) + 's' : '');
        }
    }

    public ngOnInit () {
        for (let i = 0; i < 60; i++) {
            for (let j = 0; j < this.chartData.length; j++) {
                this.chartData[j].data.push(null);
            }
        }
        this._monitorValuesSubsciption =
            this.dataService.monitorObservable.subscribe((value) => this.handleMonitorValues(value));
        // this.innerWidth = this.container.nativeElement.offsetWidth;
        // this.innerHeight = this.container.nativeElement.offsetHeight;
        // console.log('window: ' + this.innerWidth + ' x ' + this.innerHeight);
    }

    public ngOnDestroy() {
        this._monitorValuesSubsciption.unsubscribe();
        this._monitorValuesSubsciption = null;
    }

    // @HostListener('window:resize', ['$event'])
    // onResize (event) {
    //     this.innerWidth = this.container.nativeElement.offsetWidth;
    //     this.innerHeight = this.container.nativeElement.offsetHeight;
    //     console.log('window: ', this.container.nativeElement);
    // }



    public chartClicked(e: any): void {
        // console.log(e);
    }

    public chartHovered(e: any): void {
        // console.log(e);
    }


    private getValue (x: any): number {
        if (typeof(x) === 'number' && !Number.isNaN(x)) {
            return x;
        }
        return null;
    }

    private checkWidth (...elements: IShowValueItem []): IShowValueItem [] {
        try {
            let w = 0;
            for (const e of elements) {
                w += e.width + 2.5 * 16; // 2em rigth + 0.em left
            }
            if (w > this.container.nativeElement.offsetWidth) {
                for (const e of elements) {
                    e.br = true;
                }
            }
            return elements;
        } catch (err) {
            console.log(err);
            return elements;
        }
    }

    private handleMonitorValues (v: MonitorRecord) {
        const n = this.dataService.nibe1155;
        if (!v) {
            this.chartData[0].data.push(null);
            this.chartData[1].data.push(null);
            this.chartData[2].data.push(null);
            this.chartData[3].data.push(null);
            this.chartData[4].data.push(null);
        } else {
            this.chartData[0].data.push(v.gridActivePower);
            this.chartData[1].data.push(v.storagePower);
            this.chartData[2].data.push(v.pvActivePower);
            const heatPumpPower = !n ? 0.0 :
                n.values[43084].value + // electricHeaterPower
                n.values[43141].value + // copressorInPower
                n.values[43437].value / 100 * 30 + // supplyPumpSpeed
                n.values[43439].value / 100 * 30; // brinePumpSpeed
            if (typeof(heatPumpPower) === 'number' && !Number.isNaN(heatPumpPower)) {
                this.chartData[3].data.push(-v.loadActivePower + heatPumpPower);
                this.chartData[4].data.push(-heatPumpPower);
            } else {
                this.chartData[3].data.push(-v.loadActivePower);
                this.chartData[4].data.push(null);
            }

        }
        if (this.chartData[0].data.length >  this.chartLabels.length) {
            for (let j = 0; j < this.chartData.length; j++) {
                this.chartData[j].data.splice(0, 1);
            }
        }
        this.chart.chart.update();


        this.showValues = [];
        // const invExt = v.data.inverterExtension.toHumanReadableObject();
        // const inv = v.data.inverter.toHumanReadableObject();
        // this.showValues.push({ key: 'string1_P', value: invExt['string1_Power'] });
        // this.showValues.push({ key: 'string2_P', value: invExt['string2_Power'] });
        // this.showValues.push({ key: 'dcPower', value: inv['dcPower'] });
        if (v) {
            // {
            //     const size: IShowValueItem = {
            //         key: 'Size',
            //         width: 120,
            //         value: this.container.nativeElement.offsetWidth,
            //         br: true
            //     };
            //     this.showValues.push(size);
            // }
            // first line - photovoltaik overview
            {
                const ps = this.getValue(v.data.inverterExtension.string1_Power);
                const es = this.getValue(v.data.calculated.pvSouthEnergyDaily);
                const esSite = this.getValue(v.data.froniusRegister.siteEnergyDay);
                let pew = null;
                let eew = null;
                let ppv = ps;
                let epv = es;
                if (Array.isArray(v.data.extPvMeter) && v.data.extPvMeter.length === 1) {
                    pew = this.getValue(v.data.extPvMeter[0].p);
                    eew = this.getValue(v.data.extPvMeter[0].de1);
                    ppv = ps + pew;
                    epv = es + eew;
                }

                const pv: IShowValueItem = {
                    key: 'PV',
                    width: 140,
                    value: (ppv !== null ? sprintf('%.0fW', ppv) : '?W') + ' / ' +
                           (epv !== null ? sprintf('%.02fkWh', epv / 1000) : '?kWh')
                };
                const pvS: IShowValueItem = {
                    key: 'PV-Süd',
                    width: 250,
                    value: (ps !== null ? sprintf('%.0fW', ps) : '?W') + ' / ' +
                           (es !== null ? sprintf('%.02fkWh', es / 1000) : '?kWh') + '(' +
                           (esSite !== null ? sprintf('%.02fkWh', esSite / 1000) : '?kWh') + ')'
                };
                const pvEW: IShowValueItem = {
                    key: 'PV-Ost/West',
                    width: 220,
                    value: (pew !== null ? sprintf('%.0fW', pew) : '?W') + ' / ' +
                           (eew !== null ? sprintf('%.02fkWh', eew / 1000) : '?kWh'),
                    br: true
                };
                this.showValues = this.showValues.concat(this.checkWidth(pv, pvS, pvEW));
            }
            // second line - grid/battery power/energy overview
            {
                const p = this.getValue(v.data.meter.activePower);
                const eIn = this.getValue(v.data.calculated.eInDaily);
                const eOut = this.getValue(v.data.calculated.eOutDaily);

                const gridPower: IShowValueItem = {
                    key: 'P-Netz',
                    width: 110,
                    value: (p !== null ? sprintf('%.0fW', p) : '?W')
                };
                const gridEnergyDay: IShowValueItem = {
                    key: 'E(tag)',
                    width: 250,
                    value: 'in=' + (eIn !== null ? sprintf('%.01fkWh', eIn / 1000) : '?kWh') + ' / ' +
                           'out=' + (eOut !== null ? sprintf('%.01fkWh', eOut / 1000) : '?kWh')
                };

                const cap = this.getValue(v.data.nameplate.nominalStorageEnergy * v.data.storage.chargeLevelInPercent / 100);
                const pct = this.getValue(v.data.storage.chargeLevelInPercent);
                const state = v.data.storage.chargeState;

                const battery: IShowValueItem = {
                    key: 'Speicher',
                    width: 280,
                    value: (pct !== null ? sprintf('%.0f%%', pct) : '?%') + ' / ' +
                           (cap !== null ? sprintf('%.02fkWh', cap / 1000) : '?kWh') + ' (' + state + ')',
                    br: n ? true : false
                };
                this.showValues = this.showValues.concat(this.checkWidth(gridPower, gridEnergyDay, battery));
            }

            if (n) {
                const pBoiler = v.boilerPower;
                let nv: Nibe1155Value;
                nv = n.values[43136]; const compressorFrequency = nv && nv.valueAt ? nv.value : null;
                nv = n.values[43141]; const compressorInPower   = nv && nv.valueAt ? nv.value : null;
                nv = n.values[43439]; const brinePumpSpeed      = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40016]; const brineOutTemp        = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40015]; const brineInTemp        = nv && nv.valueAt ? nv.value : null;
                nv = n.values[43437]; const supplyPumpSpeed     = nv && nv.valueAt ? nv.value : null;
                nv = n.values[43084]; const electricHeaterPower = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40017]; const condenserOutTemp    = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40071]; const supplyTemp          = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40008]; const supplyFeedTemp   = nv && nv.valueAt ? nv.value : null;
                nv = n.values[40012]; const supplyReturnTemp    = nv && nv.valueAt ? nv.value : null;
                const p = (electricHeaterPower !== null ? electricHeaterPower : 0) + (compressorInPower !== null ? compressorInPower : 0);

                const heating1: IShowValueItem = {
                    key: 'P-Boiler',
                    width: 100,
                    value: sprintf('%.0fW', pBoiler)
                };
                const heating2: IShowValueItem = {
                    key: 'P-Heizung',
                    width: 140,
                    value: sprintf('%.0fW', p)
                };
                const heating3: IShowValueItem = {
                    key: 't-Puffer',
                    width: 130,
                    value: (supplyTemp !== null ? sprintf('%.01f°C', supplyTemp) : '?°C')
                };
                if (brinePumpSpeed > 0) {
                    const brine: IShowValueItem = {
                        key: 't-Sole',
                        width: 220,
                        value: 'in=' + (brineInTemp !== null ? sprintf('%.01f°C', brineInTemp) : '?°C') + ' / ' +
                               'out=' + (brineOutTemp !== null ? sprintf('%.01f°C', brineOutTemp) : '?°C'),
                        br: true
                    };
                    this.showValues = this.showValues.concat(this.checkWidth(heating1, heating2, heating3, brine));

                } else {
                    heating3.br = true;
                    this.showValues = this.showValues.concat(this.checkWidth(heating1, heating2, heating3));
                }

                if (compressorFrequency === 0 && supplyPumpSpeed === 0 && brinePumpSpeed === 0) {
                    const heatPump1: IShowValueItem = {
                        key: 'W-Pumpe',
                        width: 100,
                        value: 'Aus',
                        br: true
                    };
                    this.showValues.push(heatPump1);
                } else {
                    const heatPump1: IShowValueItem = {
                        key: 'W-Pumpe',
                        width: 350,
                        value: 'f=' + (compressorFrequency !== null ? sprintf('%.01fHz', compressorFrequency) : '?Hz') + ' / ' +
                            'VL=' + (supplyFeedTemp !== null ? sprintf('%.01f°C', supplyFeedTemp) : '?°C') + ' / ' +
                            'RL=' + (supplyReturnTemp !== null ? sprintf('%.01f°C', supplyReturnTemp) : '?°C'),
                    };
                    const heatPump2: IShowValueItem = {
                        key: 'Pumpen',
                        width: 250,
                        value: 'Puffer=' + (supplyPumpSpeed !== null ? sprintf('%d%%', supplyPumpSpeed) : '?%') + ' / ' +
                            'Sole=' + (brinePumpSpeed !== null ? sprintf('%d%%', brinePumpSpeed) : '?'),
                    };
                    if (condenserOutTemp > 55.0) {
                        const heatPump3: IShowValueItem = {
                            key: 'Kond.',
                            width: 120,
                            value: sprintf('t=%.01f°C', condenserOutTemp),
                            br: true
                        };
                        this.showValues = this.showValues.concat(this.checkWidth(heatPump1, heatPump2, heatPump3));
                    } else {
                        heatPump2.br = true;
                        this.showValues = this.showValues.concat(this.checkWidth(heatPump1, heatPump2));
                    }
                }
            }
        }

    }

}

interface IShowValueItem {
    key: string;
    value: string;
    width: number;
    br?: boolean;
}

interface IBarChartData {
    data: number [];
    label: string;
    type?: string;
}
