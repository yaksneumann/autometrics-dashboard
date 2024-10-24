import { Component, input, effect, computed, Signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, ChartData } from 'chart.js';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent {
  chartData = input.required<ChartData>({});
  chartType = input.required<ChartType>();
}
