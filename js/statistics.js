// 통계 데이터 변수
let donations = [];
let members = [];
let filteredDonations = [];

// 부모 window의 데이터 서비스에서 데이터 로드
function loadData() {
    try {
        const dataService = parent.window.dataService;
        if (dataService) {
            donations = dataService.getDonations();
            members = dataService.getMembers();
        } else {
            donations = [];
            members = [];
        }
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        donations = [];
        members = [];
    }
    
    populateMemberDropdown();
    
    // 기본값을 이번달로 설정하고 자동 조회
    document.getElementById('periodType').value = 'thisMonth';
    handlePeriodChange();
    applyFilters();
}

// 성도 드롭다운 채우기
function populateMemberDropdown() {
    const dropdown = document.getElementById('filterMember');
    
    // 기존 옵션 제거 (첫 번째 옵션 제외)
    while (dropdown.children.length > 1) {
        dropdown.removeChild(dropdown.lastChild);
    }
    
    // 성도 목록 추가
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} (${member.phone})`;
        dropdown.appendChild(option);
    });
}

// 기간 유형 변경 처리
function handlePeriodChange() {
    const periodType = document.getElementById('periodType').value;
    const customPeriod = document.getElementById('customPeriod');
    const customPeriodEnd = document.getElementById('customPeriodEnd');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (periodType === 'custom') {
        customPeriod.classList.remove('hidden');
        customPeriodEnd.classList.remove('hidden');
    } else {
        customPeriod.classList.add('hidden');
        customPeriodEnd.classList.add('hidden');
        
        // 미리 정의된 기간 설정
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        switch (periodType) {
            case 'thisMonth':
                startDate.value = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
                endDate.value = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
                break;
                
            case 'lastMonth':
                startDate.value = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
                endDate.value = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
                break;
                
            case 'thisYear':
                startDate.value = new Date(currentYear, 0, 1).toISOString().split('T')[0];
                endDate.value = new Date(currentYear, 11, 31).toISOString().split('T')[0];
                break;
                
            case 'lastYear':
                startDate.value = new Date(currentYear - 1, 0, 1).toISOString().split('T')[0];
                endDate.value = new Date(currentYear - 1, 11, 31).toISOString().split('T')[0];
                break;
        }
    }
}

// 필터 적용
function applyFilters() {
    const periodType = document.getElementById('periodType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const filterType = document.getElementById('filterType').value;
    const filterMember = document.getElementById('filterMember').value;
    
    // 데이터 필터링
    filteredDonations = donations.filter(donation => {
        // 기간 필터
        const donationDate = new Date(donation.date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        
        const dateMatch = donationDate >= start && donationDate <= end;
        
        // 유형 필터
        const typeMatch = !filterType || donation.type === filterType;
        
        // 성도 필터
        const memberMatch = !filterMember || donation.memberId == filterMember;
        
        return dateMatch && typeMatch && memberMatch;
    });
    
    updateDisplay();
    showToast(`조회 완료: ${filteredDonations.length}건의 헌금 기록을 찾았습니다.`, 'success');
}

// 필터 초기화
function resetFilters() {
    document.getElementById('periodType').value = 'thisMonth';
    document.getElementById('filterType').value = '';
    document.getElementById('filterMember').value = '';
    
    handlePeriodChange(); // 이번달로 날짜 설정
    filteredDonations = [...donations];
    updateDisplay();
}

// 화면 업데이트
function updateDisplay() {
    updateStatisticsTable();
    updateTypeStatistics();
    updateMonthlyStatistics();
    updatePeriodInfo();
}

// 통계 테이블 업데이트
function updateStatisticsTable() {
    const tableContainer = document.getElementById('statisticsTable');
    const tableCount = document.getElementById('tableCount');
    
    if (filteredDonations.length === 0) {
        tableContainer.innerHTML = '<div class="no-data">조회할 헌금 내역이 없습니다.</div>';
        tableCount.textContent = '0';
        return;
    }
    
    // 날짜순 정렬 (빠른날이 먼저)
    const sortedDonations = [...filteredDonations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const tableHTML = `
        <table class="statistics-table">
            <thead>
                <tr>
                    <th>날짜</th>
                    <th>헌금유형</th>
                    <th>성도명</th>
                    <th>헌금액</th>
                    <th>메모</th>
                    <th>등록일시</th>
                </tr>
            </thead>
            <tbody>
                ${sortedDonations.map(donation => {
                    const member = members.find(m => m.id == donation.memberId);
                    const memberName = member ? member.name : '알 수 없음';
                    const memo = donation.memo || '-';
                    const shortMemo = memo.length > 30 ? memo.substring(0, 30) + '...' : memo;
                    
                    return `
                    <tr>
                        <td class="date-cell">${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                        <td class="type-cell type-${donation.type}">${donation.type}</td>
                        <td>${memberName}</td>
                        <td class="amount-cell">${donation.amount.toLocaleString()}원</td>
                        <td title="${memo}">${shortMemo}</td>
                        <td class="date-cell">${new Date(donation.recordedAt).toLocaleString('ko-KR')}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    tableCount.textContent = filteredDonations.length;
}

// 유형별 통계 업데이트
function updateTypeStatistics() {
    const container = document.getElementById('typeStatsContainer');
    
    // 유형별 집계
    const typeStats = {};
    const donationTypes = ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    
    donationTypes.forEach(type => {
        typeStats[type] = {
            amount: 0,
            count: 0
        };
    });
    
    filteredDonations.forEach(donation => {
        if (typeStats[donation.type]) {
            typeStats[donation.type].amount += donation.amount;
            typeStats[donation.type].count += 1;
        }
    });
    
    // 데이터가 있는 유형만 표시
    const hasData = Object.values(typeStats).some(stat => stat.count > 0);
    
    if (!hasData) {
        container.innerHTML = '<div class="no-data">조회할 데이터가 없습니다.</div>';
        return;
    }
    
    const cardsHTML = donationTypes
        .filter(type => typeStats[type].count > 0)
        .map(type => `
            <div class="type-stat-card type-stat-${type}">
                <div class="type-stat-type">${type}</div>
                <div class="type-stat-amount">${typeStats[type].amount.toLocaleString()}원</div>
                <div class="type-stat-count">${typeStats[type].count}건</div>
            </div>
        `).join('');
    
    container.innerHTML = cardsHTML;
}

// 월별 통계 업데이트
function updateMonthlyStatistics() {
    const section = document.getElementById('monthlyStatsSection');
    const container = document.getElementById('monthlyStatsContainer');
    const periodType = document.getElementById('periodType').value;
    
    // 연간 조회일 때만 월별 통계 표시
    if (periodType !== 'thisYear' && periodType !== 'lastYear') {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    // 월별 집계
    const monthlyStats = {};
    for (let i = 1; i <= 12; i++) {
        monthlyStats[i] = {
            amount: 0,
            count: 0
        };
    }
    
    filteredDonations.forEach(donation => {
        const month = new Date(donation.date).getMonth() + 1;
        monthlyStats[month].amount += donation.amount;
        monthlyStats[month].count += 1;
    });
    
    const cardsHTML = Object.keys(monthlyStats).map(month => `
        <div class="monthly-stat-card">
            <div class="monthly-stat-month">${month}월</div>
            <div class="monthly-stat-amount">${monthlyStats[month].amount.toLocaleString()}원</div>
            <div class="monthly-stat-count">${monthlyStats[month].count}건</div>
        </div>
    `).join('');
    
    container.innerHTML = cardsHTML;
}

// 기간 정보 업데이트
function updatePeriodInfo() {
    const periodInfo = document.getElementById('periodInfo');
    const periodType = document.getElementById('periodType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let periodText = '전체';
    
    if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('ko-KR');
        const end = new Date(endDate).toLocaleDateString('ko-KR');
        periodText = `${start} ~ ${end}`;
    } else if (startDate) {
        periodText = `${new Date(startDate).toLocaleDateString('ko-KR')} 이후`;
    } else if (endDate) {
        periodText = `${new Date(endDate).toLocaleDateString('ko-KR')} 이전`;
    }
    
    periodInfo.textContent = periodText;
}

// 엑셀 다운로드
function exportToExcel() {
    if (filteredDonations.length === 0) {
        showToast('내보낼 데이터가 없습니다.', 'error');
        return;
    }
    
    try {
        // 날짜순 정렬 (빠른날이 먼저)
        const sortedDonations = [...filteredDonations].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get church info
        const churchInfo = getChurchInfo();
        const churchName = churchInfo ? churchInfo.name : '00교회';
        
        // Excel 데이터 생성
        const worksheetData = [
            // 헤더
            ['날짜', '헌금유형', '성도명', '헌금액', '메모', '등록일시'],
            // 데이터
            ...sortedDonations.map(donation => {
                const member = members.find(m => m.id == donation.memberId);
                const memberName = member ? member.name : '알 수 없음';
                
                return [
                    new Date(donation.date).toLocaleDateString('ko-KR'),
                    donation.type,
                    memberName,
                    donation.amount,
                    donation.memo || '',
                    new Date(donation.recordedAt).toLocaleString('ko-KR')
                ];
            }),
            // Footer
            [''],
            ['────────────────────────────────────'],
            [`${churchName} 재정관리시스템`],
            [`발급일자: ${new Date().toLocaleDateString('ko-KR')}`]
        ];
        
        // Excel 워크시트 생성
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // 컬럼 너비 설정
        worksheet['!cols'] = [
            { width: 12 }, // 날짜
            { width: 12 }, // 헌금유형
            { width: 15 }, // 성도명
            { width: 15 }, // 헌금액
            { width: 30 }, // 메모
            { width: 20 }  // 등록일시
        ];
        
        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '헌금통계');
        
        // 파일명 생성
        const currentDate = new Date().toISOString().split('T')[0];
        const fileName = `헌금통계_${currentDate}.xlsx`;
        
        // Excel 파일 다운로드
        XLSX.writeFile(workbook, fileName);
        
        showToast('엑셀 파일이 다운로드되었습니다.', 'success');
    } catch (error) {
        console.error('엑셀 다운로드 오류:', error);
        showToast('엑셀 다운로드를 위해 XLSX 라이브러리가 필요합니다.', 'error');
    }
}

// PDF 다운로드
function exportToPDF() {
    if (filteredDonations.length === 0) {
        showToast('내보낼 데이터가 없습니다.', 'error');
        return;
    }
    
    try {
        // PDF용 HTML 생성
        const pdfContent = generatePDFContent();
        
        // 새 창에서 PDF 미리보기 (인쇄 대화상자 자동 열림)
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        // 페이지 로드 후 인쇄 대화상자 열기
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
        
        showToast('PDF 미리보기 창이 열렸습니다.', 'success');
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        showToast('PDF 생성 중 오류가 발생했습니다.', 'error');
    }
}

// PDF용 HTML 생성
function generatePDFContent() {
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    const timeString = currentDate.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const periodInfo = document.getElementById('periodInfo').textContent;
    const totalAmount = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
    
    // 테이블 행 생성
    const tableRows = filteredDonations
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((donation, index) => {
            const member = members.find(m => m.id == donation.memberId);
            const memberName = member ? member.name : '알 수 없음';
            
            return `
            <tr>
                <td class="number-col">${index + 1}</td>
                <td class="date-col">${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                <td class="type-col">${donation.type}</td>
                <td class="member-col">${memberName}</td>
                <td class="amount-col">${donation.amount.toLocaleString()}원</td>
                <td class="memo-col">${donation.memo || '-'}</td>
            </tr>
            `;
        }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>헌금 통계 보고서</title>
            <style>
                body {
                    font-family: 'Malgun Gothic', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    font-size: 12px;
                    line-height: 1.4;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                    margin: 0 0 10px 0;
                    color: #333;
                }
                
                .header-info {
                    font-size: 14px;
                    color: #666;
                    margin: 5px 0;
                }
                
                .summary {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                }
                
                .summary-item {
                    text-align: center;
                }
                
                .summary-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .summary-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                }
                
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                .table th,
                .table td {
                    border: 1px solid #333;
                    padding: 8px 6px;
                    text-align: left;
                    vertical-align: top;
                    word-wrap: break-word;
                }
                
                .table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                    font-size: 11px;
                }
                
                .table td {
                    font-size: 10px;
                }
                
                .number-col { width: 6%; text-align: center; }
                .date-col { width: 12%; text-align: center; }
                .type-col { width: 12%; font-weight: bold; }
                .member-col { width: 12%; }
                .amount-col { width: 15%; text-align: right; font-weight: bold; }
                .memo-col { width: 43%; }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                    border-top: 1px solid #ccc;
                    padding-top: 15px;
                }
                
                @page {
                    margin: 1.5cm;
                    size: A4 landscape;
                }
                
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>헌금 통계 보고서</h1>
                <div class="header-info">조회 기간: ${periodInfo}</div>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">총 헌금액</div>
                    <div class="summary-value">${totalAmount.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 건수</div>
                    <div class="summary-value">${filteredDonations.length}건</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">참여자 수</div>
                    <div class="summary-value">${[...new Set(filteredDonations.map(d => d.memberId))].length}명</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">평균 헌금액</div>
                    <div class="summary-value">${Math.round(totalAmount / filteredDonations.length).toLocaleString()}원</div>
                </div>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th class="number-col">번호</th>
                        <th class="date-col">헌금일</th>
                        <th class="type-col">유형</th>
                        <th class="member-col">성도명</th>
                        <th class="amount-col">헌금액</th>
                        <th class="memo-col">메모</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="footer">
                <div>────────────────────────────────────</div>
                <div>${getChurchInfo().name} 재정관리시스템</div>
                <div>발급일자: ${new Date().toLocaleDateString('ko-KR')}</div>
            </div>
        </body>
        </html>
    `;
}

// 토스트 메시지 표시
function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 기본값을 "이번 달"로 설정
    document.getElementById('periodType').value = 'thisMonth';
    handlePeriodChange(); // 이번 달 날짜 자동 설정
    
    loadData();
    
    // 데이터 변경 감지 (부모 창의 데이터가 변경되었을 때)
    setInterval(() => {
        const dataService = parent.window.dataService;
        if (dataService) {
            const currentDonations = dataService.getDonations();
            const currentMembers = dataService.getMembers();
            
            if (currentDonations.length !== donations.length || currentMembers.length !== members.length) {
                loadData();
            }
        }
    }, 3000); // 3초마다 확인
});

// Helper functions to get settings
function getChurchInfo() {
    try {
        if (window.parent && window.parent.getChurchInfo) {
            return window.parent.getChurchInfo();
        } else if (window.getChurchInfo) {
            return window.getChurchInfo();
        } else {
            const saved = localStorage.getItem('churchInfo');
            return saved ? JSON.parse(saved) : { name: '00교회' };
        }
    } catch (error) {
        console.error('Error getting church info:', error);
        return { name: '00교회' };
    }
}