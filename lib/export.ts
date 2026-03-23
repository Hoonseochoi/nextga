// html2canvas-pro로 분석 결과를 PNG로 내보내기

export async function exportAsImage(originalFileName: string): Promise<void> {
  const html2canvas = (await import('html2canvas-pro')).default;

  const target = document.getElementById('capture-zone');
  if (!target) throw new Error('캡처 대상을 찾을 수 없습니다.');

  // 폰트 로딩 대기
  await document.fonts.ready;

  const finalFileName = `${originalFileName.replace(/\.pdf$/i, '')} 분석.png`;

  const canvas = await html2canvas(target, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#EBEBEB',
    // 넓은 뷰포트로 렌더링 → 카드 우측 잘림 방지
    windowWidth: 1280,
    onclone: (clonedDoc: Document) => {
      const zone = clonedDoc.getElementById('capture-zone');
      if (!zone) return;

      // 캡처 영역: 고정 너비 860px + 20px 패딩 → 총 900px (우측 잘림 방지)
      zone.style.width = '860px';
      zone.style.padding = '20px';
      zone.style.backgroundColor = '#EBEBEB';
      zone.style.overflow = 'visible';

      // sticky + backdrop 제거 (캡처 시 레이아웃 깨짐 방지)
      const fileInfoBar = clonedDoc.getElementById('file-info-bar');
      if (fileInfoBar) {
        fileInfoBar.style.position = 'relative';
        fileInfoBar.style.top = 'auto';
        fileInfoBar.style.zIndex = 'auto';
        fileInfoBar.style.backdropFilter = 'none';
        (fileInfoBar.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'none';
        fileInfoBar.style.backgroundColor = 'rgba(255,255,255,0.95)';
        // 버튼 숨김
        fileInfoBar.querySelectorAll('button').forEach((btn) => {
          (btn as HTMLElement).style.display = 'none';
        });
      }

      // 반응형 그리드 → 3열 고정 (html2canvas는 뷰포트 없어 lg: 브레이크포인트 미적용)
      zone.querySelectorAll('.grid').forEach((el) => {
        (el as HTMLElement).style.gridTemplateColumns = 'repeat(3, 1fr)';
      });

      // blur 장식 요소 제거
      zone.querySelectorAll('.blur-3xl').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // 애니메이션·트랜지션 제거 + 폰트 강제 지정
      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        * {
          font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
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
