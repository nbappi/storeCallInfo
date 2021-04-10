var scheduleModel = require("../models/schedule");
var schedule = require('node-schedule');

/*exports.findAll = function (req, res, next) {
    scheduleModel.find({}, function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
};*/

exports.findById = function (req, res, next)
{
    scheduleModel.find({ _id: req.params.id }, function (err, results) {
        if (err) {
          return next(err);
        }
        res.send(results);
    });
};

exports.add = function (req, res, next)
{

    var ics = req.body.ics_str.replace(/\n/g,'\n');
    var cronStr = getIcsToCronStr(ics);
    var cnt = 0;

    var startJob = schedule.scheduleJob('start_'+req.body.event_id,cronStr.startDate, function(){
        console.log('Start Job '+req.body.name);

        var j = schedule.scheduleJob('cron_'+req.body.event_id, cronStr.cronDate, function () {
            cnt++;
            console.log(cnt, req.body.name);
            //socket emit
            var broadcast = require('../socketExt').broadcast;
            //broadcast('schedule_event' ,'this is a periodical msg for ' + req.body.name );
            var socketIO = require('../socketExt').socketIO;
            socketIO.emit('schedule_event' ,'this is a periodical msg for ' + req.body.name);
            //commonExt.notificationMessage('CREATE', 'Currency Add', 'currency', req.headers.userinfo, results._id.toString());
        });
    
    });

    var endJob = schedule.scheduleJob('end_'+req.body.event_id, cronStr.endDate, function(){
        console.log('End Job '+req.body.name)
        var jobs = schedule.scheduledJobs;
        jobs['cron_'+req.body.event_id].cancel();
    });



    /*scheduleModel.create(data, function (err, results) {
        if (err) {
            return next(err);
        }
        console.log('data inserted');
        return res.json({message:"data insert",status:1,data:results});
    });*/
};

exports.delete = function (req, res, next)
{
    
    console.log("delete",req.params);
    var eventId = req.params.id;
    
    var startJob = schedule.scheduledJobs['start_'+eventId];
    var endJob = schedule.scheduledJobs['end_'+eventId];
    var cronJob = schedule.scheduledJobs['cron_'+eventId];
    //console.log(job);
    if(startJob){ startJob.cancel(); }
    if(endJob){ endJob.cancel(); }
    if(cronJob){ cronJob.cancel(); }
    
    

    /*scheduleModel.remove({ event_id: eventId }, function(err) {
        if (err)
        {
            console.log("can not delete");
            return next(err);        
        }      

        res.send("delete one");
        
    });*/
};

function getIcsToCronStr(data){
    var ical = require('ical');
    var icsJson = ical.parseICS(data);

    for(var prop in icsJson){
      if(icsJson[prop]){
        var event = icsJson[prop];
        var options = event.rrule.options;
        var second = (options.bysecond.length) ? options.bysecond.toString() : '*';
        var minute = (options.byminute.length) ? options.byminute.toString() : '*';
        var hour = (options.byhour.length) ? options.byhour.toString() : '*';
        var dayOfMonth = (options.bymonthday.length) ? options.bymonthday.toString() : '*';
        var month = (options.bymonth) ? options.bymonth.toString() : '*';
        var dayOfWeek = (options.byweekday.length) ? options.byweekday.toString() : '*';
        
        //var cronStr = second +' '+ minute +' '+ hour +' '+ dayOfMonth +' '+ month +' '+ dayOfWeek;
        var sec = (parseInt(dayOfWeek,10)+1) * 5 ; 
        var cronStr = {};
        cronStr['cronDate'] = '*/'+sec + ' * * * * *';
        //var startDate = new Date(Date.now() + 5000);
        var startDate = options.dtstart;
        startDate = new Date(startDate);
        startDate = startDate.getTime() - 21600000;
        startDate = new Date(startDate);
        
        var endDate = event.end.toString();
        endDate = new Date(endDate);       
        endDate = endDate.getTime() - 21600000;
        endDate = new Date(endDate);

        var now = new Date(Date.now());
        if(startDate.getTime()<now.getTime()){
            startDate = now.getTime()+10000;
            startDate = new Date(startDate);
        }
        if(endDate.getTime()<startDate.getTime()){
            endDate =  startDate.getTime() + 60000;
            endDate = new Date(endDate);
        }

        cronStr['startDate'] = startDate;
        cronStr['endDate'] = endDate;
        console.log(cronStr);
        return cronStr;
      }
    }
}



function scheduleIt(event_id, time, name){    
    var job = schedule.scheduleJob(event_id,time, function () {
        console.log(name);
    });

    //console.log(schedule.scheduledJobs);
    
    return job;    
}