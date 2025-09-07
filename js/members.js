// 성도 데이터 배열
let members = [];
let editingIndex = -1;

// 부모 window의 데이터 서비스에서 성도 데이터 로드
function loadMembers() {
    try {
        const dataService = parent.window.dataService;
        if (dataService) {
            members = dataService.getMembers();
        } else {
            members = [];
        }
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        members = [];
    }
    displayMembers();
}

// 성도 목록 화면에 표시
function displayMembers() {
    const memberList = document.getElementById('memberList');
    const memberCount = document.getElementById('memberCount');
    
    if (members.length === 0) {
        memberList.innerHTML = '<div class="no-members">등록된 성도가 없습니다.</div>';
        memberCount.textContent = '0';
        return;
    }

    const tableHTML = `
        <table class="member-table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>연락처</th>
                    <th>주소</th>
                    <th>메모</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                ${members.map((member, index) => {
                    const memo = member.memo || '-';
                    // 화면 너비에 따라 메모 길이 제한 조정
                    const memoLimit = window.innerWidth < 600 ? 25 : window.innerWidth < 900 ? 30 : 40;
                    const isLongMemo = memo !== '-' && memo.length > memoLimit;
                    const shortMemo = isLongMemo ? memo.substring(0, memoLimit) + '...' : memo;
                    
                    return `
                    <tr>
                        <td class="member-name-cell">${member.name}</td>
                        <td>${member.phone}</td>
                        <td style="word-break: break-all;">${member.address || '-'}</td>
                        <td>
                            <div class="memo-cell" id="memo-${index}">
                                <span class="memo-text">${shortMemo}</span>
                                ${isLongMemo ? `<br><span class="memo-toggle" onclick="toggleMemo(${index})" id="toggle-${index}">더보기</span>` : ''}
                            </div>
                        </td>
                        <td style="font-size: 0.85em;">${new Date(member.registeredAt).toLocaleDateString('ko-KR')}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-edit" onclick="openEditModal(${index})" title="수정">✎</button>
                                <button class="btn-danger" onclick="deleteMember(${index})" title="삭제">×</button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    memberList.innerHTML = tableHTML;
    memberCount.textContent = members.length;
}

// 성도 등록
function registerMember(memberData) {
    try {
        const dataService = parent.window.dataService;
        const newMember = dataService.addMember(memberData);
        
        if (newMember) {
            loadMembers(); // 데이터 다시 로드
            showToast('성도가 성공적으로 등록되었습니다.', 'success');
            document.getElementById('memberForm').reset();
            return true;
        } else {
            showToast('성도 등록 중 오류가 발생했습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('성도 등록 오류:', error);
        showToast('성도 등록 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 성도 삭제
function deleteMember(index) {
    if (confirm('정말로 이 성도를 삭제하시겠습니까?')) {
        try {
            const dataService = parent.window.dataService;
            if (dataService.deleteMember(index)) {
                loadMembers(); // 데이터 다시 로드
                showToast('성도가 삭제되었습니다.', 'success');
            } else {
                showToast('성도 삭제 중 오류가 발생했습니다.', 'error');
            }
        } catch (error) {
            console.error('성도 삭제 오류:', error);
            showToast('성도 삭제 중 오류가 발생했습니다.', 'error');
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
    const member = members[index];
    
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberPhone').value = member.phone;
    document.getElementById('editMemberAddress').value = member.address || '';
    document.getElementById('editMemberMemo').value = member.memo || '';
    
    document.getElementById('editModal').classList.add('show');
}

// 편집 모달 닫기
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingIndex = -1;
}

// 성도 정보 수정
function updateMember(memberData) {
    if (editingIndex === -1) return false;
    
    try {
        const dataService = parent.window.dataService;
        if (dataService.updateMember(editingIndex, memberData)) {
            loadMembers(); // 데이터 다시 로드
            showToast('성도 정보가 성공적으로 수정되었습니다.', 'success');
            closeEditModal();
            return true;
        } else {
            showToast('성도 정보 수정 중 오류가 발생했습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('성도 정보 수정 오류:', error);
        showToast('성도 정보 수정 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 메모 더보기/접기 토글
function toggleMemo(index) {
    const member = members[index];
    const memoCell = document.getElementById(`memo-${index}`);
    const toggleBtn = document.getElementById(`toggle-${index}`);
    const memoText = memoCell.querySelector('.memo-text');
    
    // 화면 너비에 따라 메모 길이 제한 조정
    const memoLimit = window.innerWidth < 600 ? 25 : window.innerWidth < 900 ? 30 : 40;
    
    if (toggleBtn.textContent === '더보기') {
        memoText.textContent = member.memo;
        toggleBtn.textContent = '접기';
        memoCell.classList.add('expanded');
    } else {
        memoText.textContent = member.memo.substring(0, memoLimit) + '...';
        toggleBtn.textContent = '더보기';
        memoCell.classList.remove('expanded');
    }
}



// 전화번호 형식 검증
function validatePhone(phone) {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(phone);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    
    // 성도 등록 폼 이벤트 리스너
    document.getElementById('memberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const memberData = {
            name: formData.get('name').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            memo: formData.get('memo').trim()
        };
        
        // 유효성 검사
        if (!memberData.name) {
            showToast('이름을 입력해주세요.', 'error');
            return;
        }
        
        if (!memberData.phone) {
            showToast('연락처를 입력해주세요.', 'error');
            return;
        }
        
        if (!validatePhone(memberData.phone)) {
            showToast('연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)', 'error');
            return;
        }
        
        // 중복 검사
        const dataService = parent.window.dataService;
        const existingMembers = dataService.getMembers();
        if (existingMembers.some(member => member.phone === memberData.phone)) {
            showToast('이미 등록된 연락처입니다.', 'error');
            return;
        }
        
        registerMember(memberData);
    });

    // 성도 정보 편집 폼 이벤트 리스너
    document.getElementById('editMemberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const memberData = {
            name: formData.get('name').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            memo: formData.get('memo').trim()
        };
        
        // 유효성 검사
        if (!memberData.name) {
            showToast('이름을 입력해주세요.', 'error');
            return;
        }
        
        if (!memberData.phone) {
            showToast('연락처를 입력해주세요.', 'error');
            return;
        }
        
        if (!validatePhone(memberData.phone)) {
            showToast('연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)', 'error');
            return;
        }
        
        // 중복 검사 (자신 제외)
        const dataService = parent.window.dataService;
        const existingMembers = dataService.getMembers();
        if (existingMembers.some((member, index) => index !== editingIndex && member.phone === memberData.phone)) {
            showToast('이미 등록된 연락처입니다.', 'error');
            return;
        }
        
        updateMember(memberData);
    });

    // 모달 배경 클릭 시 닫기
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        displayMembers();
    });
});