// Receipt Management JavaScript
let dataService;
let currentMemberDonations = [];
let filteredDonations = [];
let selectedDonations = new Set();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Receipt page DOM loaded');
    
    // Try to get dataService from parent window (iframe context)
    if (window.parent && window.parent !== window && typeof window.parent.dataService !== 'undefined') {
        console.log('Using parent window dataService');
        dataService = window.parent.dataService;
        initializePage();
    } else if (typeof window.dataService !== 'undefined') {
        console.log('Using window dataService');
        dataService = window.dataService;
        initializePage();
    } else {
        console.log('Creating new dataService instance');
        // Create a new DataService instance if not available
        try {
            // Import DataService class from common.js context
            const script = document.createElement('script');
            script.src = '../js/common.js';
            script.onload = function() {
                console.log('Common.js loaded, trying again...');
                if (typeof window.dataService !== 'undefined') {
                    dataService = window.dataService;
                    initializePage();
                } else {
                    console.error('Still no DataService available');
                    showNoData('데이터 서비스를 초기화할 수 없습니다.');
                }
            };
            script.onerror = function() {
                console.error('Failed to load common.js');
                showNoData('데이터 서비스를 초기화할 수 없습니다.');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error creating DataService:', error);
            showNoData('데이터 서비스를 찾을 수 없습니다.');
        }
    }
});

function initializePage() {
    loadMemberSelect();
    loadDonationTypeFilters();
    setDefaultPeriod();
    setupEventListeners();
}

function loadMemberSelect() {
    const memberSelect = document.getElementById('memberSelect');
    
    if (!dataService) {
        console.error('DataService is not available');
        return;
    }
    
    const members = dataService.getAllMembers();
    console.log('Members loaded:', members);
    
    // Clear existing options except the first one
    memberSelect.innerHTML = '<option value="">성도를 선택하세요</option>';
    
    if (!members || members.length === 0) {
        console.warn('No members found');
        return;
    }
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        memberSelect.appendChild(option);
        console.log('Added member option:', member.name);
    });
}

function setDefaultPeriod() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1); // 올해 1월 1일
    const endDate = new Date(now.getFullYear(), 11, 31); // 올해 12월 31일
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

function setupEventListeners() {
    // Period type change handler
    document.getElementById('periodType').addEventListener('change', handlePeriodChange);
    
    // Member selection change
    document.getElementById('memberSelect').addEventListener('change', loadMemberDonations);
    
    // Date change handlers
    document.getElementById('startDate').addEventListener('change', loadMemberDonations);
    document.getElementById('endDate').addEventListener('change', loadMemberDonations);
    
    // Filter type change
    document.getElementById('filterType').addEventListener('change', loadMemberDonations);
    
    // Button handlers
    document.getElementById('applyFiltersBtn').addEventListener('click', loadMemberDonations);
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    
    // 헌금 유형 변경 감지 (3초마다)
    setInterval(() => {
        try {
            const saved = localStorage.getItem('donationTypes');
            const currentDonationTypes = saved ? JSON.parse(saved) : [];
            const lastKnownTypes = window.lastKnownDonationTypes || [];
            
            if (JSON.stringify(currentDonationTypes) !== JSON.stringify(lastKnownTypes)) {
                window.lastKnownDonationTypes = currentDonationTypes;
                loadDonationTypeFilters();
            }
        } catch (error) {
            console.error('Error checking donation types changes:', error);
        }
    }, 3000);
}

function handlePeriodChange() {
    const periodType = document.getElementById('periodType').value;
    const customPeriod = document.getElementById('customPeriod');
    const customPeriodEnd = document.getElementById('customPeriodEnd');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (periodType === 'custom') {
        customPeriod.classList.add('show');
        customPeriodEnd.classList.add('show');
    } else {
        customPeriod.classList.remove('show');
        customPeriodEnd.classList.remove('show');
        
        const now = new Date();
        let startDate, endDate;
        
        switch (periodType) {
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'lastYear':
                startDate = new Date(now.getFullYear() - 1, 0, 1);
                endDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
        }
        
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
}

function loadMemberDonations() {
    const memberId = document.getElementById('memberSelect').value;
    console.log('Selected member ID:', memberId);
    
    if (!memberId) {
        showNoData('성도를 선택하여 헌금 내역을 조회하세요.');
        document.getElementById('memberInfo').style.display = 'none';
        return;
    }
    
    const member = dataService.getMemberById(memberId);
    console.log('Found member:', member);
    if (!member) {
        showNoData('선택된 성도 정보를 찾을 수 없습니다.');
        return;
    }
    
    // Show member info
    document.getElementById('selectedMemberName').textContent = member.name;
    document.getElementById('memberInfo').style.display = 'block';
    
    // Get member's donations
    currentMemberDonations = dataService.getDonationsByMember(memberId);
    console.log('Member donations found:', currentMemberDonations);
    
    if (currentMemberDonations.length === 0) {
        showNoData(`${member.name}님의 헌금 내역이 없습니다.`);
        return;
    }
    
    // Apply filters and display
    applyFilters();
}

function applyFilters() {
    const memberId = document.getElementById('memberSelect').value;
    console.log('applyFilters - memberId:', memberId);
    if (!memberId) {
        showToast('성도를 먼저 선택해주세요.', 'error');
        return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const filterType = document.getElementById('filterType').value;
    
    console.log('Filter parameters:', { startDate, endDate, filterType });
    
    if (!startDate || !endDate) {
        showToast('조회 기간을 설정해주세요.', 'error');
        return;
    }
    
    console.log('currentMemberDonations before filter:', currentMemberDonations);
    
    // Filter donations
    filteredDonations = currentMemberDonations.filter(donation => {
        const donationDate = new Date(donation.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        console.log('Checking donation:', donation, 'Date check:', donationDate, start, end);
        
        // Date range check
        if (donationDate < start || donationDate > end) {
            console.log('Date filter failed');
            return false;
        }
        
        // Type filter check
        if (filterType && donation.type !== filterType) {
            console.log('Type filter failed');
            return false;
        }
        
        console.log('Donation passed filters');
        return true;
    });
    
    console.log('filteredDonations after filter:', filteredDonations);
    
    // Sort by date (earliest first)
    filteredDonations.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (filteredDonations.length === 0) {
        showNoData('조회 조건에 맞는 헌금 내역이 없습니다.');
        return;
    }
    
    displayDonationsTable();
    resetSelection();
}

function displayDonationsTable() {
    const container = document.getElementById('donationsTable');
    
    let totalAmount = 0;
    const tableHTML = `
        <table class="donations-table">
            <thead>
                <tr>
                    <th>선택</th>
                    <th>날짜</th>
                    <th>헌금유형</th>
                    <th>헌금액</th>
                    <th>메모</th>
                    <th>등록일시</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDonations.map((donation, index) => {
                    totalAmount += donation.amount;
                    return `
                        <tr data-donation-id="${donation.id}">
                            <td>
                                <label class="checkbox-wrapper">
                                    <input type="checkbox" class="donation-checkbox" data-donation-id="${donation.id}" onchange="handleDonationSelection()">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td>${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                            <td>${donation.type}</td>
                            <td class="amount-cell">${donation.amount.toLocaleString()}</td>
                            <td>${donation.memo || '-'}</td>
                            <td>${new Date(donation.recordedAt).toLocaleString('ko-KR')}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    
    // Update totals
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('tableSummary').style.display = 'block';
    
    updateSelectedCount();
}

// 헌금 유형 필터 로드
function loadDonationTypeFilters() {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;
    
    try {
        // localStorage에서 직접 헌금 유형 읽기
        let donationTypes = [];
        try {
            const saved = localStorage.getItem('donationTypes');
            donationTypes = saved ? JSON.parse(saved) : ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
        } catch (error) {
            console.error('Error getting donation types:', error);
            donationTypes = ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
        }
        
        // 현재 선택된 값 저장
        const currentValue = typeFilter.value;
        
        // 전체 옵션 제외하고 모든 옵션 제거
        const allOption = typeFilter.querySelector('option[value=""]');
        typeFilter.innerHTML = '';
        if (allOption) {
            typeFilter.appendChild(allOption);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '전체 유형';
            typeFilter.appendChild(option);
        }
        
        // 헌금 유형 목록 추가
        donationTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
        
        // 이전 선택값 복원
        if (currentValue && donationTypes.includes(currentValue)) {
            typeFilter.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading donation type filters:', error);
    }
}

// 성도의 헌금 내역 로드
function loadMemberDonations() {
    const memberSelect = document.getElementById('memberSelect');
    const selectedMemberId = memberSelect.value;
    
    if (!selectedMemberId) {
        showNoData('성도를 선택하여 헌금 내역을 조회하세요.');
        document.getElementById('memberInfo').style.display = 'none';
        return;
    }
    
    if (!dataService) {
        showNoData('데이터 서비스가 초기화되지 않았습니다.');
        return;
    }
    
    // 선택된 성도 정보 표시
    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
    document.getElementById('selectedMemberName').textContent = selectedOption.text.split(' (')[0];
    document.getElementById('memberInfo').style.display = 'block';
    
    // 해당 성도의 헌금 내역 가져오기
    const allDonations = dataService.getDonations();
    const memberDonations = allDonations.filter(d => d.memberId == selectedMemberId);
    
    // 기간 필터 적용
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const typeFilter = document.getElementById('filterType').value;
    
    const filteredDonations = memberDonations.filter(donation => {
        const donationDate = new Date(donation.date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        
        const dateMatch = donationDate >= start && donationDate <= end;
        const typeMatch = !typeFilter || donation.type === typeFilter;
        
        return dateMatch && typeMatch;
    });
    
    displayDonations(filteredDonations);
}

// 헌금 내역 표시
function displayDonations(donations) {
    const container = document.getElementById('donationsTable');
    
    if (donations.length === 0) {
        showNoData('조회된 헌금 내역이 없습니다.');
        return;
    }
    
    // 날짜순 정렬 (최신 순)
    const sortedDonations = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableHTML = `
        <table class="donations-table">
            <thead>
                <tr>
                    <th class="select-col">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" style="display: none;">
                            <span class="checkmark"></span>
                        </label>
                    </th>
                    <th class="date-col">헌금일</th>
                    <th class="type-col">헌금유형</th>
                    <th class="amount-col">헌금액</th>
                    <th class="memo-col">메모</th>
                    <th class="recorded-col">등록일</th>
                </tr>
            </thead>
            <tbody>
                ${sortedDonations.map(donation => `
                    <tr data-donation-id="${donation.id}">
                        <td class="select-col">
                            <label class="checkbox-wrapper">
                                <input type="checkbox" class="donation-checkbox" value="${donation.id}">
                                <span class="checkmark"></span>
                            </label>
                        </td>
                        <td class="date-col">${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                        <td class="type-col">${donation.type}</td>
                        <td class="amount-col">${donation.amount.toLocaleString()}원</td>
                        <td class="memo-col">${donation.memo || '-'}</td>
                        <td class="recorded-col">${new Date(donation.recordedAt).toLocaleDateString('ko-KR')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    
    // 체크박스 이벤트 리스너 추가
    container.querySelectorAll('.donation-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleDonationSelection);
    });
    
    // 총액 계산 및 표시
    const totalAmount = sortedDonations.reduce((sum, donation) => sum + donation.amount, 0);
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('tableSummary').style.display = 'block';
    
    updateSelectedCount();
}

// 필터 리셋
function resetFilters() {
    document.getElementById('memberSelect').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('periodType').value = 'thisYear';
    handlePeriodChange();
    showNoData('성도를 선택하여 헌금 내역을 조회하세요.');
    document.getElementById('memberInfo').style.display = 'none';
    resetSelection();
}

function showNoData(message) {
    const container = document.getElementById('donationsTable');
    container.innerHTML = `<div class="no-data">${message}</div>`;
    document.getElementById('tableSummary').style.display = 'none';
    resetSelection();
}

function resetSelection() {
    selectedDonations.clear();
    document.getElementById('selectAll').checked = false;
    updateSelectedCount();
    updateExportButtons();
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const donationCheckboxes = document.querySelectorAll('.donation-checkbox');
    
    if (selectAllCheckbox.checked) {
        // Select all
        donationCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedDonations.add(checkbox.dataset.donationId);
        });
    } else {
        // Deselect all
        donationCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedDonations.clear();
    }
    
    updateSelectedCount();
    updateExportButtons();
    highlightSelectedRows();
}

function handleDonationSelection() {
    console.log('handleDonationSelection called');
    selectedDonations.clear();
    
    const donationCheckboxes = document.querySelectorAll('.donation-checkbox');
    console.log('Found checkboxes:', donationCheckboxes.length);
    
    donationCheckboxes.forEach(checkbox => {
        console.log('Checkbox:', checkbox.dataset.donationId, 'checked:', checkbox.checked);
        if (checkbox.checked) {
            selectedDonations.add(checkbox.dataset.donationId);
        }
    });
    
    console.log('Selected donations after update:', selectedDonations);
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectedDonations.size === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedDonations.size === donationCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
    
    updateSelectedCount();
    updateExportButtons();
    highlightSelectedRows();
}

function highlightSelectedRows() {
    const rows = document.querySelectorAll('.donations-table tbody tr');
    rows.forEach(row => {
        const donationId = row.dataset.donationId;
        if (selectedDonations.has(donationId)) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    });
}

function updateSelectedCount() {
    const count = selectedDonations.size;
    document.getElementById('selectedCount').textContent = `${count}개 선택`;
    
    // Update selected total
    if (count > 0) {
        const selectedTotal = filteredDonations
            .filter(donation => selectedDonations.has(donation.id))
            .reduce((sum, donation) => sum + donation.amount, 0);
        document.getElementById('selectedTotal').textContent = selectedTotal.toLocaleString();
    } else {
        document.getElementById('selectedTotal').textContent = '0';
    }
}

function updateExportButtons() {
    const hasSelection = selectedDonations.size > 0;
    document.getElementById('excelBtn').disabled = !hasSelection;
    document.getElementById('pdfBtn').disabled = !hasSelection;
}

function resetFilters() {
    // Reset form values
    document.getElementById('memberSelect').value = '';
    document.getElementById('periodType').value = 'thisYear';
    document.getElementById('filterType').value = '';
    
    // Reset period
    setDefaultPeriod();
    handlePeriodChange();
    
    // Clear data
    showNoData('성도를 선택하여 헌금 내역을 조회하세요.');
    document.getElementById('memberInfo').style.display = 'none';
    
    currentMemberDonations = [];
    filteredDonations = [];
    resetSelection();
}

function exportToExcel() {
    if (selectedDonations.size === 0) {
        showToast('선택된 항목이 없습니다.', 'error');
        return;
    }
    
    const memberId = document.getElementById('memberSelect').value;
    const member = dataService.getMemberById(memberId);
    
    console.log('Excel export - Selected donations Set:', selectedDonations);
    console.log('Excel export - Filtered donations:', filteredDonations);
    
    const selectedData = filteredDonations.filter(donation => {
        const hasId = selectedDonations.has(donation.id.toString());
        console.log('Checking donation ID:', donation.id, 'Type:', typeof donation.id, 'Has in set:', hasId);
        return hasId;
    });
    
    console.log('Excel export - Selected data:', selectedData);
    
    // Get church info
    const churchInfo = getChurchInfo();
    const churchName = churchInfo ? churchInfo.name : '00교회';
    
    // Create worksheet data
    const worksheetData = [
        [`${churchName} 기부금 영수증`],
        [''],
        [`발급대상: ${member.name}님`],
        [`연락처: ${member.phone || '-'}`],
        [`주소: ${member.address || '-'}`],
        [''],
        ['날짜', '헌금유형', '헌금액', '메모'],
        ...selectedData.map(donation => [
            new Date(donation.date).toLocaleDateString('ko-KR'),
            donation.type,
            donation.amount,
            donation.memo || ''
        ]),
        [''],
        ['총액', '', selectedData.reduce((sum, d) => sum + d.amount, 0), ''],
        [''],
        ['─────────────────────────────────────'],
        [`${churchName} 재정관리시스템`],
        [`발급일자: ${new Date().toLocaleDateString('ko-KR')}`]
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    ws['!cols'] = [
        { width: 15 }, // 날짜
        { width: 15 }, // 헌금유형
        { width: 15 }, // 헌금액
        { width: 30 }  // 메모
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, '기부금영수증');
    
    // Generate filename
    const filename = `기부금영수증_${member.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    showToast('Excel 파일이 다운로드되었습니다.');
}

function exportToPDF() {
    if (selectedDonations.size === 0) {
        showToast('선택된 항목이 없습니다.', 'error');
        return;
    }
    
    const memberId = document.getElementById('memberSelect').value;
    const member = dataService.getMemberById(memberId);
    
    console.log('PDF export - Selected donations Set:', selectedDonations);
    console.log('PDF export - Filtered donations:', filteredDonations);
    
    const selectedData = filteredDonations.filter(donation => {
        const hasId = selectedDonations.has(donation.id.toString());
        console.log('PDF - Checking donation ID:', donation.id, 'Type:', typeof donation.id, 'Has in set:', hasId);
        return hasId;
    });
    
    console.log('PDF export - Selected data:', selectedData);
    
    // Create PDF content
    const totalAmount = selectedData.reduce((sum, d) => sum + d.amount, 0);
    const issueDate = new Date().toLocaleDateString('ko-KR');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>기부금 영수증 - ${member.name}</title>
            <style>
                body {
                    font-family: 'Malgun Gothic', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: black;
                }
                .receipt-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .church-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                .receipt-title {
                    font-size: 28px;
                    font-weight: bold;
                    margin: 0 0 15px 0;
                }
                .receipt-info {
                    font-size: 16px;
                    margin: 10px 0;
                }
                .member-section {
                    margin: 30px 0;
                    padding: 20px;
                    border: 1px solid #333;
                }
                .member-info {
                    font-size: 18px;
                    margin: 10px 0;
                }
                .donations-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                }
                .donations-table th,
                .donations-table td {
                    border: 1px solid #333;
                    padding: 12px;
                    text-align: left;
                }
                .donations-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }
                .amount-col { text-align: right; }
                .total-row {
                    font-weight: bold;
                    background: #f9f9f9;
                }
                .footer {
                    margin-top: 50px;
                    text-align: right;
                    font-size: 14px;
                    border-top: 1px solid #ccc;
                    padding-top: 20px;
                }
                @page {
                    margin: 2cm;
                    size: A4;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="receipt-header">
                    <h1 class="church-name">${getChurchInfo().name}</h1>
                    <h2 class="receipt-title">기부금 영수증</h2>
                </div>
                
                <div class="member-section">
                    <div class="member-info"><strong>성명:</strong> ${member.name}님</div>
                    <div class="member-info"><strong>연락처:</strong> ${member.phone || '-'}</div>
                    <div class="member-info"><strong>주소:</strong> ${member.address || '-'}</div>
                </div>
                
                <table class="donations-table">
                    <thead>
                        <tr>
                            <th>날짜</th>
                            <th>헌금유형</th>
                            <th>헌금액</th>
                            <th>메모</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedData.map(donation => `
                            <tr>
                                <td>${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                                <td>${donation.type}</td>
                                <td class="amount-col">${donation.amount.toLocaleString()}원</td>
                                <td>${donation.memo || '-'}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="2" style="text-align: center;">총 합계</td>
                            <td class="amount-col">${totalAmount.toLocaleString()}원</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <div>────────────────────────────────────</div>
                    <div>${getChurchInfo().name} 재정관리시스템</div>
                    <div>발급일자: ${new Date().toLocaleDateString('ko-KR')}</div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Create a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            showToast('기부금 영수증이 출력되었습니다.');
        }, 500);
    };
}

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

function getDonationTypes() {
    try {
        if (window.parent && window.parent.getDonationTypes) {
            return window.parent.getDonationTypes();
        } else if (window.getDonationTypes) {
            return window.getDonationTypes();
        } else {
            const saved = localStorage.getItem('donationTypes');
            return saved ? JSON.parse(saved) : ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
        }
    } catch (error) {
        console.error('Error getting donation types:', error);
        return ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    }
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}