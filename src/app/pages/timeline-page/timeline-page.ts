import { Component } from '@angular/core';
import { Timeline } from '../../components/timeline/timeline';

@Component({
  selector: 'app-timeline-page',
  standalone: true,
  imports: [Timeline],
  templateUrl: './timeline-page.html',
  styleUrl: './timeline-page.scss'
})
export class TimelinePage {}