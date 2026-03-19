<template>
  <div v-if="!isAuthenticated" class="login-container">
    <div class="login-box">
      <h2>客户健康中心</h2>
      <el-input
        v-model="accessCode"
        type="password"
        placeholder="请输入访问码"
        @keyup.enter="verifyCode"
      />
      <el-button type="primary" @click="verifyCode" style="margin-top: 20px; width: 100%;">
        确认
      </el-button>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
  <div v-else class="app">
    <el-container class="container">
      <el-header class="header">
        <div class="logo-container">
          <img :src="LogoSvg" alt="Logo" class="logo-img" />
          <span class="logo-text">客户健康中心</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="nav-menu"
          mode="horizontal"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">欢迎页</el-menu-item>
          <el-menu-item index="/customer">客户健康中心</el-menu-item>
        </el-menu>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoSvg from './assets/logo.svg'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)

const handleMenuSelect = (key) => {
  router.push(key)
}

const ACCESS_CODE = 'YG66'
const isAuthenticated = ref(localStorage.getItem('accessCode') === ACCESS_CODE)
const accessCode = ref('')
const errorMsg = ref('')

const verifyCode = () => {
  if (accessCode.value === ACCESS_CODE) {
    localStorage.setItem('accessCode', ACCESS_CODE)
    isAuthenticated.value = true
    errorMsg.value = ''
  } else {
    errorMsg.value = '访问码错误，请重试'
    accessCode.value = ''
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 320px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.error-msg {
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.app {
  height: 100vh;
  overflow: hidden;
}

.container {
  height: 100%;
}

.header {
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  height: 36px;
  width: auto;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.nav-menu {
  background: transparent;
  border: none;
}

.nav-menu .el-menu-item {
  color: white;
}

.nav-menu .el-menu-item.is-active {
  color: #ffd700;
  font-weight: bold;
}

.main {
  padding: 20px;
  overflow-y: auto;
}
</style>
