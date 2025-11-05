import fs from 'fs';
import path from 'path';


export function loadTemplate(templateName: string): string {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf-8');
}

export function renderOTPTemplate(code: string, purpose: string, formattedTime: string, formattedDate: string): string{
    const template = loadTemplate('otp-template');

    return template
        .replace(/{{CODE}}/g, code)
        .replace(/{{PURPOSE}}/g, purpose)
        .replace(/{{TIME}}/g, formattedTime)
        .replace(/{{DATE}}/g, formattedDate);
}