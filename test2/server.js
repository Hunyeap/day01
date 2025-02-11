const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 5500;

// 댓글을 저장할 배열
const comments = [];

// 이미지 저장 설정
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JSON 요청 처리
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 댓글 업로드 API
app.post('/submit', upload.single('image'), (req, res) => {
    const userId = req.body.userId || `user-${Date.now()}`;
    const comment = req.body.comment || '';
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 타임스탬프 추가
    const timestamp = Date.now(); // 밀리초 기준 현재 시간

    if (!comment && !imageUrl) {
        return res.status(400).json({ success: false, message: '댓글 또는 이미지를 입력하세요!' });
    }

    const newComment = { text: comment, imageUrl, userId, timestamp };
    console.log('📌 [서버] 저장된 댓글:', newComment);
    comments.push(newComment);

    io.emit('new-comment', newComment);
    res.json({ success: true, message: '댓글 추가 완료!', newComment });
});

// 댓글 목록 제공 API
app.get('/comments', (req, res) => {
    res.json(comments);
});

// WebSocket 연결
io.on('connection', (socket) => {
    console.log('🌐 [서버] 새 사용자가 연결되었습니다.');

    socket.on('disconnect', () => {
        console.log('🔌 [서버] 사용자가 연결을 종료했습니다.');
    });
});


// 서버 실행
server.listen(PORT, () => {
    console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});
