import 'dotenv/config'

const config  = {
    token: process.env.DISCORD_TOKEN!,
    redis: process.env.REDIS_URI!
}

export default config