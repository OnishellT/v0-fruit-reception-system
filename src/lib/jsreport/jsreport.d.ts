// Type declarations for jsreport packages
declare module 'jsreport-core' {
    export interface Config {
        extensions?: Record<string, any>;
        store?: {
            provider: string;
            uri?: string;
        };
        rootDirectory?: string;
        autoTempCleanup?: boolean;
        templatingEngines?: {
            strategy: string;
        };
        logger?: {
            silent?: boolean;
        };
    }

    export default function jsreport(config?: Partial<Config>): any;
}

declare module 'jsreport-chrome-pdf' {
    export default function (): any;
}

declare module 'jsreport-handlebars' {
    export default function (): any;
}

declare module 'jsreport-xlsx' {
    export default function (): any;
}

declare module 'jsreport-assets' {
    export default function (): any;
}

declare module 'jsreport-fs-store' {
    export default function (): any;
}

declare module 'jsreport-studio' {
    export default function (): any;
}
