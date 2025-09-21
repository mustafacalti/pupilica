module.exports = {
  apps: [
    {
      name: 'peakfocus-backend',
      script: 'npm',
      args: 'start',
      cwd: '/home/azureuser/pupilica/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/peakfocus-backend-error.log',
      out_file: '/var/log/peakfocus-backend-out.log'
    },
    {
      name: 'peakfocus-frontend',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 5173',
      cwd: '/home/azureuser/pupilica',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/peakfocus-frontend-error.log',
      out_file: '/var/log/peakfocus-frontend-out.log'
    }
  ]
};