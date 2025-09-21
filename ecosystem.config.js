module.exports = {
  apps: [
    {
      name: 'peakfocus-backend',
      script: 'server.js',
      cwd: '/home/erenazure/pupilica/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    },
    {
      name: 'peakfocus-frontend',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5174',
      cwd: '/home/erenazure/pupilica',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};