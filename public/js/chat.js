const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true});
const autoScroll = () => {
  // New Message element  
  const $newMessage = $messages.lastElementChild;

  // Height of the new Message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible Height
  const visibleHeight = $messages.offsetHeight;

  // Height of message Container
  const containerHeight = $messages.scrollHeight;

  // How far I have scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  
  if(containerHeight-newMessageHeight <= scrollOffset) {
       $messages.scrollTop = $messages.scrollHeight; // To give nice user experienc
  }
//   $messages.scrollTop = $messages.scrollHeight; // To always scroll up
}
socket.on("message", (message) => {
    console.log(message);
    const html1 = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html1);
    autoScroll();
});

//Templates

socket.on("locationMessage", (message) => {
    console.log(message);
    const html1 = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html1);
    autoScroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    console.log("==========", room, users, "============");
    console.log(html);
    document.querySelector('#sidebar').innerHTML = html;
})

window.addEventListener("DOMContentLoaded", (event) => {
    $messageForm.addEventListener("submit", (e)=> {
            e.preventDefault();
            $messageFormButton.setAttribute('disabled', 'disabled');
            const message = e.target.elements.message.value;
            socket.emit("sendMessage", message, (err) => {
            $messageFormButton.removeAttribute('disabled');
            $messageFormInput.value = '';
            $messageFormInput.focus();
               if(err) {
                return console.log(err);
               } 
               console.log("Message delivered !!");
            });
          } );  

        $sendLocationBtn.addEventListener("click", (e) => {
        if(!navigator.geolocation) {
           alert("geolocation is not supported");
        } else {
            $sendLocationBtn.setAttribute('disabled','disabled');
            navigator.geolocation.getCurrentPosition(position => {
                socket.emit("sendLocation", {longitude: position.coords.longitude, latitude: position.coords.latitude}, (msg) => {
                    $sendLocationBtn.removeAttribute('disabled');
                    console.log(msg);
                })
            });
        }
        });
});






socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error);
        location.href="/";
    }
});