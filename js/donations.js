// 헌금 데이터 배열
let donations = [];
let members = [];
let editingIndex = -1;

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
    
    populateMemberDropdowns();
    populateDonationTypeDropdowns();
    displayDonations();
}

// 성도 드롭다운 채우기
function populateMemberDropdowns() {
    const dropdowns = [
        document.getElementById('donationMember'),
        document.getElementById('editDonationMember'),
        document.getElementById('filterMember')
    ];
    
    dropdowns.forEach((dropdown, index) => {
        if (!dropdown) return;
        
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
    });
}

// 헌금 유형 드롭다운 채우기
function populateDonationTypeDropdowns() {
    // localStorage에서 직접 헌금 유형 읽기
    let donationTypes = [];
    try {
        const saved = localStorage.getItem('donationTypes');
        donationTypes = saved ? JSON.parse(saved) : ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    } catch (error) {
        console.error('Error getting donation types:', error);
        donationTypes = ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    }
    
    const dropdowns = [
        document.getElementById('donationType'),
        document.getElementById('editDonationType'),
        document.getElementById('filterType')
    ];
    
    dropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // 현재 선택된 값 저장
        const currentValue = dropdown.value;
        
        // 기본 옵션만 남기고 모든 옵션 제거
        const firstOption = dropdown.querySelector('option');
        dropdown.innerHTML = '';
        if (firstOption) {
            dropdown.appendChild(firstOption);
        }
        
        // 헌금 유형 목록 추가
        donationTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            dropdown.appendChild(option);
        });
        
        // 이전 선택값 복원
        if (currentValue && donationTypes.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    });
}

// 헌금 목록 화면에 표시
function displayDonations() {
    const donationList = document.getElementById('donationList');
    const donationCount = document.getElementById('donationCount');
    const donationTotal = document.getElementById('donationTotal');
    
    // 필터링
    const filteredDonations = getFilteredDonations();
    
    if (filteredDonations.length === 0) {
        donationList.innerHTML = '<div class="no-donations">등록된 헌금 기록이 없습니다.</div>';
        donationCount.textContent = '0';
        donationTotal.textContent = '0';
        return;
    }

    // 총합계 계산
    const total = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);

    const tableHTML = `
        <table class="donation-table">
            <thead>
                <tr>
                    <th>날짜</th>
                    <th>헌금유형</th>
                    <th>성도명</th>
                    <th>헌금액</th>
                    <th>메모</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDonations.map((donation, index) => {
                    const member = members.find(m => m.id == donation.memberId);
                    const memberName = member ? member.name : '알 수 없음';
                    const memo = donation.memo || '-';
                    const shortMemo = memo.length > 20 ? memo.substring(0, 20) + '...' : memo;
                    
                    return `
                    <tr>
                        <td class="date-cell">${new Date(donation.date).toLocaleDateString('ko-KR')}</td>
                        <td class="type-cell type-${donation.type}">${donation.type}</td>
                        <td>${memberName}</td>
                        <td class="amount-cell">${donation.amount.toLocaleString()}원</td>
                        <td title="${memo}">${shortMemo}</td>
                        <td class="date-cell">${new Date(donation.recordedAt).toLocaleDateString('ko-KR')}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-edit" onclick="openEditModal(${donations.indexOf(donation)})" title="수정">수정</button>
                                <button class="btn-danger" onclick="deleteDonation(${donations.indexOf(donation)})" title="삭제">삭제</button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    donationList.innerHTML = tableHTML;
    donationCount.textContent = filteredDonations.length;
    donationTotal.textContent = total.toLocaleString();
}

// 필터링된 헌금 목록 반환
function getFilteredDonations() {
    const typeFilter = document.getElementById('filterType').value;
    const memberFilter = document.getElementById('filterMember').value;
    
    // 최근 일주일 날짜 계산
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return donations.filter(donation => {
        const typeMatch = !typeFilter || donation.type === typeFilter;
        const memberMatch = !memberFilter || donation.memberId == memberFilter;
        
        // 최근 일주일 내 기록만 표시
        const donationDate = new Date(donation.date);
        const dateMatch = donationDate >= oneWeekAgo;
        
        return typeMatch && memberMatch && dateMatch;
    });
}

// 헌금 등록
function registerDonation(donationData) {
    try {
        const dataService = parent.window.dataService;
        const newDonation = dataService.addDonation(donationData);
        
        if (newDonation) {
            loadData(); // 데이터 다시 로드
            showToast('헌금이 성공적으로 등록되었습니다.', 'success');
            document.getElementById('donationForm').reset();
            // 오늘 날짜로 기본값 설정
            document.getElementById('donationDate').value = new Date().toISOString().split('T')[0];
            return true;
        } else {
            showToast('헌금 등록 중 오류가 발생했습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('헌금 등록 오류:', error);
        showToast('헌금 등록 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 헌금 삭제
function deleteDonation(index) {
    if (confirm('정말로 이 헌금 기록을 삭제하시겠습니까?')) {
        try {
            const dataService = parent.window.dataService;
            dataService.deleteDonation(index);
            loadData(); // 데이터 다시 로드
            showToast('헌금 기록이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('헌금 삭제 오류:', error);
            loadData(); // 메모리 상태가 복원되었으므로 다시 로드
            showToast('삭제 중 오류가 발생했습니다. 파일 저장 권한을 확인해주세요.', 'error');
        }
    }
}

// 토스트 메시지 표시
function showToast(message, type) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션을 위해 약간 지연 후 show 클래스 추가
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // 3초 후 자동 제거
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

// 편집 모달 열기
function openEditModal(index) {
    editingIndex = index;
    const donation = donations[index];
    
    document.getElementById('editDonationType').value = donation.type;
    document.getElementById('editDonationMember').value = donation.memberId;
    document.getElementById('editDonationAmount').value = donation.amount;
    document.getElementById('editDonationDate').value = donation.date;
    document.getElementById('editDonationMemo').value = donation.memo || '';
    
    document.getElementById('editModal').classList.add('show');
}

// 편집 모달 닫기
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingIndex = -1;
}

// 헌금 정보 수정
function updateDonation(donationData) {
    if (editingIndex === -1) return false;
    
    try {
        const dataService = parent.window.dataService;
        if (dataService.updateDonation(editingIndex, donationData)) {
            loadData(); // 데이터 다시 로드
            showToast('헌금 정보가 성공적으로 수정되었습니다.', 'success');
            closeEditModal();
            return true;
        } else {
            showToast('헌금 정보 수정 중 오류가 발생했습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('헌금 정보 수정 오류:', error);
        showToast('헌금 정보 수정 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 금액 유효성 검사
function validateAmount(amount) {
    const numAmount = parseInt(amount);
    return !isNaN(numAmount) && numAmount >= 1000;
}

// 성도 존재 여부 확인
function validateMember(memberId) {
    return members.some(member => member.id == memberId);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜로 기본값 설정
    document.getElementById('donationDate').value = new Date().toISOString().split('T')[0];
    
    loadData();
    
    // 헌금 등록 폼 이벤트 리스너
    document.getElementById('donationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const donationData = {
            type: formData.get('type').trim(),
            memberId: parseInt(formData.get('memberId')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            memo: formData.get('memo').trim()
        };
        
        // 유효성 검사
        if (!donationData.type) {
            showToast('헌금 유형을 선택해주세요.', 'error');
            return;
        }
        
        if (!donationData.memberId) {
            showToast('성도를 선택해주세요.', 'error');
            return;
        }
        
        if (!validateMember(donationData.memberId)) {
            showToast('유효하지 않은 성도입니다.', 'error');
            return;
        }
        
        if (!validateAmount(donationData.amount)) {
            showToast('헌금액은 1,000원 이상이어야 합니다.', 'error');
            return;
        }
        
        if (!donationData.date) {
            showToast('헌금일을 입력해주세요.', 'error');
            return;
        }
        
        registerDonation(donationData);
    });

    // 헌금 정보 편집 폼 이벤트 리스너
    document.getElementById('editDonationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const donationData = {
            type: formData.get('type').trim(),
            memberId: parseInt(formData.get('memberId')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            memo: formData.get('memo').trim()
        };
        
        // 유효성 검사
        if (!donationData.type) {
            showToast('헌금 유형을 선택해주세요.', 'error');
            return;
        }
        
        if (!donationData.memberId) {
            showToast('성도를 선택해주세요.', 'error');
            return;
        }
        
        if (!validateMember(donationData.memberId)) {
            showToast('유효하지 않은 성도입니다.', 'error');
            return;
        }
        
        if (!validateAmount(donationData.amount)) {
            showToast('헌금액은 1,000원 이상이어야 합니다.', 'error');
            return;
        }
        
        if (!donationData.date) {
            showToast('헌금일을 입력해주세요.', 'error');
            return;
        }
        
        updateDonation(donationData);
    });

    // 필터 변경 이벤트 리스너
    document.getElementById('filterType').addEventListener('change', displayDonations);
    document.getElementById('filterMember').addEventListener('change', displayDonations);

    // 모달 배경 클릭 시 닫기
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    // 성도 데이터 변경 감지 (부모 창의 데이터가 변경되었을 때)
    setInterval(() => {
        const dataService = parent.window.dataService;
        if (dataService) {
            const currentMembers = dataService.getMembers();
            const currentDonations = dataService.getDonations();
            const currentDonationTypes = getDonationTypes();
            
            if (currentMembers.length !== members.length || currentDonations.length !== donations.length) {
                loadData();
            }
            
            // 헌금 유형이 변경된 경우 드롭다운 업데이트
            try {
                const saved = localStorage.getItem('donationTypes');
                const currentDonationTypes = saved ? JSON.parse(saved) : [];
                const lastKnownTypes = window.lastKnownDonationTypes || [];
                
                if (JSON.stringify(currentDonationTypes) !== JSON.stringify(lastKnownTypes)) {
                    window.lastKnownDonationTypes = currentDonationTypes;
                    populateDonationTypeDropdowns();
                }
            } catch (error) {
                console.error('Error checking donation types changes:', error);
            }
        }
    }, 2000); // 2초마다 확인
});