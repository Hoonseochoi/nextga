// lib/pdf_extractor.ts
// PDF.js + Tesseract OCR 폴백
// 'use client' 금지 — lib/ 모듈. 브라우저 전용 코드는 dynamic import로 처리.

export async function extractTextFromPDF(
  file: File,
  onProgress: (pct: number, text: string) => void
): Promise<string> {
  // 동적 import — Next.js 서버 사이드 실행 방지
  const pdfjsLib = await import('pdfjs-dist');

  // Worker 설정 (webpack alias가 next.config.ts에서 처리됨)
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pagesToProcess = [1, 3, 4, 5, 6].filter(p => p <= pdf.numPages);
  const total = pagesToProcess.length;
  let fullText = '';

  for (let idx = 0; idx < pagesToProcess.length; idx++) {
    const pageNum = pagesToProcess[idx];
    onProgress(Math.round((idx / total) * 85), `${pageNum}페이지 분석 중...`);

    let pageText = '';
    const page = await pdf.getPage(pageNum);

    try {
      // 텍스트 레이어 우선
      const content = await page.getTextContent();
      if (content?.items?.length > 0) {
        // Y좌표 기반 줄바꿈 보존 (원본 pdf_extractor.js 로직 그대로)
        const items = content.items.map((item: Record<string, unknown>) => ({
          str: item.str as string,
          x: (item.transform as number[])[4],
          y: (item.transform as number[])[5],
          w: item.width as number,
          hasEOL: item.hasEOL as boolean,
        }));

        let lastY: number | null = null;
        let lastX: number | null = null;

        for (const item of items) {
          if (lastY !== null) {
            if (Math.abs(item.y - lastY) > 8) {
              pageText += '\n';
            } else if (lastX !== null && Math.abs(item.x - lastX) > 5) {
              pageText += ' ';
            }
          }
          pageText += item.str;
          if (item.hasEOL) {
            pageText += '\n';
            lastY = null;
          } else {
            lastY = item.y;
            lastX = item.x + item.w;
          }
        }
      }
    } catch {
      // Tesseract OCR 폴백
      try {
        const Tesseract = await import('tesseract.js');
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        const result = await Tesseract.default.recognize(canvas, 'kor+eng');
        pageText = result.data.text;
      } catch (ocrErr) {
        console.error(`${pageNum}페이지 OCR 실패:`, ocrErr);
      }
    }

    fullText += pageText + '\n';
  }

  onProgress(100, '텍스트 추출 완료');
  return fullText;
}
