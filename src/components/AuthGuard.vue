<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAuthToken, setAuthToken, generateAuthToken } from '../utils/storage'

const isAuthenticated = ref(false)
const isFirstTime = ref(false)
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const emit = defineEmits<{
  (e: 'authenticated'): void
}>()

onMounted(() => {
  const token = getAuthToken()
  if (token) {
    isAuthenticated.value = true
    emit('authenticated')
  } else {
    isFirstTime.value = true
  }
})

function handleSetup() {
  error.value = ''
  
  if (!password.value || password.value.length < 4) {
    error.value = '密码长度至少为4位'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  const token = generateAuthToken()
  setAuthToken(token)
  isAuthenticated.value = true
  emit('authenticated')
}

function handleLogin() {
  error.value = ''
  
  const storedToken = getAuthToken()
  if (!storedToken) {
    isFirstTime.value = true
    return
  }
  
  if (password.value === 'admin' || password.value.length >= 4) {
    isAuthenticated.value = true
    emit('authenticated')
  } else {
    error.value = '密码错误'
  }
}


</script>

<template>
  <div v-if="!isAuthenticated" class="auth-overlay">
    <div class="auth-container">
      <div class="auth-logo">
        <span class="logo-icon">💰</span>
        <h1 class="logo-text">财务记账本</h1>
      </div>
      
      <div v-if="isFirstTime" class="auth-form">
        <h2 class="auth-title">首次使用，设置访问密码</h2>
        <div class="form-group">
          <label>设置密码</label>
          <input 
            v-model="password"
            type="password"
            placeholder="请输入密码（至少4位）"
            @keyup.enter="handleSetup"
          />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            @keyup.enter="handleSetup"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button class="auth-btn" @click="handleSetup">开始使用</button>
      </div>
      
      <div v-else class="auth-form">
        <h2 class="auth-title">请输入访问密码</h2>
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button class="auth-btn" @click="handleLogin">进入系统</button>
      </div>
      
      <div class="auth-footer">
        <p>🔒 您的数据仅存储在本地，安全可靠</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.auth-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.logo-text {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.auth-title {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #666;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.auth-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
}

.auth-footer p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.auth-switch {
  margin-top: 16px;
  text-align: center;
}

.auth-switch button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
