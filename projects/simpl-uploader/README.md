# SimplUploader

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.9.

## The purpose

The purpose of the library is to provide a very simple interface for reporting upload progress when uploading files to a server. It is based on RxJS streams and is quite extensible. It is also a learn while doing project :) inspired by some marvelous RxJS tutorials on Egghead.

It is currently being used internally in our platform. The plan is to extend the library for public use by adding few more features, but to keep it significantly lighter and simpler than other libraries doing the same.

Contributions and ideas are very welcome!

## The plan

There are few things planned to be added in near future
- Documentation and examples,
- Click to upload, instead of only drag-n-drop,
- Continuous total progress report, instead of on completed upload,
- JWT token authentication for use with servers that are public.
- Unit tests?

## Whats inside

GIT repo contains the library as well as a testing app showcasing the current features *(to be documented)*. There is also a very simple node backend to test the uploads. After `npm i` in the `/backend` folder, just run `node server.js` to start the server on port 9999.
