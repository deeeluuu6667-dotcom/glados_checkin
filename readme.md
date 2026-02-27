# Glados Checkin Glados自动打卡签到

GitHub Actions 实现 [GLaDOS][glados] 自动签到

## 使用说明
(折腾了两天终于摸索明白了, 23333)
1. Fork 这个仓库
2. 添加 Cookie 到 Secret `GLADOS`,办法如下:
  a. 登录 [GLaDOS][glados] 获取 Cookie(注意从glados.cloud登录
  b.   ->登录后进入打卡签到界面
  c.   ->浏览器按F12调出,找到Application
  d.   ->找到Cookies,点进去找到koa:sess和koa:sess.sig,分别复制下来备用.(示例: AAAAAA和BBBBB)
  e.   ->组合上面找到的值,得到cookies组:koa:sess=AAAAAA; koa:sess.sig=BBBBBB
  f.   特别注意:用英文标点的;且后面有个空格
  g.   把cookies组合复制到使用的地方.(比如我是青龙面板,我就在变量里面创建一个GLAODS,里面的值填写这个koa:sess=AAAAAA; koa:sess.sig=BBBBBB  注意不需要句号,如果有多个值就直接回车换行再添加.

3. 启用 Actions, 每天北京时间 00:10 自动签到(这个时间自己改).

额外说明: 
A.cookies是会变化的,发现打卡失败就去登录一下获取新的cookie组合. 建议一天多次打卡避免漏打.
B.尽量到打卡界面获取cookie,特别是如果账号过期了不点过去是得不到值的.
C.青龙面板里的变量名称是GLADOS,不是其它值,全大写. 另外GLADOS_2啊 _3啊什么的没有用,老老实实多个值就回车换行添加.实测除非cookies过期,还是能全打卡签到的.

以下纯属复制粘贴:
## 高级功能

1. 如有多个帐号, 可以写为多行 Secret `GLADOS`, 每行写一个 Cookie

1. 如需修改时间, 可以修改文件 [run.yml](.github/workflows/run.yml#L7) 中的 `cron` 参数, 格式可参考 [crontab]

1. 如需推送通知, 可配置 Secret `NOTIFY`, 已支持:
    1. [WxPusher][wxpusher]: 格式 `wxpusher:{token}:{uid}`
    1. [PushPlus][pushplus]: 格式 `pushplus:{token}`
    1. Console: 格式 `console:log`, 作为日志输出, 一般用于调试
    1. 如需配置多个, 可以写为多行, 每行写一个

1. 注意: Cookie 以及接口输出数据, 包含帐号敏感信息, 因此不要随意公开

---

[glados]: https://github.com/glados-network/GLaDOS
[crontab]: https://crontab.guru/
[pushplus]: https://www.pushplus.plus/
[wxpusher]: https://wxpusher.zjiecode.com/
