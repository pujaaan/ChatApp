$(function () {
    var socket = io();
    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#messages').stop(true,true).animate({
            scrollTop: $('#messages')[0].scrollHeight
            }, 'slow');
        $('#m').val('');
        return false;
    });
    socket.on('conn', function(){
        if(document.cookie === ''){
            socket.emit('newUser');
        }
        else{
            socket.emit('existingUser', extractInfoFromCookie());
        }
    });
    socket.on('initializeChat', function(socketInfo){
        var currSocket = socketInfo.id;
        socket.id = currSocket;
        var prevMsg = socketInfo.prevMsg;
        $("#userDef")[0].textContent = "You are " + currSocket;
        for(var elem in prevMsg){
            $('#messages').append($('<li>'+ prevMsg[elem] + "</li>"));
        }
    });

    socket.on('saveCookie', function(socketInfo){
        document.cookie = "user=" + socketInfo.id + ",color=" + socketInfo.color + ",count=" + socketInfo.count; 
    })
    socket.on('updateUsers', function(names){
        console.log(names);
        for (var elem in names){
            if($('#users').find("li:contains('"+ names[elem].id+"')").length === 0){
                $('#users').append("<li>" + names[elem].id + "</li>");
            }
        }
    });

    socket.on('changeColor', function(status){
        if(status){
            $('#m').attr('placeholder', 'Color Changed');
        }
        else{
            $('#m').attr('placeholder', 'Invalid nickname color change request');
        }

    })
    socket.on('updateCookie', function(newCookie){
        document.cookie = document.cookie + " expires=Thu, 18 Dec 2013 12:00:00 UTC; path=/";
        document.cookie = newCookie;
    })
    socket.on('dconn', function(name){
        if (name !== ""){
            $('#users').find("li:contains('"+ name +"')").remove();
        }
    });

    socket.on('changeNickName', function(statusInfo){
        if(socket.id === statusInfo.oldNickName){
            if(statusInfo.status === false){
                if(statusInfo.newNickName === "Invalid"){
                    $('#m').attr('placeholder', 'Invalid nickname change request');
                }
                else{
                    $('#m').attr('placeholder', 'Duplicate username!! Must be unique');
                }
            }
            else{
                $('#m').attr('placeholder', 'Nickname Changed to ' + statusInfo.newNickName + ' from ' + statusInfo.oldNickName);
                socket.id = statusInfo.newNickName;
            }
        }
        if(statusInfo.status === true){
            $('#users').find("li:contains('"+ statusInfo.oldNickName +"')").text(statusInfo.newNickName);
        }
    });

    socket.on('chat message', function(msg){
        if(msg.sender !== socket.id){
            $('#messages').append($('<li>'+ msg.msg + "</li>"));
        }
        else{
            $('#messages').append($('<li style="font-weight:bold">' + msg.msg + '</li>'));
        }
        if($('#messages').height() >= $('#msgContainer').height() - 26){
            $('#messages').css("height", "calc(100% - 25px)");
            $('#messages').css("overflow-y", "auto");
        
        }
        
      });

    $('#m').keypress(function(){
        if($('#m').attr('placeholder') !== ''){
            $('#m').attr('placeholder', '');
        }
    })    

    function extractInfoFromCookie(){
        var allCookie = document.cookie;
        return {id: (allCookie.split(",")[0]).split("=")[1], color: (allCookie.split(",")[1]).split("=")[1], count:(allCookie.split(",")[1]).split("=")[2]}
    }

  });