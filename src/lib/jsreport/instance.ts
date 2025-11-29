import jsreport from 'jsreport-core';
import { jsreportConfig } from './config';

// Extensions
const chromePdf = require('jsreport-chrome-pdf');
const handlebars = require('jsreport-handlebars');
const xlsx = require('jsreport-xlsx');
const assets = require('jsreport-assets');
const fsStore = require('jsreport-fs-store');

let jsreportInstance: any = null;

export async function getJSReport() {
    if (jsreportInstance) {
        return jsreportInstance;
    }

    jsreportInstance = jsreport(jsreportConfig);

    // Register extensions
    jsreportInstance.use(chromePdf());
    jsreportInstance.use(handlebars());
    jsreportInstance.use(xlsx());
    jsreportInstance.use(assets());
    jsreportInstance.use(fsStore());

    // Enable studio in dev mode
    if (process.env.NODE_ENV !== 'production') {
        const studio = require('jsreport-studio');
        jsreportInstance.use(studio());
    }

    await jsreportInstance.init();

    console.log('✅ JSReport initialized');
    if (process.env.NODE_ENV !== 'production') {
        console.log('📝 JSReport Studio available at: http://localhost:5488');
    }

    return jsreportInstance;
}

export async function closeJSReport() {
    if (jsreportInstance) {
        await jsreportInstance.close();
        jsreportInstance = null;
        console.log('✅ JSReport closed');
    }
}
