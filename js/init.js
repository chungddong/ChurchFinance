// Initial setup for fresh installation
function initializeApp() {
    // Clear all localStorage for fresh start
    localStorage.clear();
    
    // Initialize default church settings
    const defaultChurchInfo = {
        name: '',
        phone: '',
        address: '',
        pastor: '',
        email: ''
    };
    
    const defaultDonationTypes = ['십일조', '감사헌금', '특별헌금', '선교헌금', '건축헌금', '기타'];
    
    // Save default settings to localStorage
    localStorage.setItem('churchInfo', JSON.stringify(defaultChurchInfo));
    localStorage.setItem('donationTypes', JSON.stringify(defaultDonationTypes));
    
    console.log('앱이 초기화되었습니다.');
}

// Run initialization on first load
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is the first run
    const isFirstRun = !localStorage.getItem('appInitialized');
    
    if (isFirstRun) {
        initializeApp();
        localStorage.setItem('appInitialized', 'true');
    }
});