// 지출 데이터 배열
let expenses = [];
let editingIndex = -1;

// 부모 window의 데이터 서비스에서 데이터 로드
function loadData() {
    try {
        const dataService = parent.window.dataService;
        if (dataService) {
            expenses = dataService.getExpenses();
        } else {
            expenses = [];
        }
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        expenses = [];
    }
    
    displayExpenses();
}

// 지출 목록 화면에 표시
function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    const expenseCount = document.getElementById('expenseCount');
    const expenseTotal = document.getElementById('expenseTotal');
    
    // 필터링
    const filteredExpenses = getFilteredExpenses();
    
    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = '<div class="no-expenses">등록된 지출 기록이 없습니다.</div>';
        expenseCount.textContent = '0';
        expenseTotal.textContent = '0';
        return;
    }

    // 총합계 계산
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const tableHTML = `
        <table class="expense-table">
            <thead>
                <tr>
                    <th>날짜</th>
                    <th>분류</th>
                    <th>지출액</th>
                    <th>결제방법</th>
                    <th>거래처</th>
                    <th>승인자</th>
                    <th>내용</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                ${filteredExpenses.map((expense, index) => {
                    const description = expense.description || '-';
                    const shortDescription = description.length > 20 ? description.substring(0, 20) + '...' : description;
                    
                    return `
                    <tr>
                        <td class="date-cell">${new Date(expense.date).toLocaleDateString('ko-KR')}</td>
                        <td class="category-cell">${expense.category}</td>
                        <td class="amount-cell">${expense.amount.toLocaleString()}원</td>
                        <td><span class="payment-method-cell">${expense.paymentMethod || '현금'}</span></td>
                        <td class="vendor-cell">${expense.vendor || '-'}</td>
                        <td class="approver-cell">${expense.approver || '-'}</td>
                        <td class="description-cell" title="${description}">${shortDescription}</td>
                        <td class="date-cell">${new Date(expense.recordedAt).toLocaleDateString('ko-KR')}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-edit" onclick="openEditModal(${expenses.indexOf(expense)})" title="수정">수정</button>
                                <button class="btn-danger" onclick="deleteExpense(${expenses.indexOf(expense)})" title="삭제">삭제</button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    expenseList.innerHTML = tableHTML;
    expenseCount.textContent = filteredExpenses.length;
    expenseTotal.textContent = total.toLocaleString();
}

// 필터링된 지출 목록 반환
function getFilteredExpenses() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const paymentMethodFilter = document.getElementById('filterPaymentMethod').value;
    
    // 최근 일주일 날짜 계산
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return expenses.filter(expense => {
        const categoryMatch = !categoryFilter || expense.category === categoryFilter;
        const paymentMethodMatch = !paymentMethodFilter || expense.paymentMethod === paymentMethodFilter;
        
        // 최근 일주일 내 기록만 표시
        const expenseDate = new Date(expense.date);
        const dateMatch = expenseDate >= oneWeekAgo;
        
        return categoryMatch && paymentMethodMatch && dateMatch;
    });
}

// 지출 등록
function registerExpense(expenseData) {
    try {
        const dataService = parent.window.dataService;
        const newExpense = dataService.addExpense(expenseData);

        // 메모리에서 최신 데이터를 가져와서 UI 즉시 갱신
        expenses = dataService.getExpenses();
        displayExpenses(); // 즉시 화면 갱신

        showToast('지출이 성공적으로 등록되었습니다.', 'success');
        document.getElementById('expenseForm').reset();
        // 오늘 날짜로 기본값 설정
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        return true;
    } catch (error) {
        console.error('지출 등록 오류:', error);
        showToast('지출 등록 중 오류가 발생했습니다. 파일 저장 권한을 확인해주세요.', 'error');
        return false;
    }
}

// 지출 삭제
function deleteExpense(index) {
    if (confirm('정말로 이 지출 기록을 삭제하시겠습니까?')) {
        try {
            const dataService = parent.window.dataService;
            dataService.deleteExpense(index);

            // 메모리에서 최신 데이터를 가져와서 UI 즉시 갱신
            expenses = dataService.getExpenses();
            displayExpenses(); // 즉시 화면 갱신

            showToast('지출 기록이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('지출 삭제 오류:', error);

            // 메모리 상태가 복원되었으므로 UI 갱신
            expenses = dataService.getExpenses();
            displayExpenses();

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
    const expense = expenses[index];
    
    document.getElementById('editExpenseCategory').value = expense.category;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseDate').value = expense.date;
    document.getElementById('editExpensePaymentMethod').value = expense.paymentMethod || '현금';
    document.getElementById('editExpenseVendor').value = expense.vendor || '';
    document.getElementById('editExpenseApprover').value = expense.approver || '';
    document.getElementById('editExpenseDescription').value = expense.description || '';
    
    document.getElementById('editModal').classList.add('show');
}

// 편집 모달 닫기
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingIndex = -1;
}

// 지출 정보 수정
function updateExpense(expenseData) {
    if (editingIndex === -1) return false;
    
    try {
        const dataService = parent.window.dataService;
        if (dataService.updateExpense(editingIndex, expenseData)) {
            loadData(); // 데이터 다시 로드
            showToast('지출 정보가 성공적으로 수정되었습니다.', 'success');
            closeEditModal();
            return true;
        } else {
            showToast('지출 정보 수정 중 오류가 발생했습니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('지출 정보 수정 오류:', error);
        showToast('지출 정보 수정 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 금액 유효성 검사
function validateAmount(amount) {
    const numAmount = parseInt(amount);
    return !isNaN(numAmount) && numAmount >= 100;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜로 기본값 설정
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    loadData();
    
    // 지출 등록 폼 이벤트 리스너
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const expenseData = {
            category: formData.get('category').trim(),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            paymentMethod: formData.get('paymentMethod') || '현금',
            vendor: formData.get('vendor').trim(),
            approver: formData.get('approver').trim(),
            description: formData.get('description').trim()
        };
        
        // 유효성 검사
        if (!expenseData.category) {
            showToast('지출 분류를 선택해주세요.', 'error');
            return;
        }
        
        if (!validateAmount(expenseData.amount)) {
            showToast('지출액은 100원 이상이어야 합니다.', 'error');
            return;
        }
        
        if (!expenseData.date) {
            showToast('지출일을 입력해주세요.', 'error');
            return;
        }
        
        registerExpense(expenseData);
    });

    // 지출 정보 편집 폼 이벤트 리스너
    document.getElementById('editExpenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const expenseData = {
            category: formData.get('category').trim(),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            paymentMethod: formData.get('paymentMethod') || '현금',
            vendor: formData.get('vendor').trim(),
            approver: formData.get('approver').trim(),
            description: formData.get('description').trim()
        };
        
        // 유효성 검사
        if (!expenseData.category) {
            showToast('지출 분류를 선택해주세요.', 'error');
            return;
        }
        
        if (!validateAmount(expenseData.amount)) {
            showToast('지출액은 100원 이상이어야 합니다.', 'error');
            return;
        }
        
        if (!expenseData.date) {
            showToast('지출일을 입력해주세요.', 'error');
            return;
        }
        
        updateExpense(expenseData);
    });

    // 필터 변경 이벤트 리스너
    document.getElementById('filterCategory').addEventListener('change', displayExpenses);
    document.getElementById('filterPaymentMethod').addEventListener('change', displayExpenses);

    // 모달 배경 클릭 시 닫기
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    // 데이터 변경 감지 (부모 창의 데이터가 변경되었을 때)
    setInterval(() => {
        const dataService = parent.window.dataService;
        if (dataService) {
            const currentExpenses = dataService.getExpenses();
            
            if (currentExpenses.length !== expenses.length) {
                loadData();
            }
        }
    }, 2000); // 2초마다 확인
});