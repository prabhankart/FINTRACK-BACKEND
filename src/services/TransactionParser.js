const csv = require('csv-parser');
const fs = require('fs');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');

// SOLID — Single Responsibility
// ONLY job: parse CSV, XLSX, PDF into standard transaction format

class TransactionParser {

  // ─── MAIN ENTRY POINT ───────────────────────────────────────
  async parseFile(filePath, mimetype) {
    const ext = filePath.split('.').pop().toLowerCase();

    if (ext === 'csv') return await this.parseCSV(filePath);
    if (ext === 'xlsx' || ext === 'xls') return await this.parseXLSX(filePath);
    if (ext === 'pdf') return await this.parsePDF(filePath);

    throw new Error('Unsupported file format. Use CSV, XLSX, or PDF');
  }

  // ─── CSV PARSER ──────────────────────────────────────────────
  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const parsed = this.parseRow(row);
          if (this.isValid(parsed)) results.push(parsed);
        })
        .on('end', () => {
          console.log(`CSV parsed ${results.length} transactions`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  // ─── XLSX PARSER ─────────────────────────────────────────────
  parseXLSX(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = [];
    for (const row of rows) {
      const parsed = this.parseRow(row);
      if (this.isValid(parsed)) results.push(parsed);
    }
    console.log(`XLSX parsed ${results.length} transactions`);
    return results;
  }

  // ─── PDF PARSER ──────────────────────────────────────────────
  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    console.log('PDF RAW TEXT SAMPLE:\n', pdfData.text.substring(0, 800));

    const text = pdfData.text.replace(/\r/g, '');
    const results = [];

    // ── Strategy 1: SBI/HDFC style — two dates then description then amounts
    // Format: 05/06/2026 05/06/2026 UPI/DR/123/ZOMATO 450.00 12345.67
    const strategy1Regex =
      /(\d{2}\/\d{2}\/\d{4})\s*\d{2}\/\d{2}\/\d{4}\s*(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/gs;

    let match;
    while ((match = strategy1Regex.exec(text)) !== null) {
      const date = match[1];
      const description = match[2].replace(/\n/g, ' ').trim();
      const amount = parseFloat(match[3].replace(/,/g, ''));

      if (amount <= 0 || description.length < 3) continue;

      const type = this.detectType(description);

      results.push({
        date: this.parseDate(date),
        description: this.parseDescription(description),
        amount,
        type
      });
    }

    // ── Strategy 2: Single date style
    // Format: 05/06/2026 UPI/DR/123/ZOMATO 450.00 DR
    if (results.length === 0) {
      console.log('Strategy 1 found 0 — trying Strategy 2');

      const strategy2Regex =
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s*(CR|DR)?/gi;

      while ((match = strategy2Regex.exec(text)) !== null) {
        const date = match[1];
        const description = match[2].replace(/\n/g, ' ').trim();
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const typeHint = match[4];

        if (amount <= 0 || description.length < 3) continue;

        let type = 'debit';
        if (typeHint) {
          type = typeHint.toUpperCase() === 'CR' ? 'credit' : 'debit';
        } else {
          type = this.detectType(description);
        }

        results.push({
          date: this.parseDate(date),
          description: this.parseDescription(description),
          amount,
          type
        });
      }
    }

    // ── Strategy 3: Line by line fallback
    if (results.length === 0) {
      console.log('Strategy 2 found 0 — trying Strategy 3 line-by-line');

      const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5);

      for (const line of lines) {
        const parsed = this.parsePDFLine(line);
        if (parsed && this.isValid(parsed)) results.push(parsed);
      }
    }

    console.log(`PDF parsed ${results.length} transactions`);
    if (results.length > 0) console.log('Sample:', results.slice(0, 3));
    return results;
  }

  // ─── DETECT CREDIT/DEBIT FROM DESCRIPTION ────────────────────
  detectType(description) {
    const upper = description.toUpperCase();

    // Credit indicators
    if (
      upper.includes('/CR/') ||
      upper.includes('UPI/CR') ||
      upper.includes('NEFT/IN') ||
      upper.includes('IMPS/IN') ||
      upper.includes('CREDIT') ||
      upper.includes('SALARY') ||
      upper.includes('REFUND') ||
      upper.includes('REVERSAL') ||
      upper.includes('CASHBACK') ||
      upper.includes('INTEREST CREDITED') ||
      upper.match(/\bCR\b/)
    ) {
      return 'credit';
    }

    return 'debit';
  }

  // ─── LINE BY LINE PDF PARSER (Strategy 3) ────────────────────
  parsePDFLine(line) {
    try {
      // Skip header/footer lines
      const skipWords = [
        'Balance as on', 'Txn Date', 'Statement of',
        'Account Number', 'Account Name', 'Branch',
        'Interest Rate', 'CIF NO', 'End of Statement',
        'computer generated', 'Opening Balance',
        'Closing Balance', 'Page No'
      ];
      if (skipWords.some(w => line.includes(w))) return null;

      // Match date
      const dateMatch = line.match(
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/
      );

      // Match all amounts
      const amounts = line.match(/[\d,]+\.\d{2}/g);
      if (!amounts || amounts.length === 0) return null;

      // Use first amount as transaction amount
      const amount = parseFloat(amounts[0].replace(/,/g, ''));
      if (amount <= 0) return null;

      // Match type keyword
      const typeMatch = line.match(/\b(CR|DR|CREDIT|DEBIT)\b/i);

      // Build description
      let description = line;
      if (dateMatch) description = description.replace(dateMatch[0], '');
      amounts.forEach(a => { description = description.replace(a, ''); });
      if (typeMatch) description = description.replace(typeMatch[0], '');
      description = description.trim().replace(/\s+/g, ' ');

      if (!description || description.length < 3) return null;

      let type = 'debit';
      if (typeMatch) {
        type = typeMatch[0].toUpperCase().includes('CR') ? 'credit' : 'debit';
      } else {
        type = this.detectType(description);
      }

      return {
        date: dateMatch
          ? this.parseDate(dateMatch[0])
          : new Date().toISOString().split('T')[0],
        description: this.parseDescription(description),
        amount,
        type
      };

    } catch (err) {
      return null;
    }
  }

  // ─── ROW PARSER (CSV + XLSX) ─────────────────────────────────
  parseRow(row) {
    return {
      date: this.parseDate(
        row.date || row.Date || row.DATE ||
        row.Transaction_Date || row['Transaction Date'] ||
        row['Txn Date'] || row.VALUE_DATE
      ),
      description: this.parseDescription(
        row.description || row.Description || row.DESCRIPTION ||
        row.narration || row.Narration || row.particulars ||
        row.Particulars || row.PARTICULARS || row['Transaction Remarks'] ||
        row.remarks || row.Remarks
      ),
      amount: this.parseAmount(
        row.amount || row.Amount || row.AMOUNT ||
        row.debit || row.Debit || row.DEBIT ||
        row.credit || row.Credit || row.CREDIT ||
        row['Debit Amount'] || row['Credit Amount'] ||
        row.Withdrawal || row.Deposit
      ),
      type: this.parseType(row)
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────
  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Handle DD/MM/YYYY format (Indian banks)
    const ddmmyyyy = String(dateStr).match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    const date = new Date(dateStr);
    if (isNaN(date)) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  }

  parseDescription(desc) {
    if (!desc) return 'Unknown Transaction';
    return String(desc).trim().toUpperCase().substring(0, 255);
  }

  parseAmount(amount) {
    if (!amount) return 0;
    const cleaned = String(amount).replace(/[₹$,\s]/g, '');
    return Math.abs(parseFloat(cleaned)) || 0;
  }

  parseType(row) {
    // Explicit type column
    const typeCol = row.type || row.Type || row.TYPE ||
      row['Transaction Type'] || row.transaction_type;
    if (typeCol) {
      const t = String(typeCol).toLowerCase();
      if (t.includes('credit') || t === 'cr') return 'credit';
      if (t.includes('debit') || t === 'dr') return 'debit';
    }

    // Separate debit/credit columns
    const debitVal = parseFloat(row.debit || row.Debit || row.Withdrawal || row['Debit Amount'] || 0);
    const creditVal = parseFloat(row.credit || row.Credit || row.Deposit || row['Credit Amount'] || 0);
    if (debitVal > 0 && creditVal === 0) return 'debit';
    if (creditVal > 0 && debitVal === 0) return 'credit';

    // Amount sign
    const amount = parseFloat(
      String(row.amount || row.Amount || 0).replace(/,/g, '')
    );
    return amount < 0 ? 'debit' : 'credit';
  }

  isValid(parsedRow) {
    return (
      parsedRow &&
      parsedRow.amount > 0 &&
      parsedRow.description &&
      parsedRow.description !== 'UNKNOWN TRANSACTION' &&
      parsedRow.date
    );
  }
}

module.exports = new TransactionParser();