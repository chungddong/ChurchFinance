// 로그인 관리 시스템
class AuthManager {
    constructor() {
        this.defaultPassword = '0000';
        this.passwordKey = 'churchFinancePassword';
    }

    // 저장된 비밀번호 가져오기 (암호화된 상태)
    getStoredPassword() {
        try {
            const stored = localStorage.getItem(this.passwordKey);
            return stored || this.encryptPassword(this.defaultPassword);
        } catch (error) {
            console.error('비밀번호 로드 오류:', error);
            return this.encryptPassword(this.defaultPassword);
        }
    }

    // 비밀번호 설정
    setPassword(newPassword) {
        try {
            const encrypted = this.encryptPassword(newPassword);
            localStorage.setItem(this.passwordKey, encrypted);
            return true;
        } catch (error) {
            console.error('비밀번호 저장 오류:', error);
            return false;
        }
    }

    // 비밀번호 검증
    verifyPassword(inputPassword) {
        const storedPassword = this.getStoredPassword();
        const inputEncrypted = this.encryptPassword(inputPassword);
        return storedPassword === inputEncrypted;
    }

    // 간단한 비밀번호 암호화 (Base64 + 간단한 변환)
    encryptPassword(password) {
        try {
            // 비밀번호에 솔트 추가 후 Base64 인코딩
            const saltedPassword = 'church_' + password + '_finance_2024';
            return btoa(saltedPassword);
        } catch (error) {
            console.error('비밀번호 암호화 오류:', error);
            return btoa(password);
        }
    }

    // 로그인 상태 확인 - 앱 재시작 시마다 로그인 필요
    isLoggedIn() {
        // 앱을 다시 열 때마다 로그인하도록 false 반환
        return false;
    }

    // 로그인 처리
    login() {
        sessionStorage.setItem('loginTime', Date.now().toString());
        sessionStorage.setItem('isAuthenticated', 'true');
    }

    // 로그아웃 처리
    logout() {
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('isAuthenticated');
    }
}

// 전역 AuthManager 인스턴스
const authManager = new AuthManager();

// 로그인 폼 처리
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    // 이미 로그인된 상태라면 메인으로 리다이렉트
    if (authManager.isLoggedIn()) {
        redirectToMain();
        return;
    }

    // 로그인 폼 제출 처리
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const password = passwordInput.value.trim();

        if (!password) {
            showError('비밀번호를 입력해주세요.');
            return;
        }

        if (authManager.verifyPassword(password)) {
            // 로그인 성공
            authManager.login();
            showSuccess('로그인 성공! 시스템으로 이동합니다...');

            setTimeout(() => {
                redirectToMain();
            }, 1000);
        } else {
            // 로그인 실패
            showError('비밀번호가 올바르지 않습니다.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // 비밀번호 입력 시 에러 메시지 숨기기
    passwordInput.addEventListener('input', function() {
        hideError();
    });

    // Enter 키 처리
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // 초기 포커스
    passwordInput.focus();
});

// 에러 메시지 표시
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // 입력 필드 흔들기 효과
    const passwordInput = document.getElementById('password');
    passwordInput.style.borderColor = '#e74c3c';
    passwordInput.style.animation = 'shake 0.5s ease-in-out';

    setTimeout(() => {
        passwordInput.style.animation = '';
    }, 500);
}

// 에러 메시지 숨기기
function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';

    const passwordInput = document.getElementById('password');
    passwordInput.style.borderColor = '#e1e5e9';
}

// 성공 메시지 표시
function showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.color = '#27ae60';
    errorElement.style.display = 'block';
}

// 메인 페이지로 리다이렉트
function redirectToMain() {
    if (parent && parent.window && parent.window.showMainFromLogin) {
        parent.window.showMainFromLogin();
    } else {
        // 독립 창으로 열린 경우
        window.location.href = '../index.html';
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// 전역으로 authManager 노출
window.authManager = authManager;