var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
var msg = [];

app.use(express.static('public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){
  // Random nickname assignment on connection
  var userInfo;
  socket.emit('conn');
  socket.on('newUser', function(){
    userInfo = assignUserName();
    socket.id = userInfo.id;
    socket.emit('initializeChat', {id: socket.id, prevMsg: msg, color: getColor(socket.id)});
    // Update the user list
    io.emit('updateUsers',users);
    socket.emit('saveCookie', userInfo);
  });
  socket.on('existingUser', function(cookieInfo){
    socket.id = cookieInfo.id;
    if(users.length === 0){
      users.push(cookieInfo);
    }
    else{
      var toInsert = false;
      for (var i in users){
        if(users[i].id !== socket.id){
          toInsert = true;
        }
        else{
          users[i].count = users[i].count+1;
        }
      }
      if(toInsert){
        users.push(cookieInfo);
      }
    }
    socket.emit('initializeChat', {id: socket.id, prevMsg: msg, color: getColor(socket.id)});
    // Update the user list
    io.emit('updateUsers',users);

  });



  // On chat message
  socket.on('chat message', function(msg){
    // If the command is /nick
    if(msg.split(" ")[0] === "/nick"){
      var status = false;
      // If the length isnt 2 or if the nickname is empty then emit an invalid
      if(msg.split(" ").length !== 2 || msg.split(" ")[1] === ''){
        socket.emit('changeNickName', {status: status, newNickName: "Invalid", oldNickName : socket.id});
      }
      // Else emit the status, new and old nickname
      else{
        var status = changeNickname(msg.split(" ")[1], socket.id);
        io.emit('changeNickName', {status: status, newNickName: msg.split(" ")[1], oldNickName : socket.id});
        // If status is true then change the socket ID
        if (status === true){
          
          socket.id = msg.split(" ")[1];
          socket.emit('updateCookie', "user=" + socket.id + ",color=" + getColor(socket.id) + ",count="+ getCount(socket.id));
        }
      }
    }
    // Filter /nickcolor color
    else if(msg.split(" ")[0] === "/nickcolor"){
      var status = changeNickColor(msg.split(" ")[1], socket.id);
      socket.emit('changeColor', status);
      if(status === true){
        socket.emit('updateCookie', "user=" + socket.id + ",color=" + getColor(socket.id) + ",count="+ getCount(socket.id));
      }
    }

    // i
    else{
      var timeStamp = getTimeStamp();
      var userId = socket.id;
      var fullMsg = "<div>" + timeStamp + " <span style='color:"+getColor(userId)+"'>" + userId + "</span>: "+ msg + "</div>"
      if(msg.length <= 200){
        msgPush(fullMsg);
      }
      io.emit('chat message', {msg: fullMsg, sender: socket.id});
    }
    });

  socket.on('disconnect', function(){
    var status = removeUser(socket.id);
    console.log(socket.id + " disconnected")

   // if(status){
      io.emit('dconn', socket.id);
   // }
   // else{
    //  io.emit('dconn', "");
   // }
  });
});



http.listen(3000, function(){
  console.log('listening on *:3000');
});

function changeNickname(newNickName, oldNickName){
  for (var i in users){
    if (users[i].id === newNickName){
      return false;
    }
  }
  for (var i in users){
    if(users[i].id === oldNickName){
        users[i].id = newNickName;
        return true;
    }
  }
}

function changeNickColor(hexVal, socketID){

  if(/^#[0-9A-F]{6}$/i.test("#"+hexVal)){
    for (var i in users){
      if(users[i].id === socketID){
          users[i].color = "#" + hexVal;
          return true;
      }
    }
  }
  else{
    return false;
  }
}

function removeUser(name){
  for (var i in users){
    if (users[i].id === name){
     // console.log(users[i].count)
     // if(users[i].count <= 1){
        
      users.splice(i, 1);
      //return true;
      //}
      //else{
        //users[i].count = users[i].count-1;
        //return false;
     // }
    }
  }
}
function  msgPush(fullMsg){
  msg.push(fullMsg);

}
function getTimeStamp(){
  var today = new Date();
  return addZero(today.getHours()) + ":" + addZero(today.getMinutes());
}
function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
function assignUserName(){
  var uniqueId = "user" + Math.floor((Math.random() * 1000) + 1);
  while(users.includes(uniqueId)){
    var uniqueId = "user" + Math.floor((Math.random() * 1000) + 1);
  }
  users.push({id:uniqueId, color:"red", count:1});
  return {id:uniqueId, color:"red", count:1};
}
function getColor(socketID){
  for (var i in users){
    if(users[i].id === socketID){
        return users[i].color;
    }
  }
  
}
function getCount(socketID){
  for (var i in users){
    if(users[i].id === socketID){
        return users[i].count;
    }
  }
  
}