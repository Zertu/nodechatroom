var Chat = function(socket){
	this.socket=socket;
}
Chat.prototype.sendMessage=function(room,text){
	var message ={
		room:room,
		text:text
	};
	this.socket.emit('message',message);
}//发送聊天消息
Chat.prototype.changeRoom=function(room){
	this.socket.emit('join',{//join用来加入
		newRoom:room
	});
};
//变更房间
Chat.prototype.processCommand = function(command){
	var words = command.split(' ');
	var command =words[0].substring(1,words[0].length).toLowerCase();
	var message =false;
	switch(command){
		case 'join':
		words.shift();
		var room =words.join(' ');
		this.changeRoom(room);
		break;
		case 'nick':
		words.shift();
		var name =words.join(' ');
		this.socket.emit('nameAttempt',name);
		break;
		default:
		message='未知命令';
		break;
	}
	return message;
}
