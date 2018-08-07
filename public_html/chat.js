/*
		Author: Tyler Despatie
		Student Number: 101010622
		Course: COMP 2406
		Section: A1
		File: chat.js
*/

/* Handle ctrl + double click functionality */
var heldKey = null;
$(document).on ({'keydown' : function (e) {heldKey = e.which || e.keyCode;}});
$(document).on({'keyup' : function (e) {heldKey = undefined;}});
/* End Handle ctrl + double click */

$(document).ready(function(){
  // Prompt the user for a username, defaults to "User"
  var userName = prompt("What's your name?")||"User";
  var socket = io(); //connect to the server that sent this page

  // Send an introduction to the server with our username
  socket.on('connect', function(){
    socket.emit("intro", userName);
  });

  // Detect when the user hits 'enter' in the input box to send a message
  $('#inputText').keypress(function(ev){
      if(ev.which===13){ // Check for enter key event
        socket.emit("message", $(this).val()); // Send the message inside inputText
        ev.preventDefault(); // Add to the chatlog a timestamp and the message the user sent
        $("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n");
        $('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
        $(this).val(""); //empty the input
      }
  });

  /* Function: sendPrivMsg
      Purpose: send "privateMessage" to the server for the server to handle private messaging
           In: $(this) which is a list item that was clicked
  */
  function sendPrivMsg() {
    if ($(this).text() != userName) { // Detect if the user is trying to block/message himself
      if (heldKey == 17 || heldKey == 18) { // If the ctrl key is pressed
        socket.emit("blockUser", $(this).text()); // Block the user clicked
      } else { // We're private messaging another user
        var message = prompt("What would you like to send " + $(this).text() + "?");
        if (message) socket.emit("privateMessage", $(this).text(), message); // Send message
      }
    } else // Notify the user he can't message/block himself
      alert("You can't block/message yourself!");
  }

  // Handle messages sent to us by adding them to the chatlog
  socket.on("message",function(data){
    $("#chatLog").append(data+"\n"); // Append the new message
    $('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
  });

  // Handle what to do when we receive a private message
  socket.on("privateMessage", function(username, message) {
    // Prompt the user with the message sent to them and promt for input to send back
    var privMsg = prompt("Private message from " + username + ": " + message);
    if (privMsg) socket.emit("privateMessage", username, privMsg); // only respond if necessary
  });

  // Update the userList when the server sends us updated data
  socket.on("userList", function(data) {
    $("#userList").html(""); // Clear the userList
    $.each(data, function(id, user) { // Each client on the server add to user list
      var li = $("<li id='"+id+"'>" + user + "</li>").dblclick(sendPrivMsg);
      $("#userList").append(li);
    });
  });
});
