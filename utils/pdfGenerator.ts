import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (data: any) => {
  // Create a hidden printable element
  const printDiv = document.createElement('div');
  printDiv.style.position = 'absolute';
  printDiv.style.left = '-9999px';
  printDiv.style.top = '0';
  printDiv.style.width = '800px';
  printDiv.style.backgroundColor = '#ffffff';
  printDiv.style.color = '#000000';
  printDiv.style.padding = '40px';
  printDiv.style.fontFamily = 'sans-serif';
  
  let htmlContent = `
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #111;">${data.hmongTitle}</h1>
      <h2 style="font-size: 20px; margin: 0 0 10px 0; color: #555;">${data.title}</h2>
      <p style="margin: 5px 0;"><strong>Artist / Style:</strong> ${data.artist} - ${data.theme}</p>
      <p style="margin: 5px 0;"><strong>Instrumental:</strong> ${data.traditionalDetails || 'Traditional Flutes & Pop beats'}</p>
      <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
        <span style="background: #eee; padding: 4px 10px; border-radius: 4px;">Pacing: ${data.pacingInfo?.tempo || 'Medium'}</span>
        <span style="background: #eee; padding: 4px 10px; border-radius: 4px;">Energy: ${data.pacingInfo?.energyLevel || 'Balanced'}</span>
      </div>
    </div>
    
    <div style="display: flex; gap: 40px;">
      <!-- Lyrics Column -->
      <div style="flex: 1;">
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Official Lyrics</h3>
  `;

  data.lyrics.forEach((sec: any) => {
    htmlContent += `
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #4f46e5; font-size: 14px; text-transform: uppercase;">[${sec.hmongSectionName} / ${sec.sectionName}]</h4>
    `;
    sec.lines.forEach((line: any) => {
      htmlContent += `
        <div style="margin-bottom: 12px;">
          <p style="margin: 0; font-weight: bold; font-size: 15px;">${line.text}</p>
          <p style="margin: 2px 0 0 0; color: #666; font-size: 13px;">${line.translation}</p>
        </div>
      `;
    });
    htmlContent += `</div>`;
  });

  htmlContent += `
      </div>
      
      <!-- Storyboard Column -->
      <div style="flex: 1;">
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Production Storyboard</h3>
  `;

  data.scenes.forEach((scene: any, index: number) => {
    htmlContent += `
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0; color: #111;">Scene ${index + 1}</h4>
          <span style="font-size: 12px; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 12px;">
            ⏰ ${scene.time}
          </span>
        </div>
        
        <div style="margin-bottom: 10px;">
          <p style="margin: 0 0 5px 0; font-weight: 500; color: #111;">${scene.hmongDescription}</p>
          <p style="margin: 0; font-size: 13px; color: #555;">${scene.description}</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 12px;">
          <strong>🎥 Camera cue:</strong> ${scene.visualCue}
        </div>
        
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 4px;">
            <span>Mood Intensity</span>
            <span>${scene.mood}%</span>
          </div>
          <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
            <div style="width: ${scene.mood}%; height: 100%; background: linear-gradient(90deg, #818cf8, #c084fc);"></div>
          </div>
        </div>
      </div>
    `;
  });

  htmlContent += `
      </div>
    </div>
  `;

  printDiv.innerHTML = htmlContent;
  document.body.appendChild(printDiv);

  try {
    const canvas = await html2canvas(printDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    // Default PDF dimensions (A4 size context)
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // A4 dimensions in mm: 210 x 297
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const imgProps = pdf.getImageProperties(imgData);
    const height = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = height;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, height);
    heightLeft -= pdfHeight;
    
    // Add subsequent pages if the content is long
    while (heightLeft >= 0) {
      position = heightLeft - height;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, height);
      heightLeft -= pdfHeight;
    }
    
    const fileName = `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_storyboard.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    document.body.removeChild(printDiv);
  }
};
