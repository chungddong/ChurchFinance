// 통계 데이터 변수
let donations = [];
let expenses = [];
let members = [];
let filteredDonations = [];
let filteredExpenses = [];
let currentDataType = 'income'; // 'income', 'expense', 'combined'

// 부모 window의 데이터 서비스에서 데이터 로드
function loadData() {
    try {
        const dataService = parent.window.dataService;
        if (dataService) {
            donations = dataService.getDonations();
            expenses = dataService.getExpenses();
            members = dataService.getMembers();
        } else {
            donations = [];
            expenses = [];
            members = [];
        }
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        donations = [];
        expenses = [];
        members = [];
    }
    
    populateMemberDropdown();
    updateUIForDataType();
    
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

// 데이터 유형 설정
function setDataType(type) {
    currentDataType = type;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(type === 'income' ? 'incomeBtn' : 
                         type === 'expense' ? 'expenseBtn' : 'combinedBtn').classList.add('active');
    
    updateUIForDataType();
    applyFilters();
}

// UI 업데이트 (데이터 유형에 따라)
function updateUIForDataType() {
    const filterTypeLabel = document.getElementById('filterTypeLabel');
    const filterType = document.getElementById('filterType');
    const memberFilterGroup = document.getElementById('memberFilterGroup');
    const tableTitle = document.getElementById('tableTitle');
    const typeStatsTitle = document.getElementById('typeStatsTitle');
    const monthlyStatsTitle = document.getElementById('monthlyStatsTitle');
    
    if (currentDataType === 'income') {
        filterTypeLabel.textContent = '헌금 유형';
        memberFilterGroup.style.display = 'block';
        tableTitle.textContent = '상세 헌금 내역';
        typeStatsTitle.textContent = '헌금 유형별 통계';
        monthlyStatsTitle.textContent = '월별 헌금 현황';
        
        // 헌금 유형 옵션 설정
        filterType.innerHTML = `
            <option value="">전체 유형</option>
            <option value="십일조">십일조</option>
            <option value="감사헌금">감사헌금</option>
            <option value="특별헌금">특별헌금</option>
            <option value="선교헌금">선교헌금</option>
            <option value="건축헌금">건축헌금</option>
            <option value="절기헌금">절기헌금</option>
            <option value="기타">기타</option>
        `;
    } else if (currentDataType === 'expense') {
        filterTypeLabel.textContent = '지출 분류';
        memberFilterGroup.style.display = 'none';
        tableTitle.textContent = '상세 지출 내역';
        typeStatsTitle.textContent = '지출 분류별 통계';
        monthlyStatsTitle.textContent = '월별 지출 현황';
        
        // 지출 분류 옵션 설정
        filterType.innerHTML = `
            <option value="">전체 분류</option>
            <option value="시설관리">시설관리</option>
            <option value="전기요금">전기요금</option>
            <option value="가스요금">가스요금</option>
            <option value="수도요금">수도요금</option>
            <option value="전화요금">전화요금</option>
            <option value="인터넷요금">인터넷요금</option>
            <option value="사무용품">사무용품</option>
            <option value="청소용품">청소용품</option>
            <option value="예배용품">예배용품</option>
            <option value="교육용품">교육용품</option>
            <option value="선교비">선교비</option>
            <option value="구제비">구제비</option>
            <option value="행사비">행사비</option>
            <option value="교통비">교통비</option>
            <option value="음식비">음식비</option>
            <option value="기타">기타</option>
        `;
    } else { // combined
        filterTypeLabel.textContent = '분류/유형';
        memberFilterGroup.style.display = 'none';
        tableTitle.textContent = '상세 재정 내역';
        typeStatsTitle.textContent = '항목별 통계';
        monthlyStatsTitle.textContent = '월별 재정 현황';
        
        // 전체 분류 옵션 설정
        filterType.innerHTML = `
            <option value="">전체 항목</option>
            <optgroup label="헌금 유형">
                <option value="십일조">십일조</option>
                <option value="감사헌금">감사헌금</option>
                <option value="특별헌금">특별헌금</option>
                <option value="선교헌금">선교헌금</option>
                <option value="건축헌금">건축헌금</option>
                <option value="절기헌금">절기헌금</option>
            </optgroup>
            <optgroup label="지출 분류">
                <option value="시설관리">시설관리</option>
                <option value="전기요금">전기요금</option>
                <option value="가스요금">가스요금</option>
                <option value="수도요금">수도요금</option>
                <option value="전화요금">전화요금</option>
                <option value="인터넷요금">인터넷요금</option>
                <option value="사무용품">사무용품</option>
                <option value="청소용품">청소용품</option>
                <option value="예배용품">예배용품</option>
                <option value="교육용품">교육용품</option>
                <option value="선교비">선교비</option>
                <option value="구제비">구제비</option>
                <option value="행사비">행사비</option>
                <option value="교통비">교통비</option>
                <option value="음식비">음식비</option>
            </optgroup>
        `;
    }
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
    
    // 기간 필터 함수
    const filterByDate = (item) => {
        const itemDate = new Date(item.date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return itemDate >= start && itemDate <= end;
    };
    
    if (currentDataType === 'income') {
        // 헌금 데이터 필터링
        filteredDonations = donations.filter(donation => {
            const dateMatch = filterByDate(donation);
            const typeMatch = !filterType || donation.type === filterType;
            const memberMatch = !filterMember || donation.memberId == filterMember;
            return dateMatch && typeMatch && memberMatch;
        });
        filteredExpenses = [];
        showToast(`조회 완료: ${filteredDonations.length}건의 헌금 기록을 찾았습니다.`, 'success');
    } else if (currentDataType === 'expense') {
        // 지출 데이터 필터링
        filteredExpenses = expenses.filter(expense => {
            const dateMatch = filterByDate(expense);
            const typeMatch = !filterType || expense.category === filterType;
            return dateMatch && typeMatch;
        });
        filteredDonations = [];
        showToast(`조회 완료: ${filteredExpenses.length}건의 지출 기록을 찾았습니다.`, 'success');
    } else { // combined
        // 헌금과 지출 모두 필터링
        filteredDonations = donations.filter(donation => {
            const dateMatch = filterByDate(donation);
            const typeMatch = !filterType || donation.type === filterType;
            return dateMatch && typeMatch;
        });
        filteredExpenses = expenses.filter(expense => {
            const dateMatch = filterByDate(expense);
            const typeMatch = !filterType || expense.category === filterType;
            return dateMatch && typeMatch;
        });
        const totalCount = filteredDonations.length + filteredExpenses.length;
        showToast(`조회 완료: 수입 ${filteredDonations.length}건, 지출 ${filteredExpenses.length}건 (총 ${totalCount}건)`, 'success');
    }
    
    updateDisplay();
}

// 필터 초기화
function resetFilters() {
    document.getElementById('periodType').value = 'thisMonth';
    document.getElementById('filterType').value = '';
    document.getElementById('filterMember').value = '';
    
    handlePeriodChange(); // 이번달로 날짜 설정
    applyFilters();
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
    
    let tableHTML = '';
    let totalCount = 0;
    
    if (currentDataType === 'income') {
        if (filteredDonations.length === 0) {
            tableContainer.innerHTML = '<div class="no-data">조회할 헌금 내역이 없습니다.</div>';
            tableCount.textContent = '0';
            return;
        }
        
        const sortedDonations = [...filteredDonations].sort((a, b) => new Date(a.date) - new Date(b.date));
        totalCount = sortedDonations.length;
        
        tableHTML = `
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
                            <td class="amount-cell income-amount">+${donation.amount.toLocaleString()}원</td>
                            <td title="${memo}">${shortMemo}</td>
                            <td class="date-cell">${new Date(donation.recordedAt).toLocaleString('ko-KR')}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else if (currentDataType === 'expense') {
        if (filteredExpenses.length === 0) {
            tableContainer.innerHTML = '<div class="no-data">조회할 지출 내역이 없습니다.</div>';
            tableCount.textContent = '0';
            return;
        }
        
        const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        totalCount = sortedExpenses.length;
        
        tableHTML = `
            <table class="statistics-table">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>지출분류</th>
                        <th>지출액</th>
                        <th>결제방법</th>
                        <th>거래처</th>
                        <th>승인자</th>
                        <th>내용</th>
                        <th>등록일시</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedExpenses.map(expense => {
                        const description = expense.description || '-';
                        const shortDescription = description.length > 20 ? description.substring(0, 20) + '...' : description;
                        
                        return `
                        <tr>
                            <td class="date-cell">${new Date(expense.date).toLocaleDateString('ko-KR')}</td>
                            <td class="type-cell type-${expense.category}">${expense.category}</td>
                            <td class="amount-cell expense-amount">-${expense.amount.toLocaleString()}원</td>
                            <td>${expense.paymentMethod || '현금'}</td>
                            <td>${expense.vendor || '-'}</td>
                            <td>${expense.approver || '-'}</td>
                            <td title="${description}">${shortDescription}</td>
                            <td class="date-cell">${new Date(expense.recordedAt).toLocaleString('ko-KR')}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else { // combined
        const combinedData = [];
        
        // 헌금 데이터 추가
        filteredDonations.forEach(donation => {
            const member = members.find(m => m.id == donation.memberId);
            combinedData.push({
                date: donation.date,
                type: 'income',
                category: donation.type,
                amount: donation.amount,
                member: member ? member.name : '알 수 없음',
                memo: donation.memo || '-',
                recordedAt: donation.recordedAt
            });
        });
        
        // 지출 데이터 추가
        filteredExpenses.forEach(expense => {
            combinedData.push({
                date: expense.date,
                type: 'expense',
                category: expense.category,
                amount: expense.amount,
                vendor: expense.vendor || '-',
                paymentMethod: expense.paymentMethod || '현금',
                description: expense.description || '-',
                recordedAt: expense.recordedAt
            });
        });
        
        if (combinedData.length === 0) {
            tableContainer.innerHTML = '<div class="no-data">조회할 재정 내역이 없습니다.</div>';
            tableCount.textContent = '0';
            return;
        }
        
        const sortedData = combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        totalCount = sortedData.length;
        
        tableHTML = `
            <table class="statistics-table">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>구분</th>
                        <th>분류/유형</th>
                        <th>금액</th>
                        <th>세부사항</th>
                        <th>등록일시</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedData.map(item => {
                        const details = item.type === 'income' 
                            ? `성도: ${item.member}, 메모: ${item.memo}`
                            : `거래처: ${item.vendor}, 결제: ${item.paymentMethod}`;
                        const shortDetails = details.length > 40 ? details.substring(0, 40) + '...' : details;
                        
                        return `
                        <tr>
                            <td class="date-cell">${new Date(item.date).toLocaleDateString('ko-KR')}</td>
                            <td class="type-cell ${item.type === 'income' ? 'income-type' : 'expense-type'}">
                                ${item.type === 'income' ? '수입' : '지출'}
                            </td>
                            <td class="category-cell">${item.category}</td>
                            <td class="amount-cell ${item.type === 'income' ? 'income-amount' : 'expense-amount'}">
                                ${item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}원
                            </td>
                            <td title="${details}">${shortDetails}</td>
                            <td class="date-cell">${new Date(item.recordedAt).toLocaleString('ko-KR')}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    tableContainer.innerHTML = tableHTML;
    tableCount.textContent = totalCount;
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
    // 데이터 유형별 확인
    const hasData = currentDataType === 'income' ? filteredDonations.length > 0 :
                   currentDataType === 'expense' ? filteredExpenses.length > 0 :
                   (filteredDonations.length > 0 || filteredExpenses.length > 0);
                   
    if (!hasData) {
        showToast('내보낼 데이터가 없습니다.', 'error');
        return;
    }
    
    try {
        // Get church info
        const churchInfo = getChurchInfo();
        const churchName = churchInfo ? churchInfo.name : '00교회';
        
        let worksheetData = [];
        let worksheetName = '';
        let fileName = '';
        
        if (currentDataType === 'income') {
            // 헌금 데이터만
            const sortedDonations = [...filteredDonations].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            worksheetData = [
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
            
            worksheetName = '헌금통계';
            fileName = `헌금통계_${new Date().toISOString().split('T')[0]}.xlsx`;
            
        } else if (currentDataType === 'expense') {
            // 지출 데이터만
            const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            worksheetData = [
                // 헤더
                ['날짜', '지출분류', '지출액', '결제방법', '거래처', '승인자', '내용', '등록일시'],
                // 데이터
                ...sortedExpenses.map(expense => [
                    new Date(expense.date).toLocaleDateString('ko-KR'),
                    expense.category,
                    expense.amount,
                    expense.paymentMethod || '현금',
                    expense.vendor || '',
                    expense.approver || '',
                    expense.description || '',
                    new Date(expense.recordedAt).toLocaleString('ko-KR')
                ]),
                // Footer
                [''],
                ['────────────────────────────────────'],
                [`${churchName} 재정관리시스템`],
                [`발급일자: ${new Date().toLocaleDateString('ko-KR')}`]
            ];
            
            worksheetName = '지출통계';
            fileName = `지출통계_${new Date().toISOString().split('T')[0]}.xlsx`;
            
        } else { // combined
            // 헌금과 지출 통합
            const combinedData = [];
            
            filteredDonations.forEach(donation => {
                const member = members.find(m => m.id == donation.memberId);
                combinedData.push({
                    date: donation.date,
                    type: '수입',
                    category: donation.type,
                    amount: donation.amount,
                    details: `성도: ${member ? member.name : '알 수 없음'}`,
                    memo: donation.memo || '',
                    recordedAt: donation.recordedAt
                });
            });
            
            filteredExpenses.forEach(expense => {
                combinedData.push({
                    date: expense.date,
                    type: '지출',
                    category: expense.category,
                    amount: -expense.amount, // 음수로 표시
                    details: `거래처: ${expense.vendor || '-'}, 결제: ${expense.paymentMethod || '현금'}`,
                    memo: expense.description || '',
                    recordedAt: expense.recordedAt
                });
            });
            
            const sortedData = combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            worksheetData = [
                // 헤더
                ['날짜', '구분', '분류/유형', '금액', '세부사항', '메모/내용', '등록일시'],
                // 데이터
                ...sortedData.map(item => [
                    new Date(item.date).toLocaleDateString('ko-KR'),
                    item.type,
                    item.category,
                    item.amount,
                    item.details,
                    item.memo,
                    new Date(item.recordedAt).toLocaleString('ko-KR')
                ]),
                // Footer
                [''],
                ['────────────────────────────────────'],
                [`${churchName} 재정관리시스템`],
                [`발급일자: ${new Date().toLocaleDateString('ko-KR')}`]
            ];
            
            worksheetName = '재정통계';
            fileName = `재정통계_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        
        // Excel 워크시트 생성
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // 컬럼 너비 설정 (데이터 유형별)
        if (currentDataType === 'income') {
            worksheet['!cols'] = [
                { width: 12 }, // 날짜
                { width: 12 }, // 헌금유형
                { width: 15 }, // 성도명
                { width: 15 }, // 헌금액
                { width: 30 }, // 메모
                { width: 20 }  // 등록일시
            ];
        } else if (currentDataType === 'expense') {
            worksheet['!cols'] = [
                { width: 12 }, // 날짜
                { width: 12 }, // 지출분류
                { width: 15 }, // 지출액
                { width: 12 }, // 결제방법
                { width: 15 }, // 거래처
                { width: 12 }, // 승인자
                { width: 25 }, // 내용
                { width: 20 }  // 등록일시
            ];
        } else {
            worksheet['!cols'] = [
                { width: 12 }, // 날짜
                { width: 8 },  // 구분
                { width: 12 }, // 분류/유형
                { width: 15 }, // 금액
                { width: 25 }, // 세부사항
                { width: 20 }, // 메모/내용
                { width: 20 }  // 등록일시
            ];
        }
        
        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        
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
    // 데이터 유형별 확인
    const hasData = currentDataType === 'income' ? filteredDonations.length > 0 :
                   currentDataType === 'expense' ? filteredExpenses.length > 0 :
                   (filteredDonations.length > 0 || filteredExpenses.length > 0);
                   
    if (!hasData) {
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
    
    let title = '';
    let tableRows = '';
    let totalAmount = 0;
    let totalCount = 0;
    let participantCount = 0;
    let averageAmount = 0;
    
    if (currentDataType === 'income') {
        title = '헌금 통계 보고서';
        totalAmount = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
        totalCount = filteredDonations.length;
        participantCount = [...new Set(filteredDonations.map(d => d.memberId))].length;
        averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
        
        // 헌금 테이블 행 생성
        tableRows = filteredDonations
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
                    <td class="amount-col">+${donation.amount.toLocaleString()}원</td>
                    <td class="memo-col">${donation.memo || '-'}</td>
                </tr>
                `;
            }).join('');
            
    } else if (currentDataType === 'expense') {
        title = '지출 통계 보고서';
        totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalCount = filteredExpenses.length;
        participantCount = 0; // 지출에는 참여자 개념 없음
        averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
        
        // 지출 테이블 행 생성
        tableRows = filteredExpenses
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((expense, index) => {
                return `
                <tr>
                    <td class="number-col">${index + 1}</td>
                    <td class="date-col">${new Date(expense.date).toLocaleDateString('ko-KR')}</td>
                    <td class="type-col">${expense.category}</td>
                    <td class="vendor-col">${expense.vendor || '-'}</td>
                    <td class="amount-col">-${expense.amount.toLocaleString()}원</td>
                    <td class="memo-col">${expense.description || '-'}</td>
                </tr>
                `;
            }).join('');
            
    } else { // combined
        title = '재정 통계 보고서';
        const incomeTotal = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
        const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmount = incomeTotal - expenseTotal; // 순 수익/손실
        totalCount = filteredDonations.length + filteredExpenses.length;
        participantCount = [...new Set(filteredDonations.map(d => d.memberId))].length;
        
        // 통합 데이터 생성
        const combinedData = [];
        
        filteredDonations.forEach(donation => {
            const member = members.find(m => m.id == donation.memberId);
            combinedData.push({
                date: donation.date,
                type: '수입',
                category: donation.type,
                amount: donation.amount,
                details: member ? member.name : '알 수 없음',
                memo: donation.memo || '-'
            });
        });
        
        filteredExpenses.forEach(expense => {
            combinedData.push({
                date: expense.date,
                type: '지출',
                category: expense.category,
                amount: expense.amount,
                details: expense.vendor || '-',
                memo: expense.description || '-'
            });
        });
        
        // 통합 테이블 행 생성
        tableRows = combinedData
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((item, index) => {
                return `
                <tr>
                    <td class="number-col">${index + 1}</td>
                    <td class="date-col">${new Date(item.date).toLocaleDateString('ko-KR')}</td>
                    <td class="type-col ${item.type === '수입' ? 'income-type' : 'expense-type'}">${item.type}</td>
                    <td class="category-col">${item.category}</td>
                    <td class="amount-col ${item.type === '수입' ? 'income-amount' : 'expense-amount'}">
                        ${item.type === '수입' ? '+' : '-'}${item.amount.toLocaleString()}원
                    </td>
                    <td class="details-col">${item.details}</td>
                    <td class="memo-col">${item.memo}</td>
                </tr>
                `;
            }).join('');
    }

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
                <h1>${title}</h1>
                <div class="header-info">조회 기간: ${periodInfo}</div>
            </div>
            
            <div class="summary">
                ${currentDataType === 'income' ? `
                <div class="summary-item">
                    <div class="summary-label">총 헌금액</div>
                    <div class="summary-value">${totalAmount.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 건수</div>
                    <div class="summary-value">${totalCount}건</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">참여자 수</div>
                    <div class="summary-value">${participantCount}명</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">평균 헌금액</div>
                    <div class="summary-value">${averageAmount.toLocaleString()}원</div>
                </div>
                ` : currentDataType === 'expense' ? `
                <div class="summary-item">
                    <div class="summary-label">총 지출액</div>
                    <div class="summary-value">${totalAmount.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 건수</div>
                    <div class="summary-value">${totalCount}건</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">평균 지출액</div>
                    <div class="summary-value">${averageAmount.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">-</div>
                    <div class="summary-value">-</div>
                </div>
                ` : `
                <div class="summary-item">
                    <div class="summary-label">총 수입</div>
                    <div class="summary-value income-amount">+${filteredDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 지출</div>
                    <div class="summary-value expense-amount">-${filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">순 손익</div>
                    <div class="summary-value ${totalAmount >= 0 ? 'income-amount' : 'expense-amount'}">${totalAmount >= 0 ? '+' : ''}${totalAmount.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 건수</div>
                    <div class="summary-value">${totalCount}건</div>
                </div>
                `}
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        ${currentDataType === 'income' ? `
                        <th class="number-col">번호</th>
                        <th class="date-col">헌금일</th>
                        <th class="type-col">유형</th>
                        <th class="member-col">성도명</th>
                        <th class="amount-col">헌금액</th>
                        <th class="memo-col">메모</th>
                        ` : currentDataType === 'expense' ? `
                        <th class="number-col">번호</th>
                        <th class="date-col">지출일</th>
                        <th class="type-col">분류</th>
                        <th class="vendor-col">거래처</th>
                        <th class="amount-col">지출액</th>
                        <th class="memo-col">내용</th>
                        ` : `
                        <th class="number-col">번호</th>
                        <th class="date-col">날짜</th>
                        <th class="type-col">구분</th>
                        <th class="category-col">분류/유형</th>
                        <th class="amount-col">금액</th>
                        <th class="details-col">세부사항</th>
                        <th class="memo-col">메모/내용</th>
                        `}
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