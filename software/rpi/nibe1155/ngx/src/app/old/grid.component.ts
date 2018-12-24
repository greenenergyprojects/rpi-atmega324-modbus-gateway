import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { DataService } from '../services/data.service';
import { IFroniusMeterValues } from '../data/common/fronius-meter/fronius-meter-values';
import { BaseChartDirective } from 'ng4-charts';

@Component({
    selector: 'app-grid',
    templateUrl: 'grid.component.html'
    // template: `
    // <h1>{{title}}</h1>
    // `
})
export class GridComponent implements OnInit, OnDestroy {
    @ViewChild(BaseChartDirective)
    public chart: BaseChartDirective;

    public barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true
    };

    // public barChartLabels: string [] = ['-10', '', '', '', '', '', '0'];
    public barChartLabels: string [] = [];
    public barChartType = 'bar';
    public barChartLegend = true;

    public barChartData: IBarChartData [] = [
        { data: [], label: 'P1' },
        { data: [], label: 'P2' },
        { data: [], label: 'P3' },
        { data: [], label: 'P', type: 'line' },
    ];

    public chartColors: any [] = [
        { backgroundColor: Array(60).fill('#FF0000') },
        { backgroundColor: Array(60).fill('#00A000') },
        { backgroundColor: Array(60).fill('#4040FF') },
        { backgroundColor: 'rgba(0,0,0,0)', borderColor: '#000000', pointBorderColor: '#000', pointBackgroundColor: '#000' }
    ];


    private _froniusMeterValuesSubsciption: Subscription;

    public constructor (private dataService: DataService) {
        for (let i = 0; i < 60; i++) {
            this.barChartLabels.push( (i % 10) === 0 ? (i - 60) + 's' : '');
        }
    }

    public ngOnInit () {
        for (let i = 0; i < 60; i++) {
            for (let j = 0; j < this.barChartData.length; j++) {
                this.barChartData[j].data.push(null);
            }
        }
        const values = this.dataService.getFroniusMeterValues();
        for (const v of values) {
            this.barChartData[0].data.push(v.activePowerL1);
            this.barChartData[1].data.push(v.activePowerL2);
            this.barChartData[2].data.push(v.activePowerL3);
            this.barChartData[3].data.push(v.activePower);
            if (this.barChartData[0].data.length >  this.barChartLabels.length) {
                for (let j = 0; j < this.barChartData.length; j++) {
                    this.barChartData[j].data.splice(0, 1);
                }
            }
        }

        this._froniusMeterValuesSubsciption =
            this.dataService.froniusMeterObservable.subscribe((value) => this.handleFroniusMeterValues(value));
    }

    public ngOnDestroy() {
        this._froniusMeterValuesSubsciption.unsubscribe();
        this._froniusMeterValuesSubsciption = null;
    }

    // events
    public chartClicked(e: any): void {
        console.log(e);
    }

    public chartHovered(e: any): void {
        console.log(e);
    }

    public clear(): void {
        this.barChartData = [
            { data: [], label: 'P1' },
            { data: [], label: 'P2' },
            { data: [], label: 'P3' }
        ];
    }

    private handleFroniusMeterValues (v: IFroniusMeterValues) {
        // this.barChartLabels.push('');
        // this.barChartData[0].data.push(v.activePowerL1);
        // this.barChartData[1].data.push(v.activePowerL2);
        // this.barChartData[2].data.push(v.activePowerL3);
        // const newBarChartData: IBarChartData [] = [
        //     this.barChartData[0], this.barChartData[1], this.barChartData[2]
        // ];
        // this.barChartData = newBarChartData;
        this.barChartData[0].data.push(v.activePowerL1);
        this.barChartData[1].data.push(v.activePowerL2);
        this.barChartData[2].data.push(v.activePowerL3);
        this.barChartData[3].data.push(v.activePower);
        if (this.barChartData[0].data.length >  this.barChartLabels.length) {
            this.barChartData[0].data.splice(0, 1);
            this.barChartData[1].data.splice(0, 1);
            this.barChartData[2].data.splice(0, 1);
            this.barChartData[3].data.splice(0, 1);
        }
        this.chart.chart.update();
    }
}

interface IBarChartData {
    data: number [];
    label: string;
    type?: string;
}
