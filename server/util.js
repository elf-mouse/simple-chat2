var disconnect = require('./event/disconnect');

var roleType = config.roleType;

/************************** 通用方法 ******************************/

/**
 * 未读消息去重
 */
Array.prototype.uniqueId = function() {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i].id === a[j].id)
        a.splice(j--, 1);
    }
  }

  return a;
};

/**
 * 时间对象的格式化
 * @format YYYY-mm-dd HH:mm:ss
 * @usage var now = new Date().format('YYYY-mm-dd HH:ii:ss');
 */
Date.prototype.format = function(format) {
  var o = {
    'm+': this.getMonth() + 1, // month
    'd+': this.getDate(), // day
    'H+': this.getHours(), // hour
    'i+': this.getMinutes(), // minute
    's+': this.getSeconds(), // second
    'q+': Math.floor((this.getMonth() + 3) / 3), // quarter
    'S': this.getMilliseconds() // millisecond
  }

  if (/(Y+)/.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '')
      .substr(4 - RegExp.$1.length));
  }

  for (var k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
    }
  }
  return format;
};

function now() {
  return '[' + (new Date()).format('YYYY-mm-dd HH:ii:ss') + ']';
}

/**
 * 追加自动回复
 */
function appendAutoreply(receiverId, historyMessage, autoreplyMessage) {
  var date = new Date();
  var week = date.getDay();
  var hour = date.getHours();
  var min = date.getMinutes();

  var isWorkday = week >= autoreplyMessage.start_week && week <= autoreplyMessage.end_week;
  var startTime = '1970-01-01 ' + autoreplyMessage.start_time + ':00';
  var endTime = '1970-01-01 ' + autoreplyMessage.end_time + ':00';
  var nowTime = '1970-01-01 ' + hour + ':' + min + ':00';
  var isWeekend = (isWorkday && nowTime >= startTime && nowTime <= endTime) ? false : true;

  // if (config.debug) {
  //   console.log('week:', week);
  //   console.log('isWorkday:', isWorkday);
  //   console.log('time:', nowTime, startTime + '/' + endTime);
  //   console.log('isWeekend:', isWeekend);
  // }

  if (isWeekend) {
    var output = autoreplyMessage.content.replace(/\[workhours\]/g, '[工作日：周' + config.week[autoreplyMessage.start_week] + '到周' + config.week[autoreplyMessage.end_week] + ' ' + autoreplyMessage.start_time + '-' + autoreplyMessage.end_time + ']');

    historyMessage.unshift({
      id: 0,
      senderId: 0, // 系统消息
      receiverId: receiverId,
      chatType: config.chatType.message,
      content: output,
      created: new Date().getTime()
    });
  }

  return historyMessage;
}

/************************** 检查权限 ******************************/

function checkAuth(socket, fn) {
  if (config.auth.close) {
    fn();
  } else {
    var currentTime = new Date().getTime();
    if (socket && socket.auth && currentTime < socket.authExpiry) {
      fn();
    } else {
      console.error('auth:expiry');
      // response
      socket.emit('system', config.system.auth.expiry);
      // 关闭连接
      disconnect(socket);
    }
  }
}

/************************** 登录后更新状态 ******************************/

function updateOnlineUser(socket, isOnline) {
  console.info(now() + 'updateOnlineUser');

  var user = {
    id: socket[config.pk],
    username: socket.username,
    isOnline: isOnline
  };

  if (config.debug) {
    console.log(user);
  }
  // response
  socket.to(config.roles[roleType.nurse]).emit('updateOnlineUser', user);
}

function getOnlineUser(socket) {
  console.info(now() + 'getOnlineUser');

  var onlineUsers = [];
  for (var key in users) {
    var user = users[key];
    // if (config.debug) {
    //   console.log(user.type + ':' + roleType.patient);
    //   console.log(user.type === roleType.patient);
    // }
    if (user.type === roleType.patient) {
      onlineUsers.push(user.name);
    }
  }

  if (config.debug) {
    console.log('onlineUsers', onlineUsers);
  }
  // response
  socket.emit('getOnlineUser', onlineUsers);
}

/************************** 更多消息相关 ******************************/

function setLastId(socket, data) {
  if (data.length) {
    var lastMessage = data[data.length - 1];
    // if (config.debug) {
    //   console.info('last id');
    //   console.log(socket.lastId);
    //   console.info('last message');
    //   console.log(lastMessage);
    // }
    socket.lastId = lastMessage ? lastMessage.id : 0;
  }
}

/************************** 接待用户 ******************************/

function isUniqueBinding(arr, data) {
  var result = -1;

  for (var key in arr) {
    if (arr[key].id == data.id) {
      result = key;
      break;
    }
  }

  return result;
}

function updateUserBinding(socket, data, isDelete) {
  console.info(now() + 'updateUserBinding');

  isDelete = isDelete || false;

  for (var key in users) {
    var user = users[key];
    if (user.id == data.userId) {

      if (data.isNurse) {
        var result = isUniqueBinding(user.binding, data.binding);
        if (isDelete) { // 删除
          if (result > -1) {
            user.binding.splice(result, 1);
          }
        } else { // 新增
          if (result === -1) {
            user.binding.push(data.binding);
          }
        }
        users[key].binding = user.binding;
        socket.binding = users[key].binding;
      } else {
        user.binding = data.binding; // 新增/修改
        users[key].binding = user.binding;
        socket.binding = {
          id: user.binding.id,
          username: user.binding.name
        };
      }
      break;
    }
  }
}

/************************** export ******************************/

module.exports.now = now;
module.exports.appendAutoreply = appendAutoreply;
module.exports.checkAuth = checkAuth;
module.exports.setLastId = setLastId;
module.exports.updateOnlineUser = updateOnlineUser;
module.exports.getOnlineUser = getOnlineUser;
module.exports.updateUserBinding = updateUserBinding;
