let hostname = window.location.origin; //"https://localhost:44365/"
if (window.location.hostname === 'localhost') //néu chạy từ localhost
  hostname = 'http://10.20.29.65:8088'; //lấy từ server test

export const environment = {
  production: true,
  apiKey:
    "RTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keYRTC%$#tEch~`'3keY",
  host: hostname + '/rerpapi/',
  hostwebold: hostname.replace(window.location.port,'8081'),
};
