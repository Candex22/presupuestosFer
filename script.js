let items = [];
let itemCounter = 0;
let currentDoc = null;

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    document.getElementById('issueDate').value = formatDateInput(today);
    document.getElementById('validDate').value = formatDateInput(nextMonth);

    // Start with 2 empty items
    addItem();
    addItem();
});

function formatDateInput(d) {
    return d.toISOString().split('T')[0];
}

// ── Items Management ─────────────────────────────────────────────
function addItem() {
    itemCounter++;
    const id = itemCounter;
    items.push({ id, description: '', price: 0, quantity: 1 });
    renderItems();
}

function removeItem(id) {
    items = items.filter(i => i.id !== id);
    renderItems();
}

function updateItem(id, field, value) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (field === 'price' || field === 'quantity') {
        item[field] = parseFloat(value) || 0;
    } else {
        item[field] = value;
    }
    updateTotal();
}

function renderItems() {
    const container = document.getElementById('itemsContainer');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <p>No hay ítems. Hacé clic en "Agregar ítem" para empezar.</p>
            </div>`;
        updateTotal();
        return;
    }

    container.innerHTML = items.map((item, idx) => {
        const lineTotal = item.price * item.quantity;
        return `
        <div class="item-row" data-id="${item.id}">
            <span class="row-num">#${idx + 1}</span>
            <input 
                type="text" 
                placeholder="Descripción del servicio..." 
                value="${escapeHtml(item.description)}"
                oninput="updateItem(${item.id}, 'description', this.value)"
            />
            <input 
                type="number" 
                placeholder="0" 
                min="0" 
                value="${item.price || ''}"
                oninput="updateItem(${item.id}, 'price', this.value); updateRowTotal(${item.id})"
            />
            <input 
                type="number" 
                placeholder="1" 
                min="1" 
                value="${item.quantity || 1}"
                oninput="updateItem(${item.id}, 'quantity', this.value); updateRowTotal(${item.id})"
            />
            <span class="row-total" id="rowTotal_${item.id}">${formatCurrency(lineTotal)}</span>
            <button class="delete-btn" onclick="removeItem(${item.id})" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/>
                </svg>
            </button>
        </div>`;
    }).join('');

    updateTotal();
}

function updateRowTotal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const el = document.getElementById(`rowTotal_${id}`);
    if (el) el.textContent = formatCurrency(item.price * item.quantity);
    updateTotal();
}

function updateTotal() {
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    document.getElementById('totalDisplay').textContent = formatCurrency(total);
}

// ── Helpers ───────────────────────────────────────────────────────
function formatCurrency(n) {
    if (!n) return '$ 0';
    return '$ ' + n.toLocaleString('es-AR');
}

function formatDateDisplay(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── PDF Generation ────────────────────────────────────────────────
function generatePDF() {
    const img = new Image();
    img.onload = () => _buildPDF(img);
    img.onerror = () => _buildPDF(null);
    img.src = 'fb.png';
}

function _buildPDF(logoImg) {
    const clientName  = document.getElementById('clientName').value.trim()  || 'Cliente';
    const budgetNumber= document.getElementById('budgetNumber').value.trim()|| '0001';
    const issueDate   = document.getElementById('issueDate').value;
    const validDate   = document.getElementById('validDate').value;

    const footerNote  = document.getElementById('footerNote').value.trim();
    const equipment   = document.getElementById('equipment').value.trim();

    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W          = 210;
    const H          = 297;
    const BLUE       = [37, 99, 235];
    const GRAY_BG    = [245, 247, 250];
    const GRAY_ROW   = [229, 231, 235];
    const GRAY_TEXT  = [100, 116, 139];
    const DARK       = [15, 23, 42];
    const WHITE      = [255, 255, 255];

    const tableLeft  = 10;
    const tableW     = W - 20;
    const colItem    = 22;
    const colDesc    = tableW - colItem - 38 - 28 - 38;
    const colPrice   = 38;
    const colQty     = 28;
    const colTotal   = 38;
    const ROW_H      = 20;

    // Space needed after last row: total box + notes + footer
    const BOTTOM_RESERVE = 70;
    // Y where footer bar starts (always at bottom of page)
    const FOOTER_Y = H - 22;

    // ── Helper: draw page background ──────────────────────────────
    function drawPageBg() {
        doc.setFillColor(...GRAY_BG);
        doc.rect(0, 0, W, H, 'F');
    }

    // ── Helper: draw footer bar on current page ───────────────────
    function drawFooterBar() {
        doc.setFillColor(...BLUE);
        doc.rect(10, FOOTER_Y, W - 20, 12, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Gracias por confiar en nosotros', 18, FOOTER_Y + 8);
        doc.setDrawColor(...WHITE);
        doc.setLineWidth(0.5);
        doc.line(W - 55, FOOTER_Y + 6, W - 18, FOOTER_Y + 6);
        doc.setFontSize(8);
        doc.text('Firma', W - 36, FOOTER_Y + 10, { align: 'center' });
    }

    // ── Helper: draw table column header ─────────────────────────
    function drawTableHeader(y) {
        doc.setFillColor(...BLUE);
        doc.rect(tableLeft, y, tableW, 11, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        let cx = tableLeft + 4;
        doc.text('ítem', cx + colItem / 2 - 4, y + 7.5);
        cx += colItem;
        doc.text('descripción', cx + 2, y + 7.5);
        cx += colDesc;
        doc.text('precio', cx + colPrice / 2, y + 7.5, { align: 'center' });
        cx += colPrice;
        doc.text('cantidad', cx + colQty / 2, y + 7.5, { align: 'center' });
        cx += colQty;
        doc.text('total', cx + colTotal / 2, y + 7.5, { align: 'center' });
        return y + 11;
    }

    // ── Helper: add new page with bg + continuation header ────────
    function addPage() {
        drawFooterBar(); // close current page footer
        doc.addPage();
        drawPageBg();
        // Small continuation header
        doc.setFillColor(...WHITE);
        doc.roundedRect(10, 8, W - 20, 14, 2, 2, 'F');
        doc.setTextColor(...BLUE);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Servicios FB", 16, 17);
        doc.setTextColor(...GRAY_TEXT);
        doc.setFont('helvetica', 'normal');
        doc.text(`Presupuesto # ${budgetNumber} — continuación`, W - 16, 17, { align: 'right' });
        return 26; // new Y after mini-header
    }

    // ════════════════════════════════════════════════════════════════
    // PAGE 1 — Full header
    // ════════════════════════════════════════════════════════════════
    drawPageBg();

    // White card
    doc.setFillColor(...WHITE);
    doc.roundedRect(10, 10, W - 20, 42, 3, 3, 'F');

    // Logo block — fb.png
    if (logoImg) {
        try { doc.addImage(logoImg, 'PNG', 16, 16, 28, 28); } catch(e) {}
    }

    // Company name
    doc.setTextColor(...BLUE);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Servicios FB", 50, 30);

    // logo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Electricidad residencial & Obra", 50, 36);

    // PRESUPUESTO title
    doc.setTextColor(...DARK);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', W - 16, 30, { align: 'right' });

    // Number + date bar
    doc.setFillColor(...BLUE);
    doc.roundedRect(10, 58, 85, 14, 1, 1, 'F');
    doc.setFillColor(...GRAY_BG);
    doc.roundedRect(97, 58, W - 107, 14, 1, 1, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Presupuesto  # ${budgetNumber}`, 16, 67);

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha: ${formatDateDisplay(issueDate)}`, W - 16, 67, { align: 'right' });

    // Para:
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Para:', 16, 84);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 32, 84);

    // ── First table header ──
    let rowY = drawTableHeader(92);

    // ════════════════════════════════════════════════════════════════
    // ROWS — with automatic page break
    // ════════════════════════════════════════════════════════════════
    items.forEach((item, idx) => {
        // Calculate actual row height based on wrapped description
        const descLines = doc.splitTextToSize(item.description || '—', colDesc - 4);
        const lineCount  = descLines.length;
        const actualH    = Math.max(ROW_H, lineCount * 6 + 8);

        // Do we need a new page?
        // On the last item we also need BOTTOM_RESERVE for totals+footer
        const isLast   = idx === items.length - 1;
        const neededH  = actualH + (isLast ? BOTTOM_RESERVE : 0);
        const pageLimit = FOOTER_Y - 6; // don't draw over footer

        if (rowY + neededH > pageLimit) {
            rowY = addPage();
            rowY = drawTableHeader(rowY);
        }

        // Draw row background
        const isAlt = idx % 2 === 1;
        doc.setFillColor(isAlt ? 243 : 255, isAlt ? 244 : 255, isAlt ? 246 : 255);
        doc.rect(tableLeft, rowY, tableW, actualH, 'F');

        // Separator
        doc.setDrawColor(...GRAY_ROW);
        doc.setLineWidth(0.3);
        doc.line(tableLeft, rowY + actualH, tableLeft + tableW, rowY + actualH);

        doc.setTextColor(...DARK);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const midY = rowY + actualH / 2 + 1.5;

        // Item number
        doc.text(String(idx + 1), tableLeft + colItem / 2, midY, { align: 'center' });

        // Description
        const descStartY = rowY + (actualH - lineCount * 5.5) / 2 + 4;
        doc.text(descLines, tableLeft + colItem + 3, descStartY);

        // Price
        let px = tableLeft + colItem + colDesc;
        if (item.price > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text(`$ ${item.price.toLocaleString('es-AR')}`, px + colPrice / 2, midY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
        }

        // Quantity
        px += colPrice;
        if (item.quantity !== undefined) {
            doc.setFont('helvetica', 'bold');
            doc.text(String(item.quantity), px + colQty / 2, midY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
        }

        // Line total
        px += colQty;
        const lineTotal = item.price * item.quantity;
        if (lineTotal > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text(`$ ${lineTotal.toLocaleString('es-AR')}`, px + colTotal / 2, midY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
        }

        rowY += actualH;
    });

    // ════════════════════════════════════════════════════════════════
    // BOTTOM SECTION — totals, notes, equipment
    // ════════════════════════════════════════════════════════════════
    const bottomY = rowY + 10;

    // Equipment / notes left
    if (equipment) {
        doc.setTextColor(...DARK);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Contamos con:', tableLeft, bottomY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY_TEXT);
        const equipLines = doc.splitTextToSize(equipment, 80);
        doc.text(equipLines, tableLeft, bottomY + 12);
    }

    // Total box
    const totalBoxX = W - 10 - 75;
    doc.setFillColor(...BLUE);
    doc.roundedRect(totalBoxX, bottomY, 75, 16, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total :', totalBoxX + 14, bottomY + 10.5);
    doc.setFontSize(13);
    doc.text(`$ ${total.toLocaleString('es-AR')}`, totalBoxX + 73, bottomY + 10.5, { align: 'right' });

    // Footer notes + validity
    let noteY = bottomY + 26;
    if (footerNote || validDate) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        if (footerNote) {
            const fLines = doc.splitTextToSize(footerNote, 120);
            doc.text(fLines, tableLeft, noteY);
            noteY += fLines.length * 5 + 2;
        }
        if (validDate) {
            doc.text(`Presupuesto es válido hasta el día ${formatDateDisplay(validDate)}.`, tableLeft, noteY);
        }
    }

    // ── Footer bar on last page ──
    drawFooterBar();

    // ── Output ──
    currentDoc = doc;
    const uri = doc.output('datauristring');

    const preview = document.getElementById('pdfPreview');
    const frame   = document.getElementById('pdfFrame');
    preview.style.display = 'block';
    frame.src = uri;
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadPDF() {
    if (!currentDoc) return;
    const clientName = document.getElementById('clientName').value.trim() || 'Cliente';
    const budgetNumber = document.getElementById('budgetNumber').value.trim() || '0001';
    const filename = `Presupuesto_${budgetNumber}_${clientName.replace(/\s+/g, '_')}.pdf`;
    currentDoc.save(filename);
}