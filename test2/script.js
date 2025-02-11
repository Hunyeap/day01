const form = document.getElementById('commentForm');
const chatContent = document.getElementById('chatContent');
const socket = io();

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
}

// 새로운 댓글 수신 이벤트
socket.on('new-comment', (comment) => {
    console.log('📌 [클라이언트] 받은 댓글 데이터:', comment); // 댓글 데이터 확인
    addCommentToDOM(comment);
});

// DOM에 댓글 추가
let lastUserId = null;
let lastTimestampMinute = null;
let lastMessageElement = null; // 마지막 댓글 DOM 요소

function addCommentToDOM(comment) {
    const isMyMessage = comment.userId === userId;
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    if (isMyMessage) {
        messageContainer.classList.add('my-message');
    } else {
        messageContainer.classList.add('external-message');
    }

    // 사용자 이름 및 프로필 표시 (첫 번째 메시지에만)
    const currentMinute = getMinuteFromTimestamp(comment.timestamp);
    if (lastUserId !== comment.userId || lastTimestampMinute !== currentMinute) {
        const userInfoContainer = document.createElement('div');
        userInfoContainer.classList.add('user-info-container');

        const profileImage = document.createElement('img');
        profileImage.classList.add('profile-image');
        profileImage.src = comment.profileImageUrl || '/default-profile.png'; // 기본 프로필 이미지 설정
        profileImage.alt = "프로필 이미지";

        const userInfo = document.createElement('span');
        userInfo.classList.add('user-info');
        userInfo.textContent = comment.userId;

        userInfoContainer.appendChild(profileImage);
        userInfoContainer.appendChild(userInfo);

        messageContainer.appendChild(userInfoContainer);
    }

    // 메시지 내용 추가 (댓글 박스)
    const message = document.createElement('div');
    message.classList.add('message');

    // 메시지 텍스트 추가
    if (comment.text) {
        const text = document.createElement('span');
        text.textContent = comment.text;
        message.appendChild(text);
    }

    // 이미지 추가 (댓글 박스 내부)
    if (comment.imageUrl) {
        const img = document.createElement('img');
        img.src = comment.imageUrl.startsWith('/uploads') ? comment.imageUrl : `/uploads/${comment.imageUrl}`;
        img.alt = "업로드된 이미지";
        img.classList.add('uploaded-image'); // CSS 클래스 추가
        message.appendChild(img); // 이미지 요소를 댓글 박스 내부에 추가
    }

    messageContainer.appendChild(message); // 댓글 박스를 컨테이너에 추가

    // 시간 표시 (마지막 댓글 하단)
    if (lastUserId === comment.userId && lastTimestampMinute === currentMinute && lastMessageElement) {
        // 기존 시간 제거
        const existingTimeInfo = lastMessageElement.querySelector('.time-info');
        if (existingTimeInfo) {
            existingTimeInfo.remove();
        }
    }

    const timeInfo = document.createElement('div');
    timeInfo.classList.add('time-info');
    const formattedTime = new Date(comment.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    timeInfo.textContent = formattedTime;
    messageContainer.appendChild(timeInfo);

    // 업데이트된 사용자 및 시간 저장
    lastUserId = comment.userId;
    lastTimestampMinute = currentMinute;
    lastMessageElement = messageContainer;

    chatContent.appendChild(messageContainer);
    chatContent.scrollTop = chatContent.scrollHeight; // 스크롤을 항상 최신으로 유지
}


// 시간 변환 (분 단위)
function getMinuteFromTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.getHours() * 60 + date.getMinutes();
}

// 댓글 제출
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    formData.append('userId', userId);
    formData.append('timestamp', Date.now());

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('댓글 전송 실패');
        form.reset();
    } catch (error) {
        console.error('댓글 전송 오류:', error);
    }
});

// 댓글 불러오기
async function loadComments() {
    try {
        const response = await fetch('/comments');
        if (!response.ok) throw new Error('댓글 불러오기 실패');
        const comments = await response.json();
        comments.forEach(addCommentToDOM);
        scrollToBottom();
    } catch (error) {
        console.error('댓글 불러오기 오류:', error);
    }
}

// 스크롤 아래로 이동
function scrollToBottom() {
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 이미지 모달 처리
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const downloadLink = document.getElementById('downloadLink');
    const closeModal = document.getElementById('closeModal');

    chatContent.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            const imageUrl = event.target.src;
            modalImage.src = imageUrl;
            downloadLink.href = imageUrl;
            modal.style.display = 'block';
        }
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

loadComments();