import puppeteer from 'puppeteer';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PdfOptions {
  projectName: string;
  clientName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  screenshotBase64?: string;
}

export async function generateProposalPdf(options: PdfOptions): Promise<Buffer> {
  const templatePath = path.join(__dirname, 'templates', 'proposal.html');
  const template = readFileSync(templatePath, 'utf-8');

  const html = template
    .replace('{{projectName}}', options.projectName)
    .replace('{{clientName}}', options.clientName)
    .replace('{{date}}', new Date().toLocaleDateString('es-AR'))
    .replace('{{screenshot}}', options.screenshotBase64 ?? '');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  return Buffer.from(pdf);
}
