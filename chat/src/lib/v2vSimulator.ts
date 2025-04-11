import { getRandomId } from '@/lib/utils/random'
import type { Message } from '@/types/message'
import type { useChatStore } from '@/stores/chat'

// 生成随机车辆状态文本
export function generateVehicleStatus(vehicleId: string): string {
  const speed = (Math.random() * 120).toFixed(1)
  const acceleration = (Math.random() * 4).toFixed(2)
  const braking = Math.random() > 0.85 ? '正在刹车' : '正常行驶'
  const direction = ['北', '东', '南', '西'][Math.floor(Math.random() * 4)]
  const laneChangeIntent = Math.random() > 0.7 ? '有变道意图' : '无变道意图'
  const position = {
    lat: (30 + Math.random()).toFixed(6),
    lng: (120 + Math.random()).toFixed(6)
  }

  return `🚗 [${vehicleId}] 状态报告：
• 速度: ${speed} km/h
• 加速度: ${acceleration} m/s²
• 状态: ${braking}
• 方向: ${direction}
• 变道意图: ${laneChangeIntent}
• 位置: (${position.lat}, ${position.lng})`
}

// 启动 V2V 模拟通信（每2秒发送一次状态）
export function startV2VSimulation(
  chatStore: ReturnType<typeof useChatStore>,
  targetId: string,
  vehicleId: string,
  intervalMs: number = 2000
): () => void {
  const timer = setInterval(() => {
    const message: Message = {
      id: getRandomId(),
      content: generateVehicleStatus(vehicleId),
      senderId: vehicleId,
      senderName: vehicleId,
      timestamp: new Date().toISOString(),
      type: 'text'
    }
    console.log('发送模拟消息到', targetId, message)

    // 添加到聊天并通过WebRTC发送
    chatStore.sendMessage(targetId, JSON.stringify(message))
  }, intervalMs)

  // 返回一个停止模拟的方法
  return () => clearInterval(timer)
}
