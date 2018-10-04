const app = getApp();
const http = require('../../utils/http.js');
const cookie = require('../../utils/cookie.js');
import drawQrcode from '../../utils/weapp.qrcode.min.js'

Page({
  data: {
    CookieList: [],//饼干列表
    vCodeLoading: false,//验证码是否在载入
    vCodeShow: false,//验证码是否已显示
    verifyCodeURL: "",//验证码链接
    needDeleteID: "",//需要删除的饼干index
    FormID: "",//表单提交ID
    EnterButLoading: false,//确认按钮loading
    CookieNum: '[0/0]',
    CookieWarning: null,
    pullDownRefing: false,
    statusBarHeight: app.globalData.SystemInfo.Windows.statusBarHeight,
    popupMenuOpenData: {
      show: false,
      statusBarHeight: app.globalData.SystemInfo.Windows.statusBarHeight,
      selectedIndex: 0,
      picURL: '',
      userName: '匿名肥宅',
      appList: app.globalData.AppList,
      menuList: [
        {
          name: '饼干管理',
          icon: 'cookie'
        },
        {
          name: '实名认证',
          icon: 'certified'
        },
        {
          name: '密码修改',
          icon: 'passwd'
        },
        {
          name: '肥宅排行',
          icon: 'sport'
        },
        {
          name: '关于',
          icon: 'about'
        },
      ]
    },
  },
  onReady: function () {
    app.checkVersion();
    wx.startPullDownRefresh({});
    this.data.popupMenuOpenData.userName = wx.getStorageSync('UserName');
    if (this.data.popupMenuOpenData.userName == undefined || this.data.popupMenuOpenData.userName == '') {
      this.data.popupMenuOpenData.userName = '匿名肥宅';
    }
    this.setData({ popupMenuOpenData: this.data.popupMenuOpenData });

    app.getImage(function (url) {
      this.data.popupMenuOpenData.picURL = url;
      this.setData({ popupMenuOpenData: this.data.popupMenuOpenData });
      console.log(this.data.popupMenuOpenData);
    }.bind(this));
  },
  //下拉刷新
  onPullDownRefresh: function () {
    this.setData({ pullDownRefing: true });
    this.getCookies();
    this.setData({ vCodeShow: false });
  },
  //删除饼干(弹出验证码)
  onDeleteCookie: function (e) {
    this.getNewVcode();
    this.setData({ vCodeShow: true, needDeleteID: e.target.id, FormID: "delete" });
  },
  //获取饼干QR码
  onGetCookie: function (event) {
    let selId = event.target.id;
    wx.showActionSheet({
      itemList: ['获取二维码', '复制内容'],
      itemColor: '#334054',
      success: function (e) {
        if (e.cancel != true) {
          if (e.tapIndex == 0) {
            this.getCookieQR(selId);
          }
          else {
            this.getCookieToClipboard(selId);
          }
        }
      }.bind(this)
    })
  },
  //关闭验证码输入窗口
  onUClose: function (e) {
    this.setData({ vCodeShow: false });
  },
  /**
   * 确认执行操作，需要验证码请求的操作通过这里执行
   */
  onEnter: function (e) {
    var u_vcode = e.detail.value.verifycode;
    var u_index = e.detail.value.needDeleteID;
    if (u_vcode.length != 5) {
      app.showError('验证码错误');
      return;
    }
    if (this.data.EnterButLoading == true) return;
    this.setData({ EnterButLoading: true });
    if (e.target.id == 'delete')//删除Cookie
    {
      if (this.data.CookieList[u_index] == true) return;

      var temp_data = this.data.CookieList;
      temp_data[u_index].delLoading = true;
      this.setData({ CookieList: temp_data });//对应的删除按钮显示loading
      temp_data[u_index].delLoading = false;

      http.api_request(
        app.globalData.ApiUrls.CookieDeleteURL + temp_data[u_index].id + ".html",
        {
          verify: u_vcode
        },
        function (res) {
          if (res.status == 1) {
            wx.startPullDownRefresh({});//删除请求成功，刷新页面
            this.setData({ vCodeShow: false });
            app.showSuccess('删除完成');
            app.log('cookie delete success');
          }
          else {
            app.log('cookie delete error:' + res.info);
            this.getNewVcode();
            app.showError(res.info);
          }
          this.setData({ CookieList: temp_data, EnterButLoading: false });
        }.bind(this),
        function () {
          app.showError('发生了错误');
          this.setData({ CookieList: temp_data, EnterButLoading: false });
        }.bind(this));
    }
    else if (e.target.id == 'new')//获取新Cookie
    {
      http.api_request(
        app.globalData.ApiUrls.CookieGetNewURL,
        {
          verify: u_vcode
        },
        function (res) {
          //app.log(res);
          if (res.status == 1) {
            this.setData({ vCodeShow: false });
            this.setData({ EnterButLoading: false });
            wx.startPullDownRefresh({});//获取新Cookie成功，刷新页面
            app.showSuccess('大成功');
            app.log('get new cookie success');
            wx.startPullDownRefresh({});
          }
          else {
            app.log('get new cookie error:' + res.info);
            app.showError(res.info);
          }
          this.setData({ vCodeShow: false });
          this.setData({ EnterButLoading: false });
        }.bind(this),
        function () {
          app.showError('发生了错误');
          this.setData({ EnterButLoading: false });
        }.bind(this));
    }
  },
  //获取新Cookie
  onGetNewCookie: function () {
    this.setData({ vCodeShow: true, FormID: "new" });
    this.getNewVcode();
  },
  //刷新验证码
  onTapVerifyCode: function (e) {
    this.getNewVcode();
  },
  onTapMenuButton: function (e) {
    this.data.popupMenuOpenData.show = true;
    this.setData({ popupMenuOpenData: this.data.popupMenuOpenData });
  },
  onTapOverlay: function() {
    this.data.popupMenuOpenData.show = false;
    this.setData({ popupMenuOpenData: this.data.popupMenuOpenData });
  },
  onPopupMenuCatchScroll: function() {

  },
  onEat: function (e) {
    app.playEat();
  },
  /**
   * 获取新验证码
   */
  getNewVcode: function () {
    this.setData({ vCodeLoading: true, verifyCodeURL: "" });
    http.get_verifycode(function (sta, img, msg) {
      if (sta == false) {
        app.showError(msg);
      }
      this.setData({ vCodeLoading: false, verifyCodeURL: img });
    }.bind(this));
  },
  /**
   * 获取Cookie列表
   */
  getCookies: function () {
    cookie.getCookies(function (status, msg, info) {
      if (info != null) {
        this.setData({ CookieNum: info.capacity, CookieWarning: info.warning });
      }

      if (status == false) {
        app.showError(msg);
        if (msg == "本页面需要实名后才可访问_(:з」∠)_" && wx.showTabBarRedDot) {
          wx.showTabBarRedDot({
            index: 1
          });
        }
        else {
          wx.hideTabBarRedDot({
            index: 1
          });
        }
        wx.stopPullDownRefresh();
        this.setData({ pullDownRefing: false });
        return;
      }

      this.setData({ CookieList: msg });
      wx.stopPullDownRefresh();
      this.setData({ pullDownRefing: false });
    }.bind(this));
  },
  /**
   * 创建并显示二维码
   */
  createQRCode: function (content, callback) {
    //在画布上创建二维码
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      text: content,
      _this: this,
      callback: function () {
        setTimeout(function () {
          //将二维码部分复制出来
          wx.canvasGetImageData({
            canvasId: 'myQrcode',
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            success: function (res) {
              //填充整个画布
              const ctx = wx.createCanvasContext('myQrcode', this);
              ctx.setFillStyle('white');
              ctx.fillRect(0, 0, 220, 220);
              ctx.draw();
              //将刚刚复制出来的二维码写到中心
              wx.canvasPutImageData({
                canvasId: 'myQrcode',
                data: res.data,
                x: 10,
                y: 10,
                width: 200,
                success: function () {
                  //画布内容创建临时文件
                  wx.canvasToTempFilePath({
                    canvasId: 'myQrcode',
                    success: function (res) {
                      console.log(res);
                      //预览
                      wx.previewImage({
                        urls: [res.tempFilePath],
                      });
                    },
                    fail: function () {
                      console.log('error');
                      app.showError("缓存二维码失败");
                    }
                  }, this);
                },
                fail: function () {
                  app.showError('生成QR码错误2');
                }
              }, this);
            }.bind(this),
            fail: function () {
              app.showError('生成QR码错误');
            }
          }, this);
          callback();
        }.bind(this), 300);
      }
    });
  },
  /**
   * 获取Cookie详细并显示二维码
   */
  getCookieQR: function (index) {
    var temp_data = this.data.CookieList;
    if (temp_data[index].getLoading == true) return;
    temp_data[index].getLoading = true;
    this.setData({ CookieList: temp_data });
    temp_data[index].getLoading = false;

    cookie.getCookieDetail(temp_data[index].id, function (sta, detail) {
      if (sta == true) {
        this.createQRCode(JSON.stringify({ cookie: detail }), function () {
          this.setData({ CookieList: temp_data });
          return;
        }.bind(this));
      }
      else {
        app.showError(detail);
        this.setData({ CookieList: temp_data });
      }
    }.bind(this));
  },
  /**
    * 获取Cookie详细并复制到剪切板
    */
  getCookieToClipboard: function (index) {
    var temp_data = this.data.CookieList;
    if (temp_data[index].getLoading == true) return;
    temp_data[index].getLoading = true;
    this.setData({ CookieList: temp_data });
    temp_data[index].getLoading = false;

    cookie.getCookieDetail(temp_data[index].id, function (sta, detail) {
      if (sta == true) {
        wx.setClipboardData({
          data: detail,
          success: function () {
            app.showSuccess('饼干已复制');
          },
          fail: function () {
            app.showError('复制失败');
          }
        });
      }
      else {
        app.showError(detail);
      }
      this.setData({ CookieList: temp_data });
    }.bind(this));
  }
})