const mongo = require('mongodb').MongoClient;
var express = require('express');
const socket = require('socket.io');
//App setup
var app = express();
var server = app.listen(4000,function(){
  console.log('lishening to require on port 4000');
});

//Static files
app.use(express.static('public'));

//socket setup
var io = socket(server);

//Connect to MongoDB
var url = "mongodb://localhost:27017/chatroom";
mongo.connect(url,{ useNewUrlParser: true },function(err,db){
  if(err){
    throw err;
  }
  console.log('MongoDB Connected')

  
  io.on('connection',function(socket){
    var dtb = db.db("chatroom")
    let talk = dtb.collection('chatdb');
    
    socket.on('typing',function(data){
      socket.broadcast.emit('typing',data);
    })
    
    // Create function to send status
    sendStatus = function(s){
      socket.emit('status', s);
    }

     // Get chatdb from mongo collection 
    talk.find().limit(100).sort({_id:1}).toArray(function(err, res){
      if(err){
          throw err;
      }
      //Emit the messages
      socket.emit('output', res);
    });
      
      // Handle input events
    socket.on('input', function(data){
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if(name == '' || message == ''){
          // Send error status
          sendStatus('Please enter a message');
      } else {
          // Insert message
          talk.insert({name: name, message: message}, function(){
              io.emit('output', [data]);

              // Send status object
              sendStatus({
                  message: 'Message sent',
                  clear: true
              });
          });
        }
      });

    // Handle clear
    socket.on('clear', function(data){
      // Remove all chats from collection
      talk.remove({}, function(){
          // Emit cleared
          socket.emit('cleared');
      });
    });

    console.log('made socket connection',socket.id);

   // socket.on('chat',function(data){
   //   io.sockets.emit('chat',data);
   // })
  

  });
});



