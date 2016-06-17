import { SERVER } from '../config';
import { showMessage, loadMessage, showImage } from './util';

var url = 'ws://' + SERVER.host + ':' + SERVER.port;
var socket = io(url);

document.getElementById('status').addEventListener('click', function() {
  socket.emit('status');
}, false);

// 连接服务器
socket.on('connect', function() {
  console.log('connect...');
});

// 系统消息
socket.on('system', function(name, count, type) {
  console.log('[' + type + '] 当前用户 ' + name + ' 当前人数 ' + count);
});

// 当前状态
socket.on('status', function(current_user, users) {
  console.log('[Status]当前用户:' + current_user);
  console.log('[Status]在线人数:' + users.length);
  console.log(users);
});

// 接收消息
socket.on('message', function(sender, msg) {
  console.log('成功接收消息');
  showMessage(sender, msg);
});

// 接收历史消息
socket.on('loadMessage', function(data) {
  console.log('成功接收历史消息');
  loadMessage(data);
});

// 接收图片
socket.on('image', function(sender, imgData) {
  showImage(sender, imgData);
});

export default socket;