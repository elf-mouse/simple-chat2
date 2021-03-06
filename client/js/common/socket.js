import { SERVER } from '../config';
import { showMessage, loadMessage, showImage } from './util';

var url = 'ws://' + SERVER.host + ':' + SERVER.port;
var socket = io(url);

document.getElementById('status').addEventListener('click', function() {
  socket.emit('status');
}, false);

socket.on('system', function(data) {
  console.log(data);
});

// 连接服务器
socket.on('connect', function() {
  console.log('connect...');
});

socket.on('auth', function() {
  console.log('check auth again');

  var token = 'NmIzZGY3NzE3OTNmMTA2OTlmZjRkNTE0NjgzOTk2NzE=';
  socket.emit('auth', token);
});

// 获取当前状态
socket.on('status', function(data) {
  console.log('[Status]当前用户:' + data.currentUser);
  console.log('[Status]在线人数:' + data.userIds.length);
  console.log(data.users);
  console.log(data.userIds);
});

/**
 * 接收消息
 *
 * data.senderId 发送者ID
 * data.message 消息内容
 * data.unread 未读消息
 */
socket.on('message', function(data) {
  console.info('成功接收消息');
  console.log(data);
  // if (data.unread && document.getElementById('msg-' + data.senderId)) {
  //   document.getElementById('msg-' + data.senderId).innerHTML = data.unread;
  // }
  showMessage(data.senderId, data.message);
});

/**
 * 接收历史消息
 * @param  {array} data 消息列表
 */
socket.on('loadMessage', function(data) {
  console.info('成功接收历史消息');
  console.log(data);
  loadMessage(data);
});

/**
 * 接收图片
 *
 * data.senderId 发送者ID
 * data.message 图片内容
 * data.unread 未读消息
 */
socket.on('image', function(data) {
  console.log('成功接收图片');
  if (data.unread && document.getElementById('msg-' + data.senderId)) {
    document.getElementById('msg-' + data.senderId).innerHTML = data.unread;
  }
  showImage(data.senderId, data.message);
});

/**
 * 接待通知
 *
 * data.nurseId 绑定秘书ID
 * data.patinetId 绑定患者ID
 */
socket.on('call', function(data) {
  console.log(data);
});

/**
 * 转接通知
 *
 * data.fromNurse 秘书A绑定信息
 * data.toNurse 秘书B绑定信息
 * data.patinet 患者绑定信息
 */
socket.on('callForwarding', function(data) {
  console.log('护士' + data.fromNurse.id + '已将病人' + data.patientIds + '转入' + data.toNurse.id);
});

export default socket;
