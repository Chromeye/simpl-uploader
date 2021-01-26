import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SimplUploaderDirective } from './simpl-uploader.directive';



@NgModule({
  declarations: [SimplUploaderDirective],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  exports: [SimplUploaderDirective]
})
export class SimplUploaderModule { }
