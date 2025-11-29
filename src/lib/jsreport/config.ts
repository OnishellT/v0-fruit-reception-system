import type { Config } from 'jsreport-core';

export const jsreportConfig: Partial<Config> = {
    extensions: {
        'chrome-pdf': {
            launchOptions: {
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        },
        'studio': {
            // Enable studio in development only
            enabled: process.env.NODE_ENV !== 'production'
        }
    },
    // Store templates in filesystem
    store: {
        provider: 'fs'
    },
    // Template location
    rootDirectory: process.cwd() + '/jsreport-templates',
    // Disable auto-cleanup for better performance
    autoTempCleanup: false,
    // Template engine settings
    templatingEngines: {
        strategy: 'in-process'
    },
    // Logging
    logger: {
        silent: process.env.NODE_ENV === 'production'
    }
};
