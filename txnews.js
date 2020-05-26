/*
腾讯新闻签到修改版，可以自动阅读文章获取红包

此脚本只开启红包通知和错误通知，其他通知一律关闭，如需开启请删除181行或者186行的"//"即可

获取Cookie方法:
 1. 把以下地址复制到响应配置下，非Quantumult X 1.0.8+ tf版，请删除tag标签
 [task_local]
0 9 * * * txnews.js, tag=腾讯新闻
 [rewrite_local]
https:\/\/api\.inews\.qq\.com\/event\/v1\/user\/event\/report\? url script-request-header txnews.js

 [MITM]
hostname = api.inews.qq.com

3.打开腾讯新闻app，阅读一篇文章，倒计时结束后即可获取Cookie

4.现阶段每日共9个阶梯红包，具体阅读篇数视腾讯情况而变动

5.脚本运行一次阅读一篇文章，请不要连续运行，防止封号，可设置每几分钟运行一次

6.可能腾讯有某些限制，有些号码无法领取红包，手动阅读几篇，能领取红包，一般情况下都是正常的

7.4月27日修复该账户为非活动用户

~~~~~~~~~~~~~~~~
Cookie获取后，请注释掉Cookie地址。

#腾讯新闻app签到，根据红鲤鱼与绿鲤鱼与驴修改

*/
const cookieName = '腾讯新闻'
const signurlKey = 'sy_signurl_txnews2'
const cookieKey = 'sy_cookie_txnews2'
const sy = init()
const signurlVal = sy.getdata(signurlKey)
const cookieVal = sy.getdata(cookieKey)

let isGetCookie = typeof $request !== 'undefined'
if (isGetCookie) {
   GetCookie()
} else {
   getsign()
}

function GetCookie() {
if ($request && $request.method != 'OPTIONS') {
  const signurlVal =  $request.url
  const cookieVal = $request.headers['Cookie'];
  sy.log(`signurlVal:${signurlVal}`)
  sy.log(`cookieVal:${cookieVal}`)
  if (signurlVal) sy.setdata(signurlVal, signurlKey)
  if (cookieVal) sy.setdata(cookieVal, cookieKey)
  sy.msg(cookieName, `获取Cookie: 成功🎉`, ``)
  }
 }

//签到
function getsign() {
return new Promise((resolve, reject) => {
  const llUrl = {
    url: `https://api.inews.qq.com/task/v1/user/signin/add?`,headers:{Cookie: cookieVal}
  };
   sy.post(llUrl, (error, response, data) => {   
     sy.log(`${cookieName}签到 - data: ${data}`)
      const obj = JSON.parse(data)
      if (obj.info=="success"){
       console.log('腾讯新闻 签到成功，已连续签到' + obj.data.signin_days+"天"+"\n")
       next = obj.data.next_points
       tip =  obj.data.tip_soup
       Dictum = tip.replace(/[\<|\.|\>|br]/g,"")+obj.data.author
       str =  '签到成功，已连续签到' + obj.data.signin_days+'天  '+'明天将获得'+ next +'个金币'
       toRead()} 
      else {
        sy.msg('签到失败，🉐登录腾讯新闻app获取cookie', "", "")
        console.log('签到失败，🉐登录腾讯新闻app获取cookie'+data)
       }
    resolve()
    })
  })
}

//阅读阶梯
function toRead() {
  const toreadUrl = {
    url: signurlVal,
    headers: {Cookie:cookieVal},
    body: 'event=article_read&extend={"article_id":"20200424A08KNH00","channel_id":"17240460"}'
  };
   sy.post(toreadUrl,(error, response, data) =>{
      if (error){
      sy.msg(cookieName, '阅读:'+ error)
        }else{
       sy.log(`${cookieName}阅读文章 - data: ${data}`)
      }
    Activity_id()
    })
  }

function Activity_id() {
  const ID =  signurlVal.match(/devid=[a-zA-Z0-9_-]+/g)
  const activityUrl = {
    url: `https://api.inews.qq.com/activity/v1/user/activity/get?isJailbreak=0&appver=13.4.1_qqnews_6.1.01&${ID}`,
    headers: {Cookie:cookieVal},
  };

   sy.get(activityUrl, (error, response, data) =>{
    if (error){
      sy.msg(cookieName, '获取阅读红包ID失败:'+ error)
     }else{
     sy.log(`${cookieName}阅读红包id - data: ${data}`)
       reddata = JSON.parse(data)
        if (reddata.data.activity != null){
        redpackid = reddata.data.activity.id
        //StepsTotal()
       }
        else {
      sy.msg(cookieName, '获取阅读红包ID失败❌',`请检查该账号是否有阅读红包，或者该设备有其他账号已领取红包`)}
      StepsTotal() 
       }
     })
  }
//阅读文章统计
function StepsTotal() {
   const ID =  signurlVal.match(/devid=[a-zA-Z0-9_-]+/g)
  const StepsUrl = {
    url: `https://api.inews.qq.com/activity/v1/activity/info/get?activity_id=${redpackid}&${ID}`,
   headers: {Cookie: cookieVal},
  };
    sy.get(StepsUrl, (error, response, data) => {
      try {
        sy.log(`${cookieName}阅读统计 - data: ${data}`)
        article = JSON.parse(data)
        if (article.ret == 0){
        redpacktotal =  article.data.extends.redpack_total
         redpackgot = article.data.extends.redpack_got
           haveread = article.data.extends.article.have_read_num
         getreadpack = article.data.extends.article.redpack_read_num
        if (redpackgot < redpacktotal-1){
         articletotal = '\n今日共'+redpacktotal+'个阶梯红包，' +'已领取'+redpackgot+'个，'+`已阅读`+ haveread+`篇文章，`+ `阅读至`+getreadpack+'篇，可继续领取红包' }
      if (redpackgot == redpacktotal-1){
         articletotal = '\n今日共'+redpacktotal+'个阶梯红包，' +'已领取'+redpackgot+'个，'+`已阅读`+ haveread+`篇文章，`+ `阅读至`+getreadpack+'篇，可领取今日最后一次红包' }
      if (redpackgot == redpacktotal){
       articletotal = `\n今日已阅读` + getreadpack+ `篇，`+ `共领取`+  redpackgot +`个阶梯红包`
     }
        str += articletotal + `\n`+ Dictum
        }
        else if (article.ret == 2011){
         str += `\n`+ Dictum
        }
        else {
     sy.log(cookieName + ` 返回值: ${article.ret}, 返回信息: ${article.info}`) 
        }
       getTotal()
       }
      catch (e) {
      sy.msg(cookieName, "",'阅读统计:失败'+ e)
     }
  })
}
//阶梯红包到账
function Redpack() {
  const ID =  signurlVal.match(/devid=[a-zA-Z0-9_-]+/g)
  const cashUrl = {
    url: `https://api.inews.qq.com/activity/v1/activity/redpack/get?isJailbreak=0&${ID}`,
      headers: {Cookie: cookieVal},
      body: `activity_id=${redpackid}`
  };
    sy.post(cashUrl, (error, response, data) => {
      try {
        sy.log(`${cookieName}阶梯红包提取 - data: ${data}`)
        rcash = JSON.parse(data)
        if (rcash.ret == 0){
            notb += `  阶梯红包到账: `+ rcash.data.redpack.amount/100 +`元 🌷`
           sy.msg(cookieName, notb, str)
           sy.log(cookieName+` `+notb+`\n`+ str)
            }
        else if (rcash.ret == 2013){
            if (article.data.extends.redpack_got<article.data.extends.redpack_total){
           notb += " 继续阅读领取红包"
           sy.msg(cookieName, notb, str)
           //sy.log(cookieName+` `+notb+`\n`+ str)
               }
          else { 
            notb += " 今日阶梯红包已领完 💤"
          //sy.msg(cookieName, notb, str)
          //sy.log(cookieName+` `+notb+`\n`+ str)
               }
             }
        else {
            notb +=  " "+rcash.info+"❌"
            sy.msg(cookieName, notb, str)
             }
       }
      catch (e) {
      sy.log(`❌ ${cookieName} read - 阅读奖励: ${e}`)
     }
  })
}

//收益总计
function getTotal() {
 return new Promise((resolve, reject) => {
  const totalUrl = {
    url: `https://api.inews.qq.com/activity/v1/usercenter/activity/list?isJailbreak`,
    headers: {Cookie: cookieVal}};
    sy.post(totalUrl, function(error,response, data) {
    if (error) {
        sy.msg("获取收益信息失败‼️", "", error);
     if (log) console.log("获取收益信息" + data)
    } else {
         const obj = JSON.parse(data)
           notb = '总计:'+obj.data.wealth[0].title +'金币  '+"红包" + obj.data.wealth[1].title+'元'
          Redpack()
          sy.log(cookieName+","+notb+ "\n" )
        }
      resolve()
      })
   })
 }

function init() {
    isSurge = () => {
      return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
      return undefined === this.$task ? false : true
    }
    getdata = (key) => {
      if (isSurge()) return $persistentStore.read(key)
      if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
      if (isSurge()) return $persistentStore.write(key, val)
      if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subtitle, body) => {
      if (isSurge()) $notification.post(title, subtitle, body)
      if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
      if (isSurge()) {
        $httpClient.get(url, cb)
      }
      if (isQuanX()) {
        url.method = 'GET'
        $task.fetch(url).then((resp) => cb(null, {}, resp.body))
      }
    }
    post = (url, cb) => {
      if (isSurge()) {
        $httpClient.post(url, cb)
      }
      if (isQuanX()) {
        url.method = 'POST'
        $task.fetch(url).then((resp) => cb(null, {}, resp.body))
      }
    }
    done = (value = {}) => {
      $done(value)
    }
    return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
  }

