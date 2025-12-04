module.exports = {
  apps: [{
    name: 'orangecandle',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
}
