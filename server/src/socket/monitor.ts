// monitor.ts
import os from 'os'

let messageCount = 0

// 提供方法用于外部增加计数
export const countMessage = () => {
  messageCount++
}

export const startMonitoring = () => {
  setInterval(() => {
    const freeMem = os.freemem() / 1024 / 1024
    const totalMem = os.totalmem() / 1024 / 1024
    const usedMem = totalMem - freeMem
    const cpuLoad = os.loadavg()[0] // 1 分钟平均 CPU 负载（Linux/Unix）

    console.log(`
[📊 性能监控]
🧠 WebSocket 每秒消息数: ${messageCount}
🧮 内存使用: ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} MB
⚙️  CPU 平均负载 (1min): ${cpuLoad.toFixed(2)}
-------------------------------`)

    messageCount = 0
  }, 5000) // 每1（1000）秒输出一次，我改成了100000，就相当于100秒
}
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHhmMzlGZDZlNTFhYWQ4OEY2RjRjZTZhQjg4MjcyNzljZmZGYjkyMjY2IiwiaWF0IjoxNzQzOTE5NTczLCJleHAiOjE3NDM5MjMxNzN9.51S-TUw2BHOqeYF9dbdyGccayheLPJWQFNjEl_i-O6c