// Settings Management JavaScript
let dataService;
let currentDonationTypes = ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '기타'];
let churchInfo = {
    name: '00교회',
    phone: '',
    address: '',
    pastor: '',
    email: ''
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Try to get dataService from parent window (iframe context)
    if (window.parent && window.parent !== window && typeof window.parent.dataService !== 'undefined') {
        dataService = window.parent.dataService;
    } else if (typeof window.dataService !== 'undefined') {
        dataService = window.dataService;
    }
    
    initializeSettings();
});

function initializeSettings() {
    loadChurchInfo();
    loadDonationTypes();
    setupEventListeners();
}

function setupEventListeners() {
    // Church info form submission
    const churchForm = document.getElementById('churchInfoForm');
    if (churchForm) {
        churchForm.addEventListener('submit', saveChurchInfo);
    }
    
    // Enter key for adding donation type
    const newTypeInput = document.getElementById('newDonationType');
    if (newTypeInput) {
        newTypeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addDonationType();
            }
        });
    }
}

// Church Info Management
function loadChurchInfo() {
    try {
        const saved = localStorage.getItem('churchInfo');
        if (saved) {
            churchInfo = JSON.parse(saved);
        }
        
        // Populate form fields
        document.getElementById('churchName').value = churchInfo.name || '00교회';
        document.getElementById('churchPhone').value = churchInfo.phone || '';
        document.getElementById('churchAddress').value = churchInfo.address || '';
        document.getElementById('pastorName').value = churchInfo.pastor || '';
        document.getElementById('churchEmail').value = churchInfo.email || '';
        
    } catch (error) {
        console.error('Error loading church info:', error);
        showToast('교회 정보 로드 중 오류가 발생했습니다.', 'error');
    }
}

function saveChurchInfo(e) {
    e.preventDefault();
    
    try {
        churchInfo = {
            name: document.getElementById('churchName').value || '00교회',
            phone: document.getElementById('churchPhone').value,
            address: document.getElementById('churchAddress').value,
            pastor: document.getElementById('pastorName').value,
            email: document.getElementById('churchEmail').value
        };
        
        localStorage.setItem('churchInfo', JSON.stringify(churchInfo));
        showToast('교회 정보가 저장되었습니다.');
        
        // Update church name in other parts of the system
        updateChurchNameGlobally();
        
    } catch (error) {
        console.error('Error saving church info:', error);
        showToast('교회 정보 저장 중 오류가 발생했습니다.', 'error');
    }
}

function resetChurchInfo() {
    if (confirm('교회 정보를 초기화하시겠습니까?')) {
        churchInfo = {
            name: '00교회',
            phone: '',
            address: '',
            pastor: '',
            email: ''
        };
        
        localStorage.removeItem('churchInfo');
        loadChurchInfo();
        showToast('교회 정보가 초기화되었습니다.');
    }
}

function updateChurchNameGlobally() {
    // This function can be expanded to update church name across all components
    console.log('Church name updated globally:', churchInfo.name);
}

// Donation Types Management
function loadDonationTypes() {
    try {
        const saved = localStorage.getItem('donationTypes');
        if (saved) {
            currentDonationTypes = JSON.parse(saved);
        }
        
        displayDonationTypes();
        
    } catch (error) {
        console.error('Error loading donation types:', error);
        showToast('헌금 유형 로드 중 오류가 발생했습니다.', 'error');
    }
}

function displayDonationTypes() {
    const container = document.getElementById('donationTypesList');
    if (!container) return;
    
    container.innerHTML = currentDonationTypes.map((type, index) => `
        <div class="type-item">
            <span class="type-name">${type}</span>
            <div class="type-actions">
                <button class="btn-edit-type" onclick="editDonationType(${index})" title="수정">
                    ✏️
                </button>
                <button class="btn-delete-type" onclick="deleteDonationType(${index})" title="삭제">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function addDonationType() {
    const input = document.getElementById('newDonationType');
    const newType = input.value.trim();
    
    if (!newType) {
        showToast('헌금 유형을 입력해주세요.', 'error');
        return;
    }
    
    if (currentDonationTypes.includes(newType)) {
        showToast('이미 존재하는 헌금 유형입니다.', 'error');
        return;
    }
    
    if (newType.length > 20) {
        showToast('헌금 유형은 20자 이하로 입력해주세요.', 'error');
        return;
    }
    
    currentDonationTypes.push(newType);
    saveDonationTypes();
    displayDonationTypes();
    
    input.value = '';
    showToast(`'${newType}' 유형이 추가되었습니다.`);
}

function editDonationType(index) {
    const currentType = currentDonationTypes[index];
    document.getElementById('editTypeName').value = currentType;
    document.getElementById('editTypeIndex').value = index;
    
    const modal = document.getElementById('editTypeModal');
    modal.classList.add('show');
}

function updateDonationType() {
    const newName = document.getElementById('editTypeName').value.trim();
    const index = parseInt(document.getElementById('editTypeIndex').value);
    
    if (!newName) {
        showToast('헌금 유형을 입력해주세요.', 'error');
        return;
    }
    
    if (newName.length > 20) {
        showToast('헌금 유형은 20자 이하로 입력해주세요.', 'error');
        return;
    }
    
    if (currentDonationTypes.includes(newName) && currentDonationTypes[index] !== newName) {
        showToast('이미 존재하는 헌금 유형입니다.', 'error');
        return;
    }
    
    const oldName = currentDonationTypes[index];
    currentDonationTypes[index] = newName;
    saveDonationTypes();
    displayDonationTypes();
    closeEditTypeModal();
    
    showToast(`'${oldName}' → '${newName}'으로 수정되었습니다.`);
}

function deleteDonationType(index) {
    const typeName = currentDonationTypes[index];
    
    if (confirm(`'${typeName}' 헌금 유형을 삭제하시겠습니까?\n\n주의: 기존 헌금 데이터에 영향을 줄 수 있습니다.`)) {
        currentDonationTypes.splice(index, 1);
        saveDonationTypes();
        displayDonationTypes();
        showToast(`'${typeName}' 유형이 삭제되었습니다.`);
    }
}

function saveDonationTypes() {
    try {
        localStorage.setItem('donationTypes', JSON.stringify(currentDonationTypes));
    } catch (error) {
        console.error('Error saving donation types:', error);
        showToast('헌금 유형 저장 중 오류가 발생했습니다.', 'error');
    }
}

function closeEditTypeModal() {
    const modal = document.getElementById('editTypeModal');
    modal.classList.remove('show');
}

// Data Backup and Restore
function exportAllData() {
    try {
        const allData = {
            members: dataService ? dataService.getMembers() : [],
            donations: dataService ? dataService.getDonations() : [],
            churchInfo: churchInfo,
            donationTypes: currentDonationTypes,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        downloadJSON(allData, `church_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast('전체 데이터가 내보내기되었습니다.');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

function exportMembersOnly() {
    try {
        const membersData = {
            members: dataService ? dataService.getMembers() : [],
            exportDate: new Date().toISOString(),
            type: 'members_only',
            version: '1.0.0'
        };
        
        downloadJSON(membersData, `members_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast('성도 데이터가 내보내기되었습니다.');
        
    } catch (error) {
        console.error('Error exporting members:', error);
        showToast('성도 데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

function exportDonationsOnly() {
    try {
        const donationsData = {
            donations: dataService ? dataService.getDonations() : [],
            exportDate: new Date().toISOString(),
            type: 'donations_only',
            version: '1.0.0'
        };
        
        downloadJSON(donationsData, `donations_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast('헌금 데이터가 내보내기되었습니다.');
        
    } catch (error) {
        console.error('Error exporting donations:', error);
        showToast('헌금 데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('파일을 선택해주세요.', 'error');
        return;
    }
    
    if (file.type !== 'application/json') {
        showToast('JSON 파일만 지원됩니다.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            processImportData(data);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            showToast('유효하지 않은 JSON 파일입니다.', 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('파일 읽기 중 오류가 발생했습니다.', 'error');
    };
    
    reader.readAsText(file);
}

function processImportData(data) {
    if (!data || typeof data !== 'object') {
        showToast('유효하지 않은 데이터 형식입니다.', 'error');
        return;
    }
    
    const confirmMessage = `데이터를 복원하시겠습니까?\n\n` +
        `복원될 데이터:\n` +
        `- 성도: ${data.members ? data.members.length : 0}명\n` +
        `- 헌금: ${data.donations ? data.donations.length : 0}건\n` +
        `- 내보내기 날짜: ${data.exportDate ? new Date(data.exportDate).toLocaleDateString('ko-KR') : '알 수 없음'}\n\n` +
        `⚠️ 기존 데이터가 모두 덮어쓰기됩니다.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        let restoredCount = 0;
        
        // Restore members
        if (data.members && dataService) {
            dataService.members = data.members;
            dataService.saveMembers();
            restoredCount++;
        }
        
        // Restore donations
        if (data.donations && dataService) {
            dataService.donations = data.donations;
            dataService.saveDonations();
            restoredCount++;
        }
        
        // Restore church info
        if (data.churchInfo) {
            churchInfo = data.churchInfo;
            localStorage.setItem('churchInfo', JSON.stringify(churchInfo));
            loadChurchInfo();
            restoredCount++;
        }
        
        // Restore donation types
        if (data.donationTypes) {
            currentDonationTypes = data.donationTypes;
            saveDonationTypes();
            displayDonationTypes();
            restoredCount++;
        }
        
        // Clear file input
        document.getElementById('restoreFile').value = '';
        
        showToast(`데이터 복원이 완료되었습니다. (${restoredCount}개 항목)`);
        
        // Refresh the page to reflect changes
        setTimeout(() => {
            if (window.parent && window.parent !== window) {
                window.parent.location.reload();
            } else {
                window.location.reload();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error importing data:', error);
        showToast('데이터 복원 중 오류가 발생했습니다.', 'error');
    }
}

// Helper function to get church info for other modules
function getChurchInfo() {
    return churchInfo;
}

function getDonationTypes() {
    return currentDonationTypes;
}

// Toast notification
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

// Make functions available globally for other modules
if (typeof window !== 'undefined') {
    window.getChurchInfo = getChurchInfo;
    window.getDonationTypes = getDonationTypes;
}