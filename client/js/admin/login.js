import { ROLE_TYPE as roleType } from '../config';
import socket from '../common/socket';
import { getUserInfo, initMessage, loadMessage } from '../common/util';
import data from '../data'; // 假数据

var user;

// 测试（真实环境无需手动登录）
document.getElementById('login').addEventListener('click', function() {
  console.log('before connect');

  var userId = document.getElementById('users').value;
  user = getUserInfo(userId, roleType.nurse);
  // 登录聊天服务器
  socket.emit('login', user); // 真实环境应进入页面时自动触发
}, false);

// 断线
socket.on('disconnected', function() {
  console.log(user.id + ':' + user.name + ' is offline');
});

// 已登录
socket.on('userExisted', function() {
  console.log(user.id + ':' + user.name + ' userExisted');
});

/**
 * 登录成功
 * @param  {[array]} data 消息列表
 */
socket.on('loginSuccess', function(data) {
  console.log(user.id + ':' + user.name + ' loginSuccess');

  window.user = user;
  console.log(window.user);

  if (data.length) {
    data.map(function(item) {
      if (item.unread) {
        document.getElementById('msg-' + item.id).innerHTML = item.unread;
      }
    });
  }
});

/**
 * 更新在线状态
 *
 * user.id 用户ID
 * user.username 用户名
 * user.isOnline 是否上线
 */
socket.on('updateOnlineUser', function(user) {
  console.log(user);
});

/**
 * 获取在线状态
 * @param  {array} users 在线患者列表
 */
socket.on('getOnlineUser', function(users) {
  console.log(users);
});

// 选择聊天用户（绑定操作优先走DB检查）
[].forEach.call(document.querySelectorAll('.user'), function(el) {
  el.addEventListener('click', function() {
    // 检查是否可绑定
    // your request...

    // 绑定成功
    var receiverId = this.dataset.id;
    window.receiverId = receiverId;

    // for test
    var receiver;
    for (var patient of data.patient) {
      if (patient.id == receiverId) {
        receiver = patient;
        break;
      }
    }

    // 接待用户
    // socket.emit('call', receiver);
    // document.getElementById('msg-' + receiver.id).innerHTML = '';

    // 切换用户
    // window.historyMessageObj.innerHTML = '';
    // initMessage();
    // socket.emit('loadMessage', receiver.id);

    // 转接用户
    // socket.emit('callForwarding', [data.patient[0], data.patient[3]], data.nurse[0]);

    console.log('当前聊天对象' + receiver.id + ':' + receiver.name);
  }, false);
});
