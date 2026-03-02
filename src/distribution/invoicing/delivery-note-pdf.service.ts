import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';

const LEMON_GREEN = '#32CD32';
const LIGHT_GREY = '#F5F5F5';
const DARK_GREY = '#333333';
const MUTED_GREY = '#666666';
const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'btech-logo.jpg');

const PAGE_WIDTH = 595;
const CONTENT_WIDTH = 500;
const MARGIN = 50;
const CONTENT_LEFT = (PAGE_WIDTH - CONTENT_WIDTH) / 2;

@Injectable()
export class DeliveryNotePdfService {
  private readonly logger = new Logger(DeliveryNotePdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(invoiceId: string, res: Response): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        deliveryNote: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.deliveryNote) {
      throw new NotFoundException('Delivery note not found for this invoice');
    }

    const { deliveryNote } = invoice;

    const filename = `delivery-note-${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    // Outer frame
    doc
      .rect(30, 30, PAGE_WIDTH - 60, doc.page.height - 60)
      .strokeColor('#E5E5E5')
      .lineWidth(1)
      .stroke();

    let y = 50;

    // Logo
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

    const companyAddress =
      invoice.companyAddress ?? '121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan';
    const companyPhone =
      invoice.companyPhone ?? '08038086862, 08174615808';

    // Company address and phone
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text(companyAddress, CONTENT_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    y += 12;
    doc.text(companyPhone, CONTENT_LEFT, y, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
    y += 22;

    // Title
    doc
      .fontSize(22)
      .fillColor(DARK_GREY)
      .font('Helvetica-Bold')
      .text('DELIVERY NOTE', CONTENT_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    y += 28;

    // Invoice number reference
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(DARK_GREY)
      .text(`Invoice: ${invoice.invoiceNumber}`, CONTENT_LEFT, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    y += 20;

    // Issue date
    const issueDateStr = this.formatDate(invoice.issueDate);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text('Issue date', CONTENT_LEFT, y);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(DARK_GREY)
      .text(issueDateStr, CONTENT_LEFT, y + 14);

    // Customer summary on the right
    const rightX = CONTENT_LEFT + CONTENT_WIDTH / 2;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text('Customer', rightX, y);
    let rightY = y + 14;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(DARK_GREY)
      .text(invoice.customerName, rightX, rightY);
    rightY += 14;
    doc.font('Helvetica');
    if (invoice.customerCompany) {
      doc.text(invoice.customerCompany, rightX, rightY);
      rightY += 14;
    }
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, rightX, rightY);
      rightY += 14;
    }
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, rightX, rightY);
      rightY += 14;
    }

    y += 50;

    // Delivery details block
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(LEMON_GREEN)
      .text('DELIVERY DETAILS', CONTENT_LEFT, y);
    y += 20;

    doc.fontSize(9).font('Helvetica').fillColor(MUTED_GREY);
    doc.text('Driver name', CONTENT_LEFT, y);
    doc.text('Driver phone', CONTENT_LEFT + 170, y);
    doc.text('Vehicle number', CONTENT_LEFT + 340, y);
    y += 14;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text(deliveryNote.driverName, CONTENT_LEFT, y);
    doc.text(deliveryNote.driverPhone, CONTENT_LEFT + 170, y);
    doc.text(deliveryNote.vehicleNumber, CONTENT_LEFT + 340, y);
    y += 24;

    doc.fontSize(9).font('Helvetica').fillColor(MUTED_GREY);
    doc.text('Authorised by', CONTENT_LEFT, y);
    y += 14;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text(deliveryNote.authorisedBy, CONTENT_LEFT, y);
    y += 28;

    // Items table without pricing
    const tableLeft = CONTENT_LEFT;
    const snW = 40;
    const descW = 250;
    const qtyW = 80;
    const unitW = 80;
    const rowH = 24;

    // Header row
    doc.rect(tableLeft, y, CONTENT_WIDTH, rowH).fill(LIGHT_GREY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK_GREY);
    doc.text('S/N', tableLeft + 10, y + 7);
    doc.text('Description', tableLeft + snW + 10, y + 7);
    doc.text('Qty', tableLeft + snW + descW + 10, y + 7);
    doc.text('Unit', tableLeft + snW + descW + qtyW + 10, y + 7);
    y += rowH;

    let rowY = y;
    const pageBottom = 720;
    let totalQty = 0;

    doc.font('Helvetica').fontSize(9).fillColor(DARK_GREY);

    invoice.items.forEach((item, index) => {
      if (rowY > pageBottom) {
        doc.addPage();
        rowY = 80;
      }
      totalQty += item.quantity;
      doc.text(String(index + 1), tableLeft + 10, rowY + 7, {
        width: snW - 10,
      });
      doc.text(item.description, tableLeft + snW + 10, rowY + 7, {
        width: descW - 10,
      });
      doc.text(String(item.quantity), tableLeft + snW + descW + 10, rowY + 7, {
        width: qtyW - 10,
      });
      doc.text(item.unit ?? 'pieces', tableLeft + snW + descW + qtyW + 10, rowY + 7, {
        width: unitW - 10,
      });
      rowY += rowH;
    });

    y = rowY + 16;

    // Total quantity summary
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(DARK_GREY)
      .text('Total quantity', CONTENT_LEFT, y);
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(LEMON_GREEN)
      .text(String(totalQty), CONTENT_LEFT + 140, y);
    y += 32;

    // Divider
    if (y > doc.page.height - 160) {
      doc.addPage();
      y = 80;
    }

    doc
      .strokeColor('#E0E0E0')
      .lineWidth(0.5)
      .moveTo(CONTENT_LEFT, y)
      .lineTo(CONTENT_LEFT + CONTENT_WIDTH, y)
      .stroke();
    y += 16;

    // Standard note
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(LEMON_GREEN)
      .text(
        deliveryNote.note ||
          'Goods delivered in good condition are not returnable',
        CONTENT_LEFT,
        y,
        { width: CONTENT_WIDTH, align: 'center' },
      );
    y += 40;

    // Signatures
    const sigY = y;
    const colW = CONTENT_WIDTH / 2;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text('Delivered by (Driver)', CONTENT_LEFT, sigY);
    doc
      .moveTo(CONTENT_LEFT, sigY + 18)
      .lineTo(CONTENT_LEFT + colW - 20, sigY + 18)
      .strokeColor('#CCCCCC')
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(MUTED_GREY)
      .text('Received by (Customer)', CONTENT_LEFT + colW, sigY);
    doc
      .moveTo(CONTENT_LEFT + colW, sigY + 18)
      .lineTo(CONTENT_LEFT + CONTENT_WIDTH - 20, sigY + 18)
      .strokeColor('#CCCCCC')
      .stroke();

    doc.end();
    this.logger.log(
      `Delivery note PDF generated | invoice: ${invoice.invoiceNumber}`,
    );
  }

  private formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

