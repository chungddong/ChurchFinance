const fs = require('fs');
const path = require('path');

// 데이터 관리 서비스
class DataService {
    constructor() {
        this.dataDir = __dirname;
        this.membersFile = path.join(this.dataDir, 'members.json');
        this.donationsFile = path.join(this.dataDir, 'donations.json');
        this.expensesFile = path.join(this.dataDir, 'expenses.json');
        this.members = [];
        this.donations = [];
        this.expenses = [];
        this.loadMembers();
        this.loadDonations();
        this.loadExpenses();
    }

    // 성도 데이터 로드
    loadMembers() {
        try {
            if (fs.existsSync(this.membersFile)) {
                const data = fs.readFileSync(this.membersFile, 'utf8');
                this.members = JSON.parse(data);
            } else {
                this.members = [];
            }
            return this.members;
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.members = [];
            return this.members;
        }
    }

    // 성도 데이터 저장
    saveMembers() {
        try {
            fs.writeFileSync(this.membersFile, JSON.stringify(this.members, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            return false;
        }
    }

    // 성도 추가
    addMember(memberData) {
        const newMember = {
            ...memberData,
            id: Date.now(),
            registeredAt: new Date().toISOString()
        };
        
        this.members.push(newMember);
        return this.saveMembers() ? newMember : null;
    }

    // 성도 수정
    updateMember(index, memberData) {
        if (index >= 0 && index < this.members.length) {
            this.members[index] = {
                ...this.members[index],
                ...memberData
            };
            return this.saveMembers();
        }
        return false;
    }

    // 성도 삭제
    deleteMember(index) {
        if (index >= 0 && index < this.members.length) {
            this.members.splice(index, 1);
            return this.saveMembers();
        }
        return false;
    }

    // 전체 성도 목록 반환
    getMembers() {
        return [...this.members];
    }

    // 전체 성도 목록 반환 (별칭)
    getAllMembers() {
        return this.getMembers();
    }

    // ID로 성도 검색
    getMemberById(id) {
        return this.members.find(member => member.id == id);
    }

    // 헌금 데이터 로드
    loadDonations() {
        try {
            if (fs.existsSync(this.donationsFile)) {
                const data = fs.readFileSync(this.donationsFile, 'utf8');
                this.donations = JSON.parse(data);
            } else {
                this.donations = [];
            }
            return this.donations;
        } catch (error) {
            console.error('헌금 데이터 로드 오류:', error);
            this.donations = [];
            return this.donations;
        }
    }

    // 헌금 데이터 저장
    saveDonations() {
        try {
            fs.writeFileSync(this.donationsFile, JSON.stringify(this.donations, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('헌금 데이터 저장 오류:', error);
            return false;
        }
    }

    // 헌금 추가
    addDonation(donationData) {
        const newDonation = {
            ...donationData,
            id: Date.now(),
            recordedAt: new Date().toISOString()
        };
        
        this.donations.push(newDonation);
        return this.saveDonations() ? newDonation : null;
    }

    // 헌금 수정
    updateDonation(index, donationData) {
        if (index >= 0 && index < this.donations.length) {
            this.donations[index] = {
                ...this.donations[index],
                ...donationData
            };
            return this.saveDonations();
        }
        return false;
    }

    // 헌금 삭제
    deleteDonation(index) {
        if (index >= 0 && index < this.donations.length) {
            this.donations.splice(index, 1);
            return this.saveDonations();
        }
        return false;
    }

    // 전체 헌금 목록 반환
    getDonations() {
        return [...this.donations];
    }

    // 특정 성도의 헌금 기록 반환
    getMemberDonations(memberId) {
        console.log('getMemberDonations called with:', memberId, typeof memberId);
        console.log('All donations:', this.donations);
        const result = this.donations.filter(donation => {
            console.log('Comparing:', donation.memberId, typeof donation.memberId, 'with', memberId, typeof memberId);
            return donation.memberId == memberId; // Use == instead of === for type coercion
        });
        console.log('getMemberDonations result:', result);
        return result;
    }

    // 특정 성도의 헌금 기록 반환 (별칭)
    getDonationsByMember(memberId) {
        return this.getMemberDonations(memberId);
    }

    // 헌금 유형별 통계
    getDonationsByType(type, startDate, endDate) {
        return this.donations.filter(donation => {
            const donationDate = new Date(donation.date);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            
            return donation.type === type && 
                   donationDate >= start && 
                   donationDate <= end;
        });
    }

    // 지출 데이터 로드
    loadExpenses() {
        try {
            if (fs.existsSync(this.expensesFile)) {
                const data = fs.readFileSync(this.expensesFile, 'utf8');
                this.expenses = JSON.parse(data);
            } else {
                this.expenses = [];
            }
            return this.expenses;
        } catch (error) {
            console.error('지출 데이터 로드 오류:', error);
            this.expenses = [];
            return this.expenses;
        }
    }

    // 지출 데이터 저장
    saveExpenses() {
        try {
            fs.writeFileSync(this.expensesFile, JSON.stringify(this.expenses, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('지출 데이터 저장 오류:', error);
            return false;
        }
    }

    // 지출 추가
    addExpense(expenseData) {
        const newExpense = {
            ...expenseData,
            id: Date.now(),
            recordedAt: new Date().toISOString()
        };
        
        this.expenses.push(newExpense);
        return this.saveExpenses() ? newExpense : null;
    }

    // 지출 목록 반환
    getExpenses() {
        return this.expenses;
    }

    // 지출 수정
    updateExpense(index, expenseData) {
        if (index < 0 || index >= this.expenses.length) {
            return false;
        }

        const updatedExpense = {
            ...this.expenses[index],
            ...expenseData,
            id: this.expenses[index].id, // ID 유지
            recordedAt: this.expenses[index].recordedAt, // 등록일 유지
            updatedAt: new Date().toISOString()
        };

        this.expenses[index] = updatedExpense;
        return this.saveExpenses();
    }

    // 지출 삭제
    deleteExpense(index) {
        if (index < 0 || index >= this.expenses.length) {
            return false;
        }

        this.expenses.splice(index, 1);
        return this.saveExpenses();
    }
}

// 전역 데이터 서비스 인스턴스
window.dataService = new DataService();

// PDF 저장 기능을 전역에서 처리
window.exportMembersToPDF = function() {
    const members = window.dataService.getMembers();
    
    if (members.length === 0) {
        showToast('저장할 성도 목록이 없습니다.', 'error');
        return;
    }

    // 일렉트론 환경 체크
    if (typeof require !== 'undefined') {
        try {
            const { ipcRenderer } = require('electron');
            
            // PDF용 HTML 생성
            const pdfContent = generatePDFHTML(members);
            
            // 메인 프로세스에 PDF 저장 요청
            ipcRenderer.send('export-member-list-pdf', pdfContent);
            
            // 결과 처리
            ipcRenderer.once('pdf-export-success', (event, filePath) => {
                showToast(`PDF가 성공적으로 저장되었습니다.`, 'success');
            });
            
            ipcRenderer.once('pdf-export-error', (event, error) => {
                showToast('PDF 저장 중 오류가 발생했습니다.', 'error');
                console.error('PDF Export Error:', error);
            });
            
            ipcRenderer.once('pdf-export-cancelled', () => {
                showToast('PDF 저장이 취소되었습니다.', 'error');
            });
            
        } catch (error) {
            showToast('PDF 저장 중 오류가 발생했습니다.', 'error');
            console.error('Electron API Error:', error);
        }
    } else {
        showToast('PDF 저장은 일렉트론 앱에서만 지원됩니다.', 'error');
    }
};

// PDF용 HTML 생성 함수
function generatePDFHTML(members) {
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

    // 테이블 행 생성
    const tableRows = members.map((member, index) => `
        <tr>
            <td class="number-col">${index + 1}</td>
            <td class="name-col">${member.name}</td>
            <td class="phone-col">${member.phone}</td>
            <td class="address-col">${member.address || '-'}</td>
            <td class="memo-col">${member.memo || '-'}</td>
            <td class="date-col">${new Date(member.registeredAt).toLocaleDateString('ko-KR')}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>성도 목록</title>
            <style>
                body {
                    background: white !important;
                    font-family: 'Malgun Gothic', sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .print-container {
                    width: 100%;
                    max-width: none;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .print-header h1 {
                    font-size: 24px;
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .print-info {
                    font-size: 14px;
                    color: #666;
                    margin: 5px 0;
                }
                .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 20px;
                }
                .print-table th,
                .print-table td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: left;
                    vertical-align: top;
                }
                .print-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }
                .print-table td {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .print-table .number-col { width: 6%; text-align: center; }
                .print-table .name-col { width: 12%; }
                .print-table .phone-col { width: 15%; }
                .print-table .address-col { width: 30%; }
                .print-table .memo-col { width: 30%; }
                .print-table .date-col { width: 10%; text-align: center; }
                .print-footer {
                    margin-top: 30px;
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ccc;
                    padding-top: 15px;
                }
                @page {
                    margin: 1.5cm;
                    size: A4 landscape;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="print-header">
                    <h1>교회 성도 목록</h1>
                    <div class="print-info">출력일: ${dateString} ${timeString}</div>
                    <div class="print-info">총 ${members.length}명</div>
                </div>
                
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="number-col">번호</th>
                            <th class="name-col">이름</th>
                            <th class="phone-col">연락처</th>
                            <th class="address-col">주소</th>
                            <th class="memo-col">메모</th>
                            <th class="date-col">등록일</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div class="print-footer">
                    <div>교회 재정관리 시스템</div>
                    <div>Church Finance Management System</div>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 현재 날짜 표시
function updateCurrentDate() {
    const now = new Date();
    const dateString = now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// 메인 앱 보기
function showMainApp() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateCurrentDate();
    
    // 기본 탭 로드
    loadPage('members');
}

// 페이지 로드 함수
function loadPage(pageName) {
    const content = document.querySelector('.content');
    
    // 모든 탭에서 active 클래스 제거
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // 현재 탭에 active 클래스 추가
    const currentTab = document.querySelector(`[onclick="loadPage('${pageName}')"]`);
    if (currentTab) {
        currentTab.classList.add('active');
    }
    
    // 페이지 로드
    switch(pageName) {
        case 'donations':
            content.innerHTML = '<iframe src="pages/donations.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        case 'expenses':
            content.innerHTML = '<iframe src="pages/expenses.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        case 'statistics':
            content.innerHTML = '<iframe src="pages/statistics.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        case 'receipts':
            content.innerHTML = '<iframe src="pages/receipts.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        case 'members':
            content.innerHTML = '<iframe src="pages/members.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        case 'settings':
            content.innerHTML = '<iframe src="pages/settings.html" style="width:100%;height:100%;border:none;"></iframe>';
            break;
        default:
            content.innerHTML = '<div class="coming-soon"><p>페이지를 찾을 수 없습니다.</p></div>';
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

// 전화번호 형식 검증
function validatePhone(phone) {
    const phoneRegex = /^(\d{2,3})-(\d{3,4})-(\d{4})$/;
    return phoneRegex.test(phone);
}

// 교회 정보 가져오기
function getChurchInfo() {
    try {
        const saved = localStorage.getItem('churchInfo');
        return saved ? JSON.parse(saved) : { name: '00교회' };
    } catch (error) {
        console.error('Error getting church info:', error);
        return { name: '00교회' };
    }
}

// 헌금 유형 가져오기  
function getDonationTypes() {
    try {
        const saved = localStorage.getItem('donationTypes');
        return saved ? JSON.parse(saved) : ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    } catch (error) {
        console.error('Error getting donation types:', error);
        return ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '절기헌금', '기타'];
    }
}

// 전역으로 함수 노출
if (typeof window !== 'undefined') {
    window.getChurchInfo = getChurchInfo;
    window.getDonationTypes = getDonationTypes;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
});