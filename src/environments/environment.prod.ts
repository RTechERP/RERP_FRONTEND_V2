let hostname = window.location.origin;
if (window.location.hostname === 'localhost')
  hostname = 'http://192.168.1.2:8088';

export const environment = {
  production: true,
  apiKey:
    "RTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keY",
  host: hostname + '/api/',
};
