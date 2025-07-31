import json
import asyncio
from redis import asyncio as aioredis  

redis = None
pub = None
sub = None

async def init_redis():
    global redis, pub, sub
    redis = aioredis.Redis(host="redis", port=6379, decode_responses=True)
    pub = redis
    sub = redis.pubsub()
    await sub.psubscribe("game:*")
    return redis

async def publish(channel, msg):
    await pub.publish(channel, json.dumps(msg))

async def subscribe():
    while True:
        msg = await sub.get_message(ignore_subscribe_messages=True, timeout=1.0)
        if msg and 'data' in msg:
            yield json.loads(msg["data"])
        await asyncio.sleep(0.01)
