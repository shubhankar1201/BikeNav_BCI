window.onload = function() {

  // Get references to elements on the page.
  var form = document.getElementById('message-form');
  var messageField = document.getElementById('message');
  var messagesList = document.getElementById('messages');
  var socketStatus = document.getElementById('status');
  var closeBtn = document.getElementById('close');
  var micBtn = document.getElementById('voice_button');

  var toggleFlag = false;
  var voiceToggle = false;
  var push = false;
  var threshold = 0.6;


  // Create a new WebSocket.
  var socket = new WebSocket("wss://emotivcortex.com:54321");


  // Handle any errors that occur.
  socket.onerror = function(error) {
    console.log('WebSocket Error: ' + error);
  };


  // Show a connected message when the WebSocket is opened.
  socket.onopen = function(event) {
    socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.URL;
    socketStatus.className = 'open';

    //Clearing local storage
    localStorage.clear();

    //Get auth token
    var auth_request =   {
      "jsonrpc": "2.0",
      "method": "authorize",
      "params": {},
      "id": 1
    };
    socket.send(JSON.stringify(auth_request));

    setTimeout(function(){ 
      //Send create session request
      var create_session_request =   {
        "jsonrpc": "2.0",
        "method": "createSession",
        "params": {
          "_auth": localStorage.getItem("auth"),
          "status": "open"
        },
        "id": 1
      }
      console.log("create session request: " + JSON.stringify(create_session_request));
      socket.send(JSON.stringify(create_session_request));
    }, 500);

  };

  subscribe.onclick = function(e) {
    e.preventDefault();
    var mental_command_subscribe_request = {
      "jsonrpc": "2.0",
      "method": "subscribe",
      "params": {
        "_auth": localStorage.getItem("auth"),
        "streams": [
          "com"
        ]
      },
      "id": 1
    }

    var mental_command_unsubscribe_request = {
      "jsonrpc": "2.0",
      "method": "unsubscribe",
      "params": {
        "_auth": localStorage.getItem("auth"),
        "streams": [
          "com"
        ]
      },
      "id": 1
    }

    if (toggleFlag === true) {
      socket.send(JSON.stringify(mental_command_unsubscribe_request));
      document.getElementById("subscribe").innerText= "Subscribe";
      toggleFlag = false;
    } else {
      socket.send(JSON.stringify(mental_command_subscribe_request));
      document.getElementById("subscribe").innerText= "Unsubscribe";
      toggleFlag = true;
    }

  };

  // Handle messages sent by the server.
  socket.onmessage = function(event) {
    var message = event.data;
    //messagesList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
    var response = JSON.parse(message);
    console.log(response);

    //Check for mental command stream
    if ('com' in response) {
      let mental_command = response.com[0];
      let pow = response.com[1];
      console.log(mental_command + ', ' + pow);
      
      //Activate push flag if power is above threshold
      push = pow >= threshold ? true : false;
      console.log('push: ' + push);

      //Update button color based on push flag status
      if (push && !voiceToggle) {
        voiceToggle = true;
        startDictation();
        setTimeout(function(){
          voiceToggle = false;
        }, 1000);
      } 
    }

    //Save auth token to local storage if it exists in the response
    if ('result' in response && !localStorage.getItem('auth')) {
      //console.log(response.result._auth);
      // console.log("Im in auth set");
      var auth = response.result._auth;
      localStorage.setItem('auth', auth);
      console.log(localStorage);
    }
  };


  // Show a disconnected message when the WebSocket is closed.
  socket.onclose = function(event) {
    socketStatus.innerHTML = 'Disconnected from WebSocket.';
    socketStatus.className = 'closed';
  };

  // Close the WebSocket connection when the close button is clicked.
  closeBtn.onclick = function(e) {
    e.preventDefault();

    // Close the WebSocket.
    socket.close();
    return false;
  };

  voice_button.onclick = function(e) {
    e.preventDefault();
    startDictation();
  }

  function startDictation() {
		var micBtn = document.getElementById('voice_button');
		micBtn.src="img/voice_anim.gif";
		if (window.hasOwnProperty('webkitSpeechRecognition')) {

		var recognition = new webkitSpeechRecognition();
	
		recognition.continuous = false;
		recognition.interimResults = false;

		recognition.lang = "en-US";
		recognition.start();

		recognition.onresult = function(e) {
			document.getElementById('transcript').value
									= e.results[0][0].transcript;
			recognition.stop();
			micBtn.src="img/voice_icon.jpg";
			document.getElementById('labnol').submit();
		};

		recognition.onerror = function(e) {
			recognition.stop();
			micBtn.src="img/voice_icon.jpg";
		}
		
		recognition.onend = function(){
			micBtn.src="img/voice_icon.jpg";
		}
		}
	}

};
