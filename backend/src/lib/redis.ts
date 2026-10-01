import Redis from "ioredis"

let _client: Redis | null = null

export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6380", {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
    _client.on("error", (err) => {
      console.error("[redis] connection error:", err.message)
    })
  }
  return _client
}
