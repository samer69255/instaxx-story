var Instagram = require('instagram-web-api');

Instagram.prototype.getNewStories = async function () {
  var errorCode = {code:false};

  //Get all Stories
  var data = await this.getStoryReelFeed({onlyStories:true})
  .catch (err => {errorCode = {code:1, msg:err}});

  if (errorCode.code) return {error: errorCode}

  // remove stories seen from list
  var result = data.filter(key => {
    return ( key.seen === null || key.seen < key.latest_reel_media );
  })
  //return only user id
  .map(ob => ob.user.id);

  if (result.length < 1) return result;
  if (result.length >= 50)
  result = result.slice(0,50);
  console.log(result.length)

  var allStories = await this.getStoryReels({reelIds :result})
  .catch(err => {errorCode = {code:2, msg:err};});

  if (errorCode.code) return {error: errorCode}

  var list = [];

  for (var i=0; i<allStories.length; i++) {
    var items = allStories[i].items;
    var userid = allStories[i].user.id;
    for (var o in items) {
      list.push({userid: userid, storyid: (items[o].id)});
    }
  }
  
  return list;
}

Instagram.prototype.SeeStory = async function (ob) {
  var uri = "/stories/reel/seen";
  var error = false;
  var time = Math.floor(Date.now() / 1000); // Get current global UTC timestamp.
  var seenAt = time - 1; // Start seenAt in the past.
  var data = {
    reelMediaId: ob.storyid,
    reelMediaOwnerId: ob.userid,
    reelId: ob.userid,
    reelMediaTakenAt: time,
    viewSeenAt: time,
  }
  var result = await this.request.post({
    uri,
    form:data,
  })
  .catch(err => {
    error = 3;
    //console.log(err);
  });
  if (error) return {error}
  return result;
}

Instagram.prototype.isLogin = function () {
  if (!this._sharedData) return false;
  return (this._sharedData.config.viewerId !== null);
}

module.exports = Instagram;