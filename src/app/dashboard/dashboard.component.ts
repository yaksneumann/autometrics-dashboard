import { Component, signal, computed } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { DUMMY_METRICS } from '../dummy-metrics';
import { BaseChartDirective } from 'ng2-charts';
import { ChartComponent } from './chart/chart.component';
import { CardsComponent } from './cards/cards.component';
import type { Metric, MetricSummary } from './metric.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgbDatepickerModule, BaseChartDirective, ChartComponent, CardsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  metrics = DUMMY_METRICS;
  filterdMetrics = signal<Metric[]>(this.metrics);
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate;
  toDate: NgbDate | null;
  minDate: NgbDate;
  maxDate: NgbDate;
  chartLabels: string[] = [];

  cvrChart = this.createChart('Conversion Rate (%) CVR');
  ctrChart = this.createChart('Click-Through Rate (%) CTR');
  cpcChart = this.createChart('Cost Per Click CPC', '#FF8C4B');

  constructor() {
    const { fromDate, toDate } = this.getDatesFromData();
    this.fromDate = this.minDate = fromDate;
    this.toDate = this.maxDate = toDate;
    this.updateChart();
  }

  createChart(label: string, backgroundColor = '#3360FF') {
    return {
      labels: this.chartLabels,
      datasets: [
        {
          label,
          data: [] as number[],
          backgroundColor,
          borderColor: '#061548',
          borderWidth: 2,
        },
      ],
    };
  }

  getDatesFromData(): { fromDate: NgbDate, toDate: NgbDate } {
    const [first, last] = [
      new Date(this.metrics[0].timestamp),
      new Date(this.metrics[this.metrics.length - 1].timestamp)
    ];
    return {
      fromDate: new NgbDate(first.getFullYear(), first.getMonth() + 1, first.getDate()),
      toDate: new NgbDate(last.getFullYear(), last.getMonth() + 1, last.getDate())
    };
  }

  metricsSummary = computed<MetricSummary>(() => {
    return this.filterdMetrics().reduce(
      (sum, item) => ({
        totalImpressions: sum.totalImpressions + item.impressions,
        totalClicks: sum.totalClicks + item.clicks,
        totalCost: sum.totalCost + item.cost,
        totalConversions: sum.totalConversions + item.conversions,
      }),
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalConversions: 0,
      }
    );
  });

  isDisabled = (date: NgbDate) => date.before(this.minDate) || date.after(this.maxDate);

  isHovered = (date: NgbDate) => this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);

  isInside = (date: NgbDate) => this.toDate && date.after(this.fromDate) && date.before(this.toDate);

  isRange = (date: NgbDate) => date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (
      this.fromDate &&
      !this.toDate &&
      date &&
      date.after(this.fromDate)
    ) {
      this.toDate = date;
      //show data for chosen dates
      const filterd = this.metrics.filter((metric) => {
        const [date] = metric.timestamp.split(' ');
        const [year, month, day] = date.split('-').map(Number);
        const metricDate = new NgbDate(year, month, day);
        return (
          metricDate.equals(this.fromDate) ||
          (metricDate.after(this.fromDate) &&
            (metricDate.equals(this.toDate) || metricDate.before(this.toDate)))
        );
      });
      this.filterdMetrics.set(filterd);
      this.updateChart();
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  updateChart() {
    this.chartLabels = [];
    const clicks: number[] = [];
    const conversions: number[] = [];
    const cost: number[] = [];
    const impressions: number[] = [];

    this.filterdMetrics().forEach(({ timestamp, clicks: c, conversions: conv, cost: cos, impressions: imp }) => {
      const date = new Date(timestamp).toLocaleString('en-US', { month: 'long', day: 'numeric' });
      this.chartLabels.push(date);
      clicks.push(c);
      conversions.push(conv);
      cost.push(cos);
      impressions.push(imp);
    });
  
    const metrics = this.calculateMetrics(clicks, impressions, conversions);

    this.cvrChart = {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Conversion Rate (%) CVR',
          data: metrics.cvr,
          backgroundColor: '#3360FF',
          borderColor: '#061548',
          borderWidth: 2,
        },
      ],
    };

    this.cpcChart = {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Cost Per Click CPC',
          data: this.calculateCPC(cost, clicks),
          backgroundColor: '#FF8C4B',
          borderColor: '#061548',
          borderWidth: 2,
        },
      ],
    };

    this.ctrChart = {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Click-Through Rate (%) CTR',
          data: metrics.ctr,
          backgroundColor: '#3360FF',
          borderColor: '#061548',
          borderWidth: 2,
        },
      ],
    };
  }

  calculateCPC(sum1: number[], clicks: number[]): number[] {
    return sum1.map((cost, index) => cost / clicks[index]);
  }

  calculateMetrics(
    clicks: number[],
    impressions: number[],
    conversions: number[]
  ): { ctr: number[]; cvr: number[] } {
    const ctr = clicks.map(
      (click, index) => (click / impressions[index]) * 100
    );
    const cvr = conversions.map(
      (conversion, index) => (conversion / clicks[index]) * 100
    );
    return { ctr, cvr };
  }
}
