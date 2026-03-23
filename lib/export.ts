// html2canvas-pro로 분석 결과를 PNG로 내보내기

export async function exportAsImage(originalFileName: string): Promise<void> {
  const html2canvas = (await import('html2canvas-pro')).default;

  const target = document.querySelector('main');
  if (!target) throw new Error('캡처 대상을 찾을 수 없습니다.');

  await document.fonts.ready;

  const finalFileName = `${originalFileName.replace(/\.pdf$/i, '')} 분석.png`;

  const canvas = await html2canvas(target as HTMLElement, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#EBEBEB',
    onclone: (clonedDoc: Document) => {
      const cloneMain = clonedDoc.querySelector('main');
      if (!cloneMain) return;

      const allowedIds = ['file-info-bar', 'insight-section', 'summary-section'];
      Array.from(cloneMain.children).forEach((child) => {
        const el = child as HTMLElement;
        if (!allowedIds.includes(el.id)) {
          el.style.display = 'none';
        }
      });

      allowedIds.forEach((id) => {
        const el = clonedDoc.getElementById(id);
        if (el) {
          el.style.display = 'block';
          el.classList.remove('hidden');
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.animation = 'none';

          el.querySelectorAll('button').forEach((btn) => {
            (btn as HTMLElement).style.display = 'none';
          });
          el.querySelectorAll('.blur-3xl').forEach((blurEl) => {
            (blurEl as HTMLElement).style.display = 'none';
          });
        }
      });

      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        * {
          font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
          animation: none !important;
          transition: none !important;
        }
      `;
      clonedDoc.head.appendChild(style);
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.download = finalFileName;
  link.click();
}
