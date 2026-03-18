import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  images = [
    'https://picsum.photos/500/700',
    'https://picsum.photos/500/600',
    'https://picsum.photos/500/800',
    'https://picsum.photos/500/650',
    'https://picsum.photos/500/750',
    'https://picsum.photos/500/720',
    'https://picsum.photos/500/680',
    'https://picsum.photos/500/820',
  ];

  @ViewChild('filterScroll', { static: true })
  filterScroll!: ElementRef<HTMLDivElement>;

  private isScrolling = false;

  scroll(direction: number) {
    if (this.isScrolling) return;

    const el = this.filterScroll.nativeElement;
    const start = el.scrollLeft;
    const distance = 180 * direction;
    const duration = 450;
    let startTime: number | null = null;

    this.isScrolling = true;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      el.scrollLeft = start + distance * easeOutCubic(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isScrolling = false;
      }
    };

    requestAnimationFrame(animate);
  }
}
