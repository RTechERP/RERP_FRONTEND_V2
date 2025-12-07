declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export = pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: any;
  export = pdfFonts;
}

declare module '/src/app/shared/pdf/vfs_fonts_custom.js' {
  const pdfFontCustoms: any;
  export = pdfFontCustoms;
}
