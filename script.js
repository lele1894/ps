var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var hiddenCanvas = document.getElementById('hiddenCanvas');
var hiddenCtx = hiddenCanvas.getContext('2d');

var originalImage = null;
var imageWidth = 0;
var imageHeight = 0;
var dragging = false;
var dragIndex = -1;

// Canvas固定大小
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 4个角点 - 初始化为矩形
var points = [
    { x: 50, y: 50 },
    { x: CANVAS_WIDTH - 50, y: 50 },
    { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT - 50 },
    { x: 50, y: CANVAS_HEIGHT - 50 }
];

// 限制点在canvas范围内
function clampPoint(p) {
    return {
        x: Math.max(0, Math.min(CANVAS_WIDTH, p.x)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT, p.y))
    };
}

// 使用三角形分割法进行快速渲染 - 只用4个三角形
function draw() {
    if (!originalImage) {
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        return;
    }
    
    // 清空canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 源矩形的4个角
    var s0 = { x: 0, y: 0 };
    var s1 = { x: imageWidth, y: 0 };
    var s2 = { x: imageWidth, y: imageHeight };
    var s3 = { x: 0, y: imageHeight };
    
    // 目标四边形 - 就是用户拖动的points
    var p0 = points[0];
    var p1 = points[1];
    var p2 = points[2];
    var p3 = points[3];
    
    // 中心点 - 用于分割成4个三角形
    var centerSrc = {
        x: imageWidth / 2,
        y: imageHeight / 2
    };
    
    var centerDst = {
        x: (p0.x + p1.x + p2.x + p3.x) / 4,
        y: (p0.y + p1.y + p2.y + p3.y) / 4
    };
    
    // 绘制4个三角形
    drawTriangle(s0, s1, centerSrc, p0, p1, centerDst);
    drawTriangle(s1, s2, centerSrc, p1, p2, centerDst);
    drawTriangle(s2, s3, centerSrc, p2, p3, centerDst);
    drawTriangle(s3, s0, centerSrc, p3, p0, centerDst);
    
    // 计算并显示原始图片范围的边框
    drawImageBounds(p0, p1, p2, p3);
    
    // 绘制控制点
    drawControlPoints();
}

// 绘制单个三角形
function drawTriangle(s0, s1, s2, d0, d1, d2) {
    var v0 = { x: s1.x - s0.x, y: s1.y - s0.y };
    var v1 = { x: s2.x - s0.x, y: s2.y - s0.y };
    
    var det = v0.x * v1.y - v0.y * v1.x;
    if (Math.abs(det) < 0.01) return;
    
    var t0 = { x: d1.x - d0.x, y: d1.y - d0.y };
    var t1 = { x: d2.x - d0.x, y: d2.y - d0.y };
    
    var invDet = 1 / det;
    var a = (t0.x * v1.y - t1.x * v0.y) * invDet;
    var b = (t0.y * v1.y - t1.y * v0.y) * invDet;
    var c = (v0.x * t1.x - v1.x * t0.x) * invDet;
    var d = (v0.x * t1.y - v1.x * t0.y) * invDet;
    var e = d0.x - a * s0.x - c * s0.y;
    var f = d0.y - b * s0.x - d * s0.y;
    
    ctx.save();
    ctx.transform(a, b, c, d, e, f);
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(hiddenCanvas, 0, 0);
    ctx.restore();
}

function drawControlPoints() {
    // 绘制四边形框
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.stroke();
    
    // 绘制控制点
    for (var i = 0; i < points.length; i++) {
        var isSelected = i === dragIndex;
        
        // 外圈
        ctx.fillStyle = isSelected ? '#ff6b6b' : '#4facfe';
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // 中间白圈
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = isSelected ? '#ff6b6b' : '#4facfe';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 显示原始图片的边框范围
function drawImageBounds(p0, p1, p2, p3) {
    // 计算变形后的原始图片范围
    // 用两条对角线来确定边界
    
    ctx.save();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 虚线
    
    // 绘制原始图片的边框（就是 p0, p1, p2, p3 本身）
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.stroke();
    
    // 添加阴影背景来突出显示范围"
    ctx.fillStyle = 'rgba(255, 152, 0, 0.05)';
    ctx.fill();
    
    // 在四个角添加标签
    ctx.fillStyle = '#ff9800';
    ctx.font = '12px Arial';
    ctx.fillText('保存区域', (p0.x + p1.x + p2.x + p3.x) / 4 - 30, (p0.y + p1.y + p2.y + p3.y) / 4 - 10);
    
    ctx.restore();
}

function loadImage(file) {
    var img = new Image();
    img.onload = function() {
        originalImage = img;
        imageWidth = img.width;
        imageHeight = img.height;
        
        // 保存原始图像到隐藏canvas
        hiddenCanvas.width = imageWidth;
        hiddenCanvas.height = imageHeight;
        hiddenCtx.drawImage(img, 0, 0);
        
        // 计算初始控制点位置
        var scale = Math.min(
            (CANVAS_WIDTH - 100) / imageWidth,
            (CANVAS_HEIGHT - 100) / imageHeight,
            1
        );
        
        var w = imageWidth * scale;
        var h = imageHeight * scale;
        var offsetX = (CANVAS_WIDTH - w) / 2;
        var offsetY = (CANVAS_HEIGHT - h) / 2;
        
        points = [
            { x: offsetX, y: offsetY },
            { x: offsetX + w, y: offsetY },
            { x: offsetX + w, y: offsetY + h },
            { x: offsetX, y: offsetY + h }
        ];
        
        draw();
    };
    img.onerror = function() {
        alert('图片加载失败');
    };
    img.src = URL.createObjectURL(file);
}

// 鼠标事件
canvas.addEventListener('mousedown', function(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    
    for (var i = 0; i < points.length; i++) {
        var dist = Math.sqrt(
            Math.pow(points[i].x - x, 2) + Math.pow(points[i].y - y, 2)
        );
        if (dist < 15) {
            dragging = true;
            dragIndex = i;
            break;
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    
    points[dragIndex] = clampPoint({x: x, y: y});
    draw();
});

canvas.addEventListener('mouseup', function() {
    dragging = false;
    dragIndex = -1;
});

canvas.addEventListener('mouseleave', function() {
    dragging = false;
    dragIndex = -1;
});

// 文件加载
document.getElementById('imageInput').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

// 重置按钮
document.getElementById('reset').addEventListener('click', function() {
    if (originalImage) {
        var scale = Math.min(
            (CANVAS_WIDTH - 100) / imageWidth,
            (CANVAS_HEIGHT - 100) / imageHeight,
            1
        );
        
        var w = imageWidth * scale;
        var h = imageHeight * scale;
        var offsetX = (CANVAS_WIDTH - w) / 2;
        var offsetY = (CANVAS_HEIGHT - h) / 2;
        
        points = [
            { x: offsetX, y: offsetY },
            { x: offsetX + w, y: offsetY },
            { x: offsetX + w, y: offsetY + h },
            { x: offsetX, y: offsetY + h }
        ];
        
        draw();
    }
});

// 导出按钮
document.getElementById('export').addEventListener('click', function() {
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'perspective-warp-' + new Date().getTime() + '.png';
    link.click();
});
