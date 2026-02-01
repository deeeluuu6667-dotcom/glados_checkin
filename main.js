const glados = async () => {
  const notice = [];
  if (!process.env.GLADOS) {
    notice.push("❌ 未检测到 GLADOS Cookie 配置");
    return notice;
  }

  // 分割Cookie（兼容&和换行分隔，和仓库1保持一致）
  const cookies = String(process.env.GLADOS)
    .split(/&|\n/)
    .filter((c) => c.trim());

  if (cookies.length === 0) {
    notice.push("❌ 未检测到有效 GLADOS Cookie");
    return notice;
  }

  let ok = 0, fail = 0, repeat = 0;
  const detailLines = [];

  for (const [idx, cookie] of cookies.entries()) {
    const cookieTrim = cookie.trim();
    if (!cookieTrim) continue;

    let email = "unknown";
    let points = "-";
    let days = "-";
    let status = "";
    let msg = "";

    try {
      const commonHeaders = {
        "cookie": cookieTrim,
        "referer": "https://glados.cloud/console/checkin",
        // 替换为仓库1的现代UA，避免被拦截
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "content-type": "application/json;charset=UTF-8",
        "origin": "https://glados.cloud" // 补充仓库1的origin头
      };

      // 1. 签到请求（修复token值为glados.cloud）
      const checkinRes = await fetch("https://glados.cloud/api/user/checkin", {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ token: "glados.cloud" }), // 核心修复：glados.one → glados.cloud
        timeout: 10000 // 增加超时
      });
      const checkinData = await checkinRes.json().catch(() => ({}));
      msg = checkinData.message || "未知响应";

      // 2. 兼容仓库1的响应判断逻辑
      if (msg.toLowerCase().includes("got")) {
        ok += 1;
        status = "✅ 成功";
        points = checkinData.points || "-";
      } else if (msg.toLowerCase().includes("repeat") || msg.toLowerCase().includes("already")) {
        repeat += 1;
        status = "🔁 已签到";
      } else {
        fail += 1;
        status = "❌ 失败";
      }

      // 3. 查询状态（允许失败，不影响签到结果）
      try {
        const statusRes = await fetch("https://glados.cloud/api/user/status", {
          method: "GET",
          headers: commonHeaders,
          timeout: 10000
        });
        const statusData = await statusRes.json().catch(() => ({}));
        const statusDataInfo = statusData.data || {};
        email = statusDataInfo.email || email;
        if (statusDataInfo.leftDays !== undefined) {
          days = `${Math.floor(Number(statusDataInfo.leftDays))} 天`;
        }
      } catch (e) {
        // 状态查询失败不影响签到结果
      }

      // 记录单账号结果
      detailLines.push(`${idx + 1}. ${email} | ${status} | 积分:${points} | 剩余:${days}`);
      // 随机延迟，和仓库1保持一致
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));

    } catch (error) {
      fail += 1;
      status = "❌ 异常";
      detailLines.push(`${idx + 1}. ${email} | ${status} | 原因:${error.message || "网络错误"}`);
    }
  }

  // 组装最终通知内容
  notice.push(`GLaDOS 签到完成 ✅${ok} ❌${fail} 🔁${repeat}`);
  notice.push(...detailLines);
  return notice;
};

// 保留仓库2原有的PushPlus推送逻辑（无需修改）
const notify = async (notice) => {
  if (!process.env.NOTIFY || !notice || notice.length === 0) return;
  for (const option of String(process.env.NOTIFY).split('\n')) {
    if (!option) continue;
    try {
      if (option.startsWith('console:')) {
        for (const line of notice) {
          console.log(line);
        }
      } else if (option.startsWith('wxpusher:')) {
        await fetch(`https://wxpusher.zjiecode.com/api/send/message`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            appToken: option.split(':')[1],
            summary: notice[0],
            content: notice.join('<br>'),
            contentType: 3,
            uids: option.split(':').slice(2),
          }),
        });
      } else if (option.startsWith('pushplus:')) {
        await fetch(`https://www.pushplus.plus/send`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            token: option.split(':')[1],
            title: notice[0],
            content: notice.join('<br>'),
            template: 'markdown',
          }),
        });
      } else if (option.startsWith('qyweixin:')) {
        const qyweixinToken = option.split(':')[1];
        const qyweixinNotifyRebotUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=' + qyweixinToken;
        await fetch(qyweixinNotifyRebotUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            msgtype: 'markdown',
            markdown: {
                content: notice.join('<br>')
            }
          }),
        });
      } else {
        // fallback to pushplus
        await fetch(`https://www.pushplus.plus/send`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            token: option,
            title: notice[0],
            content: notice.join('<br>'),
            template: 'markdown',
          }),
        });
      }
    } catch (error) {
      console.error('推送失败:', error);
      // 推送失败不终止脚本
    }
  }
};

const main = async () => {
  await notify(await glados());
};

main();
