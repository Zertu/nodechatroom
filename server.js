var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

function send404(res) {
    res.writeHead(404, { 'Content-type': 'text/plain' });
    res.write('Error 404');
    res.end();
}//404页面

function sendFile(res, filePath, fileContents) {
    res.writeHead(200,
        { 'Content-Type': mime.lookup(path.basename(filePath)) }
    );
res.end(fileContents);
}//文件数据服务
//先写出正确的http头然后发送文件的内容
function serveStatic(res, cache, absPath) {
    if (cache[absPath]) {//检查文件是否存在
        sendFile(res, absPath, cache[absPath])//从内存返回文件
    } else {
        fs.exists(absPath, function (exists) {//文件是否存在
            if (exists) {
                fs.readFile(absPath, function (err, data) {//从硬盘中读文件
                    if (err) {
                        send404(res);
                    }
                    else {
                        cache[absPath] = data;
                        sendFile(res, absPath, data);//从硬盘中读取文件并返回
                    }
                });
            } else {
                send404(res);//如果读取失败返回404
            }
        })
    }
}
var server = http.createServer(function (request, response) {
    var filePath = false;
    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});
server.listen(3000, function () {
    // 终端打印如下信息
    console.log('Success http://127.0.0.1:3000');
});