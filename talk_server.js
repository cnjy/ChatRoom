const WebSocket = require("ws");
const express = require("express");
const uuid = require("node-uuid");

const app = express();
app.listen(8080, function(){
	console.log("HTTP Server running on 192.168.15.30:8080");
});
app.get("/", function(req,res){
	res.sendFile(__dirname+"/talk.html");
})

const wss = new WebSocket.Server({port:8667}, function(){
	console.log("WebSocket Server running on 192.168.15.30:6667");
});


let clientIndex = 1; //计数
let clients = []; //存储客户端

wss.on("connection", function(ws) {
	console.log(ws)
	var nickname = "匿名用户"+clientIndex;
	clientIndex ++;
	var clientId = uuid.v4();

	//添加客户端信息
	clients.push({
		"id":clientId,
		"ws":ws,
		"nickname":nickname
	});

	//群发消息 该用户加入群聊
	sendMessage("notice", nickname, nickname+" 加入群聊");

	//接收用户发送的消息 事件监听
	ws.on("message", function(msg){
		if (msg.indexOf("nick////") === 0) {
			//修改昵称
			var oldNickname = nickname;
			nickname = msg.substr(8);

			sendMessage("notice", nickname, oldNickname+" 已经改名为 "+nickname);

		} else{

			sendMessage("message", nickname, msg);
		}
	});


	//用户退出事件
	ws.on("close", function(){

		//把退出的用户从 clients 中删掉
		clients.forEach(function(item, index) {
			if (item.id === clientId) {
				clients.slice(index, 1);
				sendMessage("notice", nickname, nickname+" 离开群聊");
				return;
			}
		})

	})
});



//群发送给用户
function sendMessage(type, nickname, msg) {
	clients.forEach(function(item){
		if (item.ws.readyState === WebSocket.OPEN) {
			item.ws.send(JSON.stringify({
				"type":type,
				"nickname":nickname,
				"message":msg
			}))
		}
	})
}
