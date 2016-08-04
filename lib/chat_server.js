var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
	var name='Guest'+guestNumber;//生成新昵称
	nickNames[socket.id]=name;
	socket.emit('nameResult',{//让用户知道昵称
		success:true,
		name:name
	});
	namesUsed.push(name);//存放已被占用的昵称
	return guestNumber+1;//昵称计数器
}
//分配昵称

function joinRoom(socket, room){
	socket.join(room);//加入房间
	currentRoom[socket.id]=room;
	socket.emit('joinResult',{room:room});//告知用户进了哪个房间
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.id]+'加入了'+room+'。'
	});
	var usersInRoom=io.sockets.clients(room);//那些人在房间里
	if(usersInRoom.length>1){
		var usersInRoomSummary='Users currently in'+room+':';
		for(var index in usersInRoom){
			if (index>0){
				usersInRoomSummary+=',';
			}
			usersInRoomSummary+= nickNames(userSocketId);
		}
	}
	usersInRoomSummary+=',';
	socket.emit('message',{text:usersInRoomSummary});//告诉用户房间里的其他人
}
//加入房间
function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest') == 0){
			socket.emit('nameResult',{
				success:false,
				message:'不能用Guest开头'
			});
		}else{
			if (namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id]=name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName+'更名为'+name+'。'
				})
			}else{
				socket.emit('nameResult',{
					success:false,
					message:'用户名已被使用'
				});
			}
		}
	});
}
//处理改名
function handleMexxageBroadcasting(socket, nickNames){
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id]+':'+message.text
		});
	});
}
//发送消息
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}
//创建房间
function handleClientDisconnection(socket,nickNames,namesUsed){
	socket.on('disconnect',function(){
		var nameIndex =namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	})
}
//断开连接
exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);//处理用户信息，更名，以及聊天室的创建和变更
        joinRoom(socket, 'sb');
        handleMexxageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms',function(){//用户发出请求时，向其提供已被占用的聊天室列表
        	socket.emit('rooms',io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket,nickNames,namesUsed);//定义用户离开连接后抢出
    })
}