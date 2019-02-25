const mongo = require('mongodb').MongoClient;
const express = require('express');
const app = express();
//obj app.listen() เก็บที่ server เพื่อใช้สำหรับส่งเป็น argument ให้ socket.io
const server = app.listen(4000,function(){
  console.log('lishening to require on port 4000');
});
//const socket = require('socket.io');
//var io = socket(server);
const io = require('socket.io').listen(server);

//Static files เพื่อให้ express ลิงค์ไฟล์ public/css/main.css ได้ถูกต้อง
app.use(express.static('public'));

//Connect to MongoDB
var url = "mongodb://localhost:27017/chatroom";

mongo.connect(url,{ useNewUrlParser: true },function(err,db){
    if(err){
      throw err;
    }
    console.log('MongoDB Connected')
    
    //ให้ socket รับ event ที่ชื่อ connection
    io.on('connection',function(socket){
      var dtb = db.db("chatroom")
      let talk = dtb.collection('chatdb');
    
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
          talk.insertOne({name: name, message: message}, function(){
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
        talk.deleteOne({}, function(){
          // Emit cleared
        socket.emit('cleared');
        });
      });

      console.log('made socket connection',socket.id);
    });

});



