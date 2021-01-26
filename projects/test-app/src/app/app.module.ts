import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SimplUploaderModule } from '@streameye/simpl-uploader';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SimplUploaderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
