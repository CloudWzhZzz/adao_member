/**
 * @brief 保存所有Cookie
 * @param data:本次请求的setcookie内容
 * @retval None
 */
function save_cookie(data)
{
  data = data.replace(" ","");
  data = data.split(";");
  var saved_data = wx.getStorageSync('user_cookie');
  saved_data = JSON.parse(saved_data==''?'{}':saved_data);

  var save_array = Array();
  for(let i = 0;i < data.length;i++)
  {
    var temp_data = data[i].split("=");
    saved_data[temp_data[0]] = temp_data[1];
  }
  wx.setStorageSync('user_cookie', JSON.stringify(saved_data))
}
/**
 * @brief 获取所有Cookie
 * @retval cookie内容
 */
function get_cookie()
{
  var cookies = wx.getStorageSync('user_cookie');
  cookies = JSON.parse(cookies == '' ? '{}' : cookies);
  console.log(cookies);
  var out_str = '';
  for(let o in cookies)
  {
    out_str += o;
    out_str += '=';
    out_str += cookies[o];
    out_str += ';';
  }
  console.log(out_str);
  return out_str;
}
/**
 * @brief 获取指定key的Cookie内容
 * @param key:指定key
 * @retval 指定Key的内容
 */
function get_cookie_key(key)
{
  var cookies = wx.getStorageSync('user_cookie');
  cookies = JSON.parse(cookies == '' ? '{}' : cookies);
  return cookies[key];
}
/**
 * @brief 带Cookie请求一个地址，并更新Cookie
 * @param url:要请求的地址
 * @param pdata:POST数据
 * @param success:请求成功回调
 * @param fail:请求失败回调
 * @retval None
 */
function api_request(url, pdata, success, fail)
{
  console.log(pdata);
  wx.request({
    url: url,
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'User-Agent': 'HavfunClient-WeChatAPP',
      'X-Requested-With': 'XMLHttpRequest',
      'cookie': get_cookie()
    },
    data: pdata == null ? {} : pdata,
    method: 'POST',
    success: function(res){
      if (res.header['Set-Cookie'])
        save_cookie(res.header['Set-Cookie']);
      if(success != null)
        success(res.data);
    },
    fail: function(){
      if(fail != null)
        fail();
    }
  })
}

module.exports = {
  api_request: api_request,
  get_cookie_key: get_cookie_key
}
