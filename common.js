var notificationsModel = require("./models/notifications");

exports.notificationMessage = function (action , message, module, userInfo, item_id, log_id)
{
    var object = {
        message : message,
        action : action,
        module : module,
        user : userInfo,
        count : 1,
        status : "unseen" ,
        date : Date.now(),
        item_id: item_id,
        log_id : log_id
    };
    notificationsModel.create(object);
};

