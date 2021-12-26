import fs from 'fs';
import luxon from 'luxon';
import * as i18n from './i18n';
import config from './config.json';

/*

VERBOSITY LEVELS:
1: non-fatal errors, warnings, important info
2: info (typically shown in console)
3: detailed info (typically shown in logs)

*/

interface Stringlike {
    toString(): string
}

const lang: i18n.Language = i18n.getLang(config.logging.lang);
const verbositySetting: number = Number(process.env.LOGGING_VERBOSITY ?? 2);
const fileVerbositySetting: number = Number(process.env.LOGGING_FILE_VERBOSITY ?? 3);

if (!fs.existsSync(config.logging.logFolder)) fs.mkdirSync(config.logging.logFolder);
const logFile: fs.WriteStream = fs.createWriteStream(`${config.logging.logFolder}/${luxon.DateTime.now().setZone('utc').toISO().replace(/:/g, '-')}.log`);

let lastFileChar: string = '\n';

export async function logRaw(data: Stringlike, verbosity: number): Promise<void> {
    if (verbositySetting >= verbosity) {
        process.stdout.write(data.toString());
    }

    if (fileVerbositySetting >= verbosity) {
        let fileData: string;
        if (lastFileChar === '\n') {
            const now: luxon.DateTime = luxon.DateTime.now().setZone('utc');
            fileData = `[${now.toISO()}] ${data.toString()}`;
        } else fileData = data.toString();

        return new Promise((res) => logFile.write(fileData, (): void => {  // eslint-disable-line @typescript-eslint/typedef
            [lastFileChar] = fileData.slice(-1);
            res();
        }));
    } else {
        return Promise.resolve();
    }
}

export async function log(verbosity: number, langKey: string, ...args: any[]): Promise<void> {
    const outText: string = lang.translate(langKey, ...args);
    return logRaw(outText, verbosity);
}

export async function logLine(verbosity: number, langKey: string, ...args: any[]): Promise<void> {
    const outText: string = lang.translate(langKey, ...args);
    return logRaw(`${outText}\n`, verbosity);
}

export async function debug(data: any): Promise<void> {
    const outText: string = `DEBUG: ${JSON.stringify(data)}`;
    process.stdout.write(outText);

    let fileData: string;
    if (lastFileChar === '\n') {
        const now: luxon.DateTime = luxon.DateTime.now().setZone('utc');
        fileData = `[${now.toISO()}] ${outText}`;
    } else fileData = outText;

    return new Promise((res) => logFile.write(fileData, (): void => {  // eslint-disable-line @typescript-eslint/typedef
        lastFileChar = fileData.slice(-1);
        res();
    }));
}

export async function debugLine(data: any): Promise<void> {
    const outText: string = `DEBUG: ${JSON.stringify(data)}\n`;
    process.stdout.write(outText);

    let fileData: string;
    if (lastFileChar === '\n') {
        const now: luxon.DateTime = luxon.DateTime.now().setZone('utc');
        fileData = `[${now.toISO()}] ${outText}`;
    } else fileData = outText;

    return new Promise((res) => logFile.write(fileData, (): void => {  // eslint-disable-line @typescript-eslint/typedef
        [lastFileChar] = fileData.slice(-1);
        res();
    }));
}

export async function error(err: Stringlike): Promise<void> {
    const outText: string = `${err.toString()}\n`;

    if (verbositySetting >= 1) {
        process.stderr.write(outText);
    }

    if (fileVerbositySetting >= 1) {
        let fileData: string;
        if (lastFileChar === '\n') {
            const now: luxon.DateTime = luxon.DateTime.now().setZone('utc');
            fileData = `[${now.toISO()}] ${err.toString()}`;
        } else fileData = err.toString();

        return new Promise((res) => logFile.write(fileData, (): void => {  // eslint-disable-line @typescript-eslint/typedef
            [lastFileChar] = fileData.slice(-1);
            res();
        }));
    } else {
        return Promise.resolve();
    }
}
