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
        const langValue: string | undefined = this.getLangValue(key);
        if (langValue) {
            return this.replaceArgs(langValue);
        } else {
            return `${key}${args.length > 0 ? `(${args.join(', ')})` : ''}`;
        }
    }

    private getLangValue(key: string): string | undefined {
        if (this.langObject) {
            const keyPath: string[] = key.split('.');
            const value: string = keyPath.reduce((p: any, c: string) => {
                if (p) return p[c];
                else return undefined;
            }, this.langObject);

            return value;
        } else return undefined;
    }

    private replaceArgs(langValue: string, ...anyArgs: any[]): string {
        const args: string[] = anyArgs.filter((arg: any): boolean => Boolean(arg.toString)).map((arg: any): string => arg.toString());  // Convert all arguments (that can be) to strings.

        const tokenized: {type: string, data: {[key: string]: any}}[] = [];
        const currentState: {[key: string]: any} = {
            escaping: false,
            argumentExpression: false,
            argumentExpressionContent: '',
            argumentExpressionNumber: 0,
            langExpression: false,
            langExpressionPrefix: false,
            langExpressionContent: '',
        };

        for (const char of langValue) {
            let escapeNext: boolean = false;
            if (char === '\\' && !currentState.escaping) {
                escapeNext = true;
            } else if (currentState.langExpression) {
                if (currentState.escaping) {
                    currentState.langExpressionContent += char;
                } else if (char === '}') {
                    currentState.langExpression = false;
                    tokenized.push({type: 'langExpression', data: {key: currentState.langExpressionContent}});
                    currentState.langExpressionContent = '';
                } else {
                    currentState.langExpressionContent += char;
                }
            } else if (currentState.langExpressionPrefix) {
                currentState.langExpressionPrefix = false;
                if (char === '{' && !currentState.escaping) currentState.langExpression = true;
            } else if (currentState.argumentExpression) {
                if (currentState.escaping) {
                    currentState.argumentExpressionContent += char;
                } else if (char === '}') {
                    currentState.argumentExpression = false;
                    const argumentExpressionContentNumber: number = Number(currentState.argumentExpressionContent);
                    if (!Number.isNaN(argumentExpressionContentNumber) && argumentExpressionContentNumber >= 0 && argumentExpressionContentNumber <= currentState.argumentExpressionNumber) {
                        tokenized.push({type: 'argumentExpression', data: {index: argumentExpressionContentNumber}});
                        currentState.argumentExpressionNumber += 1;
                    }
                    currentState.argumentExpressionContent = '';
                } else {
                    currentState.argumentExpressionContent += char;
                }
            } else if (char === '{' && !currentState.escaping) {
                currentState.argumentExpression = true;
            } else if (char === '$' && !currentState.escaping) {
                currentState.langExpressionPrefix = true;
            } else {
                tokenized.push({type: 'literal', data: {char}});
            }

            currentState.escaping = escapeNext;
        }

        let out: string = '';
        for (const token of tokenized) {
            switch (token.type) {
                case 'literal': {
                    out += token.data.char;

                    break;
                } case 'argumentExpression': {
                    if (token.data.index < args.length) {
                        out += args[token.data.index];
                    } else {
                        out += `{${token.data.index}}`;
                    }

                    break;
                } case 'langExpression': {
                    const langExpressionValue: string | undefined = this.getLangValue(token.data.key);
                    if (langExpressionValue) {
                        out += langExpressionValue;
                    } else {
                        out += `\${${token.data.key}}`;
                    }

                    break;
                } default: {
                    break;
                }
            }
        }

        return out;
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
