import fs from 'fs';
import path from 'path';
import url from 'url';

export interface LanguageObject {
    [key: string]: string
}

export class Language {
    public readonly langCode: string;

    protected langObject: LanguageObject | undefined;

    constructor(langCode: string) {
        this.langCode = langCode;

        this.loadLang();
    }

    public translate(key: string, ...originalArgs: any[]): string {
        const args: string[] = originalArgs.filter((arg: any): boolean => arg.toString as boolean).map((arg: any): string => arg.toString());  // Convert all arguments (that can be) to strings.
        if (this.langObject && (key in this.langObject)) {
            let translated: string = this.langObject[key];
            for (const [index, arg] of Object.entries(args)) {
                const re: RegExp = new RegExp(`((?=[^\\\\])|^)\\{${index}\\}`, 'g');
                translated = translated.replace(re, (match: string, p1: string): string => `${p1}${arg}`);
            }
            return translated;
        } else {
            return `${key}${args.join(' ')}`;
        }
    }

    private loadLang(): void {
        const target: string = path.join(path.dirname(url.fileURLToPath(import.meta.url)), `${this.langCode}.json`);
        try {
            this.langObject = JSON.parse(fs.readFileSync(target).toString());
        } catch (e) {
            if ((e as any).code === 'ENOENT') throw new Error(`Invalid language code (${this.langCode})!`);
            else throw e;
        }
    }
}

export function getLang(langCode: string): Language {
    return new Language(langCode);
}
