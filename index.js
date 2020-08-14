let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let canvasData;
let path = require('path');
let url = require('url');

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/image', express.static(__dirname + '/image'));

var paramRoomNumber;
var line_history = {};

app.get('/', function(req,res) {
    res.sendFile(__dirname + '/index.html');
})

app.get('/room', function(req, res) {
    var parsedUrl = url.parse(req.url, true);
    paramRoomNumber = encodeURIComponent(parsedUrl.query.room);
    res.sendFile(__dirname + '/room.html');
});

io.on('connection', function (socket) {
    console.log('a user connected', socket.id);
    //socket.broadcast.to(socket.id).emit('drawing', canvasData);

    // first send the history to the new client
    if (line_history[paramRoomNumber] !== undefined) {
        for (var i in line_history[paramRoomNumber]) {
            socket.emit('drawing', { roomNumber: paramRoomNumber, canvasJson: line_history[paramRoomNumber][i] });
        }
    }
    
    
    socket.on("joinRoom", function(roomNumber) {
        console.log(">>>>> join: ", roomNumber);
        socket.join(roomNumber);
    })

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('ready', function (msg) {
        console.log(msg);
    });

    socket.on('drawing', function (roomData) {
        var canvasJson = roomData.canvasJson;
        var roomNumber = roomData.roomNumber;
        canvasData = canvasJson;

        console.log(">>>>> Drawing: ", roomNumber);

        socket.broadcast.to(roomNumber).emit('drawing', roomData);

        if (line_history[roomNumber] === undefined) {
            line_history[roomNumber] = [];
        }

        line_history[roomNumber].push(canvasData);
    });

    socket.on('remove', function (roomNumber) {
        if (line_history[roomNumber] !== undefined) {
            delete line_history[roomNumber][line_history.length - 1];
        }
    })
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});