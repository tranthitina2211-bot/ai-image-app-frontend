import { Component, OnInit } from '@angular/core';
import { MediaItem } from '@models/media.model';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  medias: MediaItem[] = [];
  stacks: any[] = [];


  openMedia(media: MediaItem) {
    console.log('open media', media);
  }

  openStack(stack: any) {
    console.log('open stack', stack);
  }


}
