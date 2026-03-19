<template>
  <div class="welcome">
    <div class="welcome-content">
      <h1>欢迎来到客户健康中心</h1>
      <p>监控客户使用数据，及时预警，提升客户满意度</p>
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">{{ stats.newCustomers }}</div>
          <div class="stat-label">新增客户</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">{{ stats.warningCustomers }}</div>
          <div class="stat-label">预警客户</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-number">{{ stats.lostCustomers }}</div>
          <div class="stat-label">流失客户</div>
        </div>
      </div>
      <el-button type="primary" @click="goToCustomerHealth" size="large">
        进入客户健康中心
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const customers = ref([])

const stats = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let newCount = 0
  let warningCount = 0
  let lostCount = 0
  
  customers.value.forEach(customer => {
    const createTime = customer.create_time ? new Date(customer.create_time) : null
    if (customer.health_status === '正常') {
      if (createTime && createTime >= today) {
        newCount++
      }
    } else if (customer.health_status === '预警') {
      warningCount++
    } else if (customer.health_status === '流失') {
      lostCount++
    }
  })
  
  return {
    newCustomers: newCount,
    warningCustomers: warningCount,
    lostCustomers: lostCount
  }
})

const fetchCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
    
    if (error) throw error
    customers.value = data || []
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

onMounted(() => {
  fetchCustomers()
})

const goToCustomerHealth = () => {
  router.push('/customer')
}
</script>

<style scoped>
.welcome {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.welcome-content {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.welcome-content h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-content p {
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  min-width: 120px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
}

.stat-card.danger {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}
</style>