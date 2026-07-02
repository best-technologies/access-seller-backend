import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';

const LEMON_GREEN = '#32CD32';
const LIGHT_GREY = '#F5F5F5';
const DARK_GREY = '#333333';
const MUTED_GREY = '#666666';
const BALANCE_DUE_RED = '#E74C3C';
const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'btech-logo.jpg');

const COMPANY_BANK_DETAILS = {
  accountName: 'Best Technologies LTD',
  bankName: 'Zenith Bank',
  accountNumber: '1312105308',
};
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = 500;
const MARGIN = 50;
const CONTENT_LEFT = (PAGE_WIDTH - CONTENT_WIDTH) / 2;

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(invoiceId: string, res: Response): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    // Light grey frame around content
    doc
      .rect(30, 30, PAGE_WIDTH - 60, doc.page.height - 60)
      .strokeColor('#E5E5E5')
      .lineWidth(1)
      .stroke();

    let y = 50;

    // === Logo (centered) ===
    try {
      const logoW = 100;
      const logoH = 60;
      doc.image(LOGO_PATH, (PAGE_WIDTH - logoW) / 2, y, {
        width: logoW,
        height: logoH,
      });
      y += logoH + 8;
    } catch {
      this.logger.warn('Logo not found, skipping');
      y += 10;
    }

    // === Company address & phone (centered, under logo) ===
    const companyAddress =
      invoice.companyAddress ?? '121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan';
    const companyPhone = invoice.companyPhone ?? '08038086862, 08174615808';
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text(companyAddress, CONTENT_LEFT, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 12;
    doc.text(companyPhone, CONTENT_LEFT, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 22;

    // === INVOICE title ===
    doc
      .fontSize(22)
      .fillColor(DARK_GREY)
      .font('Helvetica-Bold')
      .text('INVOICE', CONTENT_LEFT, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 28;

    // === Invoice number ===
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber, CONTENT_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    y += 22;

    // === Status badge (light grey rounded) ===
    doc.fillColor(LIGHT_GREY);
    doc.roundedRect((PAGE_WIDTH - 60) / 2, y, 60, 22, 4).fill();
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(DARK_GREY)
      .text(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), CONTENT_LEFT, y + 6, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    y += 36;

    // === Issue date | Due date | Payment terms (horizontal) ===
    const colW = CONTENT_WIDTH / 3;
    const dateStr = this.formatDate(invoice.issueDate);
    const dueStr = invoice.dueDate ? this.formatDate(invoice.dueDate) : '-';
    const termsStr = invoice.paymentTerms ?? '-';

    doc.fontSize(9).fillColor(MUTED_GREY);
    doc.text('Issue date', CONTENT_LEFT, y);
    doc.text('Due date', CONTENT_LEFT + colW, y);
    doc.text('Payment terms', CONTENT_LEFT + colW * 2, y);
    y += 14;
    doc.fontSize(11).fillColor(DARK_GREY).font('Helvetica-Bold');
    doc.text(dateStr, CONTENT_LEFT, y);
    doc.text(dueStr, CONTENT_LEFT + colW, y);
    doc.text(termsStr, CONTENT_LEFT + colW * 2, y);
    y += 36;

    // === BILL TO ===
    doc.fontSize(11).fillColor(LEMON_GREEN).font('Helvetica-Bold').text('BILL TO', CONTENT_LEFT, y);
    y += 20;

    doc.fontSize(10).fillColor(DARK_GREY).font('Helvetica-Bold');
    doc.text(invoice.customerName, CONTENT_LEFT, y);
    y += 14;
    doc.font('Helvetica');
    if (invoice.customerCompany) {
      doc.text(invoice.customerCompany, CONTENT_LEFT, y);
      y += 14;
    }
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, CONTENT_LEFT, y);
      y += 14;
    }
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, CONTENT_LEFT, y);
      y += 14;
    }
    y += 24;

    // === Items table ===
    const tableLeft = CONTENT_LEFT;
    const descW = 200;
    const qtyW = 45;
    const unitW = 55;
    const priceW = 95;
    const amountW = 95;
    const rowH = 26;

    // Header row (light grey)
    doc.rect(tableLeft, y, CONTENT_WIDTH, rowH).fill(LIGHT_GREY);
    doc.fontSize(9).fillColor(DARK_GREY).font('Helvetica-Bold');
    doc.text('Description', tableLeft + 10, y + 8);
    doc.text('Qty', tableLeft + descW + 10, y + 8);
    doc.text('Unit', tableLeft + descW + qtyW + 10, y + 8);
    doc.text('Unit price', tableLeft + descW + qtyW + unitW + 10, y + 8);
    doc.text('Amount', tableLeft + descW + qtyW + unitW + priceW + 10, y + 8);
    y += rowH;

    doc.font('Helvetica').fillColor(DARK_GREY);
    let rowY = y;
    const pageBottom = 720;

    for (let i = 0; i < invoice.items.length; i++) {
      if (rowY > pageBottom) {
        doc.addPage();
        rowY = 80;
      }
      const item = invoice.items[i];
      const amount = item.totalAmount ?? item.quantity * item.unitPrice;
      doc.fontSize(9);
      const priceColLeft = tableLeft + descW + qtyW + unitW + 10;
      const amountColLeft = priceColLeft + priceW;
      doc.text(item.description, tableLeft + 10, rowY + 8, { width: descW - 10 });
      doc.text(String(item.quantity), tableLeft + descW + 10, rowY + 8);
      doc.text(item.unit ?? 'pieces', tableLeft + descW + qtyW + 10, rowY + 8);
      doc.text(this.formatMoney(item.unitPrice), priceColLeft, rowY + 8, {
        width: priceW - 10,
        align: 'right',
      });
      doc.text(this.formatMoney(amount), amountColLeft, rowY + 8, {
        width: amountW - 10,
        align: 'right',
      });
      rowY += rowH;
    }

    y = rowY + 24;

    // === Totals (right-aligned) - use explicit width so values stay within page ===
    const totLeft = CONTENT_LEFT + CONTENT_WIDTH - 180;
    const totLabelWidth = 100;
    const totValueLeft = totLeft + totLabelWidth;
    const totValueWidth = CONTENT_LEFT + CONTENT_WIDTH - 20 - totValueLeft; // stays inside frame
    const totValueOpts = { width: totValueWidth, align: 'right' as const };
    doc.fontSize(10).font('Helvetica');
    doc.text('Subtotal', totLeft, y, { width: totLabelWidth });
    doc.text(this.formatMoney(invoice.subtotal), totValueLeft, y, totValueOpts);
    y += 18;

    if (invoice.taxAmount != null && invoice.taxAmount > 0) {
      const taxLabel =
        invoice.taxRate != null ? `Tax (${invoice.taxRate}%)` : 'Tax';
      doc.text(taxLabel, totLeft, y, { width: totLabelWidth });
      doc.text(this.formatMoney(invoice.taxAmount), totValueLeft, y, totValueOpts);
      y += 18;
    }

    doc.font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text('Total', totLeft, y, { width: totLabelWidth });
    doc.text(this.formatMoney(invoice.totalAmount), totValueLeft, y, totValueOpts);
    y += 18;

    if (invoice.amountPaid > 0) {
      doc.font('Helvetica').fillColor(LEMON_GREEN);
      doc.text('Amount paid', totLeft, y, { width: totLabelWidth });
      doc.text(this.formatMoney(invoice.amountPaid), totValueLeft, y, totValueOpts);
      y += 18;
    }

    doc.font('Helvetica').fillColor(BALANCE_DUE_RED);
    doc.text('Balance due', totLeft, y, { width: totLabelWidth });
    doc.text(this.formatMoney(invoice.balanceDue), totValueLeft, y, totValueOpts);
    y += 28;

    // === Amount in words (italic) ===
    if (invoice.amountInWords) {
      doc.fontSize(10).font('Helvetica-Oblique').fillColor(LEMON_GREEN);
      doc.text(invoice.amountInWords, CONTENT_LEFT, y, { width: CONTENT_WIDTH });
      y += 40;
    }

    // New page if not enough room for divider + address + bank box
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = 80;
    }

    // === Divider line ===
    doc
      .strokeColor('#E0E0E0')
      .lineWidth(0.5)
      .moveTo(CONTENT_LEFT, y)
      .lineTo(CONTENT_LEFT + CONTENT_WIDTH, y)
      .stroke();
    y += 16;

    // === Company address & phone (repeated at bottom, centered) ===
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text(companyAddress, CONTENT_LEFT, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 12;
    doc.text(companyPhone, CONTENT_LEFT, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 28;

    // === PAYMENT ACCOUNT DETAILS (bordered box, 3-column) ===
    const bankBoxH = 60;
    const bankPad = 12;
    const bankColW = CONTENT_WIDTH / 3;

    doc
      .rect(CONTENT_LEFT, y, CONTENT_WIDTH, bankBoxH)
      .strokeColor('#E0E0E0')
      .lineWidth(1)
      .stroke();

    // Box heading
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(DARK_GREY)
      .text('PAYMENT ACCOUNT DETAILS', CONTENT_LEFT + bankPad, y + bankPad);

    const bankValY = y + bankPad + 18;

    // Column 1: Bank
    doc.fontSize(8).font('Helvetica').fillColor(MUTED_GREY);
    doc.text('Bank', CONTENT_LEFT + bankPad, bankValY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text(COMPANY_BANK_DETAILS.bankName, CONTENT_LEFT + bankPad, bankValY + 12);

    // Column 2: Account number
    doc.fontSize(8).font('Helvetica').fillColor(MUTED_GREY);
    doc.text('Account number', CONTENT_LEFT + bankColW + bankPad, bankValY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text(COMPANY_BANK_DETAILS.accountNumber, CONTENT_LEFT + bankColW + bankPad, bankValY + 12);

    // Column 3: Account name
    doc.fontSize(8).font('Helvetica').fillColor(MUTED_GREY);
    doc.text('Account name', CONTENT_LEFT + bankColW * 2 + bankPad, bankValY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text(COMPANY_BANK_DETAILS.accountName, CONTENT_LEFT + bankColW * 2 + bankPad, bankValY + 12);

    doc.end();
    this.logger.log(`Invoice PDF generated | ${invoice.invoiceNumber}`);
  }

  private formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatMoney(n: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
}
