import { QuizQuestion } from '../../../types';
import { AdminUser, ManagedUser } from '../types';

const getUserStats = (user: AdminUser | ManagedUser): { name: string; email: string; generated: number; sent: number } => {
  const u = user as any;
  const name = u.name || u.displayName || 'Anonymous User';
  const email = u.email || '—';
  const generated = typeof u.generated === 'number' ? u.generated : (u.stats?.generated || 0);
  const sent = typeof u.sent === 'number' ? u.sent : (u.stats?.sent || 0);
  return { name, email, generated, sent };
};

export const generateGlobalUserReportPDF = async (users: (AdminUser | ManagedUser)[]) => {
  // jspdf is heavy (~690 KB). Load it only when a PDF is actually exported.
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  
  // Professional Brand Color Swatches
  const primaryColor = [37, 99, 235]; // Blue 600
  const accentColor = [59, 130, 246]; // Blue 500
  const textColorDark = [15, 23, 42]; // Slate 900
  const textColorMuted = [100, 116, 139]; // Slate 500
  const lightBgColor = [248, 250, 252]; // Slate 50
  
  // Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 44, 'F');
  
  // Accent strip on header
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 44, 210, 2, 'F');
  
  // Brand watermark / Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(219, 234, 254);
  doc.text('TELEQUIZ USER REPORT', 14, 15);
  
  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('User Activity & Poll Statistics', 14, 27);
  
  // Generation timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(239, 246, 255);
  doc.text(`Scope: Registered Users Report`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 210 - 14, 38, { align: 'right' });
  
  // KPI Metrics Card Table / Container (Drawn manually)
  const totalUsers = users.length;
  const userSummaries = users.map(getUserStats);
  const totalGenerated = userSummaries.reduce((sum, u) => sum + u.generated, 0);
  const totalSent = userSummaries.reduce((sum, u) => sum + u.sent, 0);
  const avgGenerated = totalUsers > 0 ? (totalGenerated / totalUsers).toFixed(1) : '0.0';
  
  // Metrics container box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(1);
  doc.roundedRect(14, 52, 182, 24, 3, 3, 'FD');
  
  // Col 1: Total Users
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(String(totalUsers), 32, 62, { align: 'center' });
  doc.setFont('helvetica', 'medium');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('TOTAL USERS', 32, 69, { align: 'center' });
  
  // Divider 1
  doc.line(60, 56, 60, 72);
  
  // Col 2: Total Generated
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(totalGenerated.toLocaleString(), 80, 62, { align: 'center' });
  doc.setFont('helvetica', 'medium');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('POLLS GENERATED', 80, 69, { align: 'center' });
  
  // Divider 2
  doc.line(105, 56, 105, 72);
  
  // Col 3: Polls Sent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(totalSent.toLocaleString(), 130, 62, { align: 'center' });
  doc.setFont('helvetica', 'medium');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('POLLS SENT', 130, 69, { align: 'center' });
  
  // Divider 3
  doc.line(155, 56, 155, 72);
  
  // Col 4: Average
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(String(avgGenerated), 178, 62, { align: 'center' });
  doc.setFont('helvetica', 'medium');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('AVG GENERATED/USER', 178, 69, { align: 'center' });

  // Main list
  const tableRows = users.map((user, index) => {
    const { name, email, generated, sent } = getUserStats(user);
    const percent = generated > 0 ? `${Math.round((sent / generated) * 100)}%` : '0%';
    return [
      index + 1,
      name,
      email,
      generated.toLocaleString(),
      sent.toLocaleString(),
      percent
    ];
  });
  
  // Add total row
  tableRows.push([
    '',
    'SUMMED REPORT TOTAL',
    `${totalUsers} users`,
    totalGenerated.toLocaleString(),
    totalSent.toLocaleString(),
    totalGenerated > 0 ? `${Math.round((totalSent / totalGenerated) * 100)}%` : '0%'
  ]);
  
  autoTable(doc, {
    startY: 84,
    head: [['No.', 'User Name', 'Email Identifier', 'Polls Generated', 'Polls Sent', 'Sent %']],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [37, 99, 235], // Blue 600
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
      cellPadding: 4.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      textColor: [51, 65, 85], // Slate 700
      lineColor: [241, 245, 249], // Slate 100
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      // Style the Summary row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [239, 246, 255]; // Blue 50
        data.cell.styles.textColor = [37, 99, 235]; // Blue 600
        data.cell.styles.lineColor = [191, 219, 254];
        data.cell.styles.lineWidth = 1;
      }
    }
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 281, 196, 281);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400
    
    doc.text('CONFIDENTIAL | TELEQUIZ ADMINISTRATIVE RECORD', 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 210 - 14, 287, { align: 'right' });
  }

  doc.save(`TeleQuiz_User_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateSingleUserSummaryPDF = async (user: AdminUser | ManagedUser) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  
  const { name, email, generated, sent } = getUserStats(user);
  const percent = generated > 0 ? `${Math.round((sent / generated) * 100)}%` : '0%';
  
  // Colors
  const primaryColor = [37, 99, 235]; // Blue 600
  const accentColor = [59, 130, 246]; // Blue 500
  const lightBgColor = [248, 250, 252];
  
  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 44, 'F');
  
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 44, 210, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(219, 234, 254);
  doc.text('TELEQUIZ USER REPORT', 14, 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(name, 14, 27);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(239, 246, 255);
  doc.text(`Email: ${email}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 210 - 14, 38, { align: 'right' });
  
  // KPI Metrics box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(14, 52, 182, 26, 3, 3, 'FD');
  
  // Col 1: Polls Generated
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(generated.toLocaleString(), 44, 63, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('POLLS GENERATED', 44, 71, { align: 'center' });
  
  // Line
  doc.line(74, 56, 74, 74);
  
  // Col 2: Polls Sent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(sent.toLocaleString(), 105, 63, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('POLLS SENT', 105, 71, { align: 'center' });
  
  // Line
  doc.line(136, 56, 136, 74);
  
  // Col 3: Delivery Rate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(percent, 166, 63, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DELIVERY RATE', 166, 71, { align: 'center' });
  
  // Details table
  const detailsRows = [
    ['User Name', name],
    ['Email Address', email],
    ['Polls Generated', generated.toLocaleString()],
    ['Polls Sent to Telegram', sent.toLocaleString()],
    ['Delivery Ratio', percent],
    ['User ID', (user as any).id || '—'],
    ['Report Timestamp', new Date().toLocaleString()],
  ];
  
  autoTable(doc, {
    startY: 88,
    head: [['Metric / Attribute', 'User Record Detail']],
    body: detailsRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9.5, 
      cellPadding: 5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 281, 196, 281);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`CONFIDENTIAL | TELEQUIZ USER REPORT: ${name.toUpperCase()}`, 14, 287);
  doc.text('Page 1 of 1', 210 - 14, 287, { align: 'right' });
  
  const safeFileName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`TeleQuiz_${safeFileName}_Report.pdf`);
};

export const generateUserQuizPDF = async (displayName: string, email: string, quizzes: QuizQuestion[]) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  
  const primaryColor = [67, 56, 202]; // Indigo 700
  const accentColor = [99, 102, 241]; // Indigo 500
  const textColorMuted = [100, 116, 139]; // Slate 500
  const lightBgColor = [248, 250, 252]; // Slate 50

  // Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 44, 'F');
  
  // Accent strip on header
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 44, 210, 2, 'F');
  
  // Brand watermark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(199, 210, 254);
  doc.text('TELEQUIZ USER DOSSIER', 14, 15);
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Individual Quiz Inventory', 14, 27);
  
  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text(`Detailed diagnostic of saved questions for profile`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 210 - 14, 38, { align: 'right' });
  
  // User Profile Summary Box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(14, 52, 182, 24, 3, 3, 'FD');
  
  // User name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(displayName, 18, 61);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('ACCOUNT HOLDER', 18, 68);
  
  // Divider
  doc.line(80, 56, 80, 72);
  
  // User Email
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(47, 55, 78);
  doc.text(email || 'N/A', 84, 61);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('EMAIL ADDRESS', 84, 68);
  
  // Divider
  doc.line(148, 56, 148, 72);
  
  // Quiz size
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(String(quizzes.length), 170, 61, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text('TOTAL QUIZZES', 170, 68, { align: 'center' });

  // Add quizzes table
  const tableRows = quizzes.map((q, index) => {
    const truncatedQuestion = q.question.length > 90 ? q.question.slice(0, 88) + '...' : q.question;
    const truncatedOptions = q.options.join(', ');
    const displayOptions = truncatedOptions.length > 55 ? truncatedOptions.slice(0, 53) + '...' : truncatedOptions;
    
    return [
      index + 1,
      truncatedQuestion,
      displayOptions,
      q.options[q.correctOptionIndex] || 'N/A',
      q.topic || 'General',
      (q.status || 'pending').toUpperCase()
    ];
  });
  
  autoTable(doc, {
    startY: 84,
    head: [['#', 'Question Statement', 'Given Options', 'Correct Answer', 'Topic', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [67, 56, 202], 
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      lineColor: [241, 245, 249],
      lineWidth: 0.5 
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 26 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: 'center' }
    },
    didParseCell: (data) => {
      // Highlight row according to status or styles if desired
      if (data.column.index === 5 && data.cell.text[0]) {
        const text = data.cell.text[0];
        if (text === 'SENT' || text === 'APPROVED') {
          data.cell.styles.textColor = [21, 128, 61]; // Green 700
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'PENDING' || text === 'DRAFT') {
          data.cell.styles.textColor = [194, 65, 12]; // Orange 700
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Footer for each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 281, 196, 281);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400
    
    doc.text(`TELEQUIZ PERSONAL USER REPORT: ${displayName.toUpperCase()}`, 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 210 - 14, 287, { align: 'right' });
  }
  
  const fileName = `${displayName.replace(/\s+/g, '_')}_quiz_list.pdf`;
  doc.save(fileName);
};

