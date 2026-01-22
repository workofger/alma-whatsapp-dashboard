import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GroupStats } from '../types';
import { UserActivity } from './analyticsService';
import { format } from 'date-fns';

export interface ReportOptions {
  title?: string;
  includeCharts?: boolean;
  includeUsers?: boolean;
  includeGroups?: boolean;
  dateRange?: string;
}

export interface ReportData {
  stats: {
    totalMessages: number;
    totalGroups: number;
    totalMembers: number;
    ghostUsers: number;
  };
  groups?: GroupStats[];
  topUsers?: UserActivity[];
  chartElement?: HTMLElement | null;
}

/**
 * Generate a formatted PDF report
 */
export async function generatePdfReport(
  data: ReportData,
  options: ReportOptions = {}
): Promise<void> {
  const {
    title = 'Alma Dashboard Report',
    includeCharts = true,
    includeUsers = true,
    includeGroups = true,
    dateRange = 'Last 30 days',
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [0, 168, 132]; // wa-teal
  const textColor: [number, number, number] = [51, 51, 51];
  const grayColor: [number, number, number] = [128, 128, 128];

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ========== HEADER ==========
  // Logo circle
  pdf.setFillColor(...primaryColor);
  pdf.circle(margin + 8, yPos + 8, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('A', margin + 5.5, yPos + 11);

  // Title
  pdf.setTextColor(...textColor);
  pdf.setFontSize(22);
  pdf.text(title, margin + 22, yPos + 6);

  // Subtitle
  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.text('WhatsApp Analytics Dashboard', margin + 22, yPos + 13);

  // Date
  pdf.setFontSize(9);
  pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth - margin - 50, yPos + 6);
  pdf.text(`Period: ${dateRange}`, pageWidth - margin - 50, yPos + 12);

  yPos += 25;

  // Divider line
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ========== EXECUTIVE SUMMARY ==========
  pdf.setTextColor(...textColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, yPos);
  yPos += 8;

  // Stats boxes
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 25;
  const stats = [
    { label: 'Total Messages', value: data.stats.totalMessages.toLocaleString(), color: primaryColor },
    { label: 'Active Groups', value: data.stats.totalGroups.toLocaleString(), color: [83, 189, 235] as [number, number, number] },
    { label: 'Members', value: data.stats.totalMembers.toLocaleString(), color: [162, 136, 245] as [number, number, number] },
    { label: 'Ghost Users', value: data.stats.ghostUsers.toLocaleString(), color: [229, 100, 80] as [number, number, number] },
  ];

  stats.forEach((stat, i) => {
    const x = margin + i * (boxWidth + 5);
    
    // Box background
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    // Color accent
    pdf.setFillColor(...stat.color);
    pdf.rect(x, yPos, 3, boxHeight, 'F');
    
    // Label
    pdf.setFontSize(8);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + 6, yPos + 8);
    
    // Value
    pdf.setFontSize(14);
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.value, x + 6, yPos + 18);
  });

  yPos += boxHeight + 15;

  // ========== CHART CAPTURE ==========
  if (includeCharts && data.chartElement) {
    checkNewPage(100);
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Activity Overview', margin, yPos);
    yPos += 8;

    try {
      const canvas = await html2canvas(data.chartElement, {
        backgroundColor: '#0b141a',
        scale: 2,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Limit height
      const maxHeight = 80;
      const finalHeight = Math.min(imgHeight, maxHeight);
      const finalWidth = (finalHeight / imgHeight) * imgWidth;
      
      pdf.addImage(imgData, 'PNG', margin, yPos, finalWidth, finalHeight);
      yPos += finalHeight + 10;
    } catch (error) {
      console.error('Error capturing chart:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(...grayColor);
      pdf.text('Chart capture failed', margin, yPos);
      yPos += 10;
    }
  }

  // ========== TOP USERS ==========
  if (includeUsers && data.topUsers && data.topUsers.length > 0) {
    checkNewPage(60);
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Top Contributors', margin, yPos);
    yPos += 8;

    // Table header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('#', margin + 3, yPos + 5.5);
    pdf.text('User', margin + 15, yPos + 5.5);
    pdf.text('Messages', pageWidth - margin - 25, yPos + 5.5);
    yPos += 10;

    // Table rows
    const maxUsers = Math.min(data.topUsers.length, 10);
    pdf.setFont('helvetica', 'normal');
    
    for (let i = 0; i < maxUsers; i++) {
      if (checkNewPage(8)) {
        // Re-add header on new page
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('#', margin + 3, yPos + 5.5);
        pdf.text('User', margin + 15, yPos + 5.5);
        pdf.text('Messages', pageWidth - margin - 25, yPos + 5.5);
        yPos += 10;
        pdf.setFont('helvetica', 'normal');
      }

      const user = data.topUsers[i];
      const displayName = user.sender_pushname || user.sender_number || user.sender_lid || 'Unknown';
      
      // Alternate row background
      if (i % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos - 1, pageWidth - margin * 2, 7, 'F');
      }
      
      pdf.setFontSize(9);
      pdf.setTextColor(...textColor);
      pdf.text(`${i + 1}`, margin + 3, yPos + 4);
      pdf.text(displayName.substring(0, 35), margin + 15, yPos + 4);
      pdf.text(user.message_count.toLocaleString(), pageWidth - margin - 25, yPos + 4);
      yPos += 7;
    }
    
    yPos += 10;
  }

  // ========== GROUPS ==========
  if (includeGroups && data.groups && data.groups.length > 0) {
    checkNewPage(60);
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monitored Groups', margin, yPos);
    yPos += 8;

    // Table header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Group Name', margin + 3, yPos + 5.5);
    pdf.text('Members', pageWidth - margin - 55, yPos + 5.5);
    pdf.text('Messages', pageWidth - margin - 25, yPos + 5.5);
    yPos += 10;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    
    for (let i = 0; i < data.groups.length; i++) {
      if (checkNewPage(8)) {
        // Re-add header on new page
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Group Name', margin + 3, yPos + 5.5);
        pdf.text('Members', pageWidth - margin - 55, yPos + 5.5);
        pdf.text('Messages', pageWidth - margin - 25, yPos + 5.5);
        yPos += 10;
        pdf.setFont('helvetica', 'normal');
      }

      const group = data.groups[i];
      
      // Alternate row background
      if (i % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos - 1, pageWidth - margin * 2, 7, 'F');
      }
      
      pdf.setFontSize(9);
      pdf.setTextColor(...textColor);
      pdf.text((group.group_name || 'Unknown').substring(0, 40), margin + 3, yPos + 4);
      pdf.text((group.member_count || 0).toLocaleString(), pageWidth - margin - 55, yPos + 4);
      pdf.text((group.total_messages || 0).toLocaleString(), pageWidth - margin - 25, yPos + 4);
      yPos += 7;
    }
    
    yPos += 10;
  }

  // ========== FOOTER ==========
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    
    // Footer text
    pdf.setFontSize(8);
    pdf.setTextColor(...grayColor);
    pdf.text('Generated by Alma Dashboard', margin, pageHeight - 7);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 7);
  }

  // Save
  const filename = `alma-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  pdf.save(filename);
}

/**
 * Capture a specific element as PDF
 */
export async function captureElementAsPdf(
  element: HTMLElement,
  filename: string = 'capture.pdf'
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#0b141a',
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Center vertically if smaller than page
    const yPos = imgHeight < pageHeight - 20 ? (pageHeight - imgHeight) / 2 : 10;
    
    pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error capturing element:', error);
    throw error;
  }
}
