/*
		Author: Tyler Despatie
		Student Number: 101010622
		Course: COMP 2406
		Section: A1
		File: app.js
*/

var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');

var ROOT = "./public_html";

http.listen(2406);

console.log("Chat server listening on port 2406");

var client, clients = {};

function handler(req,res) {

	var filename = ROOT+req.url;

	fs.stat(filename,function(err, stats){
		if(err) {   //try and open the file and handle the error, handle the error
			respondErr(err);
		} else {
			// If the user is trying to access a directory, re-route to index.html
			if(stats.isDirectory()) 
				filename = ROOT + "/index.html";
			fs.readFile(filename, function(err, data){
				if(err) respondErr(err); // Handle the error
				else respond(200,data); // Send the page requested
			});
		}
	});

	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		if(err.code==="ENOENT") {
			respond(404, "<h1>Error 404: Page not found.</h1>");
			console.log(err.message + "\nGET: 404 page.");
		} else
			respond(500, err.message);
	}

	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		res.end(data); // write message and signal communication is complete
	}
	console.log(req.method+" request for: "+req.url);
}

// Handle what happens when a client connects to us
io.on("connection", function(socket){
	console.log("Got a connection");
	socket.on("intro",function(data){ // Handle what happens when a client introduces us
		socket.username = data; // Get the username the client sent
		client = {username: socket.username, // Create a client object containing userName
							sock: socket,							// socket, and a blocked user list
							blockedUsers: []};
		clients[socket.username] = client; // Add the client object to the dictionary of clients
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+"."); // send a welcome message to self
		io.emit("userList", getUserList()); // Send updated user list
	});

	// Handle what happens when the client sends us a "message"
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data); // Send message to all users
	});

	// Handle what happens when a client disconnects
	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected."); // send disconnect message to all users
		delete clients[socket.username]; // Remove the client object from the dictionary
		io.emit("userList", getUserList()); // Send updated user list
	});

	// Handle what happens when a private message is sent between clients
	socket.on("privateMessage", function(username, message) {
		console.log(socket.username + " private messaged " + username + ": " + message);
		client = clients[username]; // Find the client with the username specified
		if (client.blockedUsers.indexOf(socket.username) == -1) // Check if the user has blocked the sender
			client.sock.emit("privateMessage", socket.username, message); // Send message to username
	});

	// Handle what happens when a blockUser request is sent to the server
	socket.on("blockUser", function(username) {
		console.log(socket.username + " requested to block " + username);
		client = clients[socket.username]; // Find the client with the username specified
		if (client.blockedUsers.indexOf(username) > -1) { // Check if the user has blocked the sender
			client.blockedUsers.splice(client.blockedUsers.indexOf(username), 1); // if blocked, unblock
			client.sock.emit("message",timestamp()+", "+ username + " has been unblocked"); // notify user
		} else {
			client.blockedUsers.push(username); // Block the user
			client.sock.emit("message",timestamp()+", "+ username + " has been blocked"); // notify user
		}
	});
});

/*
	Function: timestamp
	Purpose: generate a timestamp string for messages
*/
function timestamp(){
	return new Date().toLocaleTimeString();
}

/* Function: getUserList
	 Purpose: create an updated user list and return the usernames back
	 		Out: return array of usernames
*/
function getUserList(){
    var ret = [];
    for (var user in clients) // Iterate through clients
      ret.push(user); // Add each username found
    return ret; // Return array of usernames
}
