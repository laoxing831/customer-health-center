<template>
  <div class="customer-detail" v-loading="loading">
    <el-button type="primary" @click="goBack">返回列表</el-button>
    <div class="customer-info" v-if="customer">
      <h2>{{ customer.companyName }} - 客户详情</h2>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="主店铺">{{ customer.mainShop }}</el-descriptions-item>
        <el-descriptions-item label="付费情况">{{ customer.paymentStatus }}</el-descriptions-item>
        <el-descriptions-item label="服务顾问">{{ customer.serviceAdvisor }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ customer.createTime }}</el-descriptions-item>
        <el-descriptions-item label="开通时间">{{ customer.openTime }}</el-descriptions-item>
        <el-descriptions-item label="健康度">
          <el-tag
            :type="
              customer.healthStatus === '正常'
                ? 'success'
                : customer.healthStatus === '预警'
                ? 'warning'
                : customer.healthStatus === '流失'
                ? 'danger'
                : 'info'
            "
          >
            {{ customer.healthStatus || '正常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否建单">
          <el-tag :type="customer.hasOrder ? 'success' : 'info'">
            {{ customer.hasOrder ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ customer.remark }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="data-section" v-if="customer">
      <div class="chart-controls">
        <el-select v-model="chartType" placeholder="选择图表类型" style="width: 150px; margin-right: 10px">
          <el-option label="折线图" value="line" />
        </el-select>
        <el-select v-model="timeRange" placeholder="选择时间范围" style="width: 150px; margin-right: 10px">
          <el-option label="近7天" value="7d" />
          <el-option label="近30天" value="30d" />
          <el-option label="近1年" value="1y" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
          @change="updateChart"
        />
        <el-select v-model="dataType" placeholder="选择数据类型" style="width: 150px; margin-left: 10px">
          <el-option label="工单数" value="工单量" />
          <el-option label="退换操作量" value="退换操作量" />
          <el-option label="物流拦截量" value="物流拦截量" />
          <el-option label="打款数" value="打款数" />
          <el-option label="知识创建量" value="知识创建量" />
          <el-option label="知识使用量" value="知识使用量" />
          <el-option label="智动启动量" value="智动启动量" />
        </el-select>
        <el-button type="primary" @click="updateChart">更新图表</el-button>
      </div>

      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>

      <div class="comparison-section">
        <h3>环比分析</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日均环比">{{ comparisonData.daily环比 }}% ({{ comparisonData.daily当前值 }})</el-descriptions-item>
          <el-descriptions-item label="月均环比">{{ comparisonData.monthly环比 }}% ({{ comparisonData.monthly当前值 }})</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="detail-section">
        <h3>明细数据</h3>
        <el-table :data="sortedDailyData" style="width: 100%" border>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="items.工单量" label="工单数" width="100" />
          <el-table-column prop="items.退换操作量" label="退换操作量" width="120" />
          <el-table-column prop="items.物流拦截量" label="物流拦截量" width="120" />
          <el-table-column prop="items.物流异常是否启动" label="物流异常" width="120" />
          <el-table-column prop="items.发货异常是否启动" label="发货异常" width="120" />
          <el-table-column prop="items.打款数" label="打款数" width="100" />
          <el-table-column prop="items.知识创建量" label="知识创建量" width="120" />
          <el-table-column prop="items.知识使用量" label="知识使用量" width="120" />
          <el-table-column prop="items.智动启动量" label="智动启动量" width="120" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="scope">
              <el-button type="danger" size="small" @click="deleteDailyData(scope.$index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { supabase } from '../lib/supabase'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const calculateHealthStatus = (dailyData) => {
  if (!dailyData || dailyData.length === 0) return '正常'
  
  const sortedData = [...dailyData].sort((a, b) => new Date(b.date) - new Date(a.date))
  const recent7Days = sortedData.slice(0, 7)
  
  if (recent7Days.length < 7) return '正常'
  
  const hasAnyNonZero = recent7Days.some(day => {
    const items = day.items || {}
    return Object.values(items).some(v => v > 0)
  })
  
  if (!hasAnyNonZero) return '预警'
  
  const totalValues = recent7Days.reduce((sum, day) => {
    const items = day.items || {}
    return sum + Object.values(items).reduce((s, v) => s + (v || 0), 0)
  }, 0)
  const avgValue = totalValues / 7
  
  const latestDay = recent7Days[0]
  const latestItems = latestDay.items || {}
  const latestTotal = Object.values(latestItems).reduce((s, v) => s + (v || 0), 0)
  
  if (avgValue > 0 && latestTotal < avgValue * 0.1) {
    return '预警'
  }
  
  return '正常'
}

const router = useRouter()
const route = useRoute()
const chartRef = ref(null)
const chart = ref(null)
const loading = ref(false)

const chartType = ref('line')
const timeRange = ref('7d')
const dateRange = ref([])
const dataType = ref('工单量')

const customer = ref(null)

const sortedDailyData = computed(() => {
  if (!customer.value || !customer.value.dailyData) return []
  return [...customer.value.dailyData].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const fetchCustomer = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    customer.value = {
      id: data.id,
      companyName: data.company_name,
      mainShop: data.main_shop,
      paymentStatus: data.payment_status,
      serviceBusiness: data.service_business,
      serviceAdvisor: data.service_advisor,
      createTime: data.create_time,
      openTime: data.open_time,
      remark: data.remark,
      healthStatus: data.health_status || '正常',
      hasOrder: data.has_order,
      dailyData: data.daily_data || []
    }
    
    setTimeout(() => {
      if (chartRef.value && !chart.value) {
        chart.value = echarts.init(chartRef.value)
      }
      updateChart()
    }, 100)
  } catch (error) {
    console.error('获取客户数据失败:', error)
    ElMessage.error('获取客户数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomer()
})

const comparisonData = computed(() => {
  if (!customer.value || !customer.value.dailyData || customer.value.dailyData.length === 0) {
    return {
      daily环比: 0,
      monthly环比: 0,
      daily当前值: 0,
      monthly当前值: 0
    }
  }
  
  const sortedData = [...customer.value.dailyData].sort((a, b) => new Date(a.date) - new Date(b.date))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const twoMonthAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  
  const latestData = sortedData[sortedData.length - 1]
  const previousData = sortedData.length >= 2 ? sortedData[sortedData.length - 2] : null
  
  const latestValue = latestData ? (latestData.items[dataType.value] || 0) : 0
  const previousValue = previousData ? (previousData.items[dataType.value] || 0) : 0
  
  const thisMonthData = sortedData.filter(d => {
    const dDate = new Date(d.date)
    return dDate >= currentMonthStart && dDate <= today
  })
  
  const lastMonthData = sortedData.filter(d => {
    const dDate = new Date(d.date)
    return dDate >= lastMonthStart && dDate <= lastMonthEnd
  })
  
  const getValue = (item) => item.items[dataType.value] || 0
  
  const avgThisMonth = thisMonthData.length > 0
    ? thisMonthData.reduce((sum, d) => sum + getValue(d), 0) / thisMonthData.length
    : 0
  const avgLastMonth = lastMonthData.length > 0
    ? lastMonthData.reduce((sum, d) => sum + getValue(d), 0) / lastMonthData.length
    : 0
  
  const daily环比 = previousValue === 0 ? 0 : ((latestValue - previousValue) / previousValue * 100).toFixed(1)
  const monthly环比 = avgLastMonth === 0 ? 0 : ((avgThisMonth - avgLastMonth) / avgLastMonth * 100).toFixed(1)
  
  return {
    daily环比,
    monthly环比,
    daily当前值: latestValue,
    monthly当前值: avgThisMonth.toFixed(1)
  }
})

const goBack = () => {
  localStorage.removeItem('customerData_' + route.params.id)
  router.push('/customer')
}

const deleteDailyData = async (index) => {
  try {
    const dailyDataToDelete = sortedDailyData.value[index]
    const newDailyData = customer.value.dailyData.filter(d => d.date !== dailyDataToDelete.date)
    
    const calculatedStatus = calculateHealthStatus(newDailyData)
    
    const { error } = await supabase
      .from('customers')
      .update({
        daily_data: newDailyData,
        health_status: calculatedStatus,
        has_order: newDailyData.some(d => (d.items['工单量'] || 0) > 0)
      })
      .eq('id', customer.value.id)
    
    if (error) throw error
    
    customer.value.dailyData = newDailyData
    customer.value.healthStatus = calculatedStatus
    updateChart()
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

const updateChart = () => {
  if (!chart.value || !customer.value) return

  const filteredData = customer.value.dailyData || []
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  let dateLimit = sortedData.length
  if (timeRange.value === '7d') {
    dateLimit = 7
  } else if (timeRange.value === '30d') {
    dateLimit = 30
  } else if (timeRange.value === '1y') {
    dateLimit = 365
  }
  
  const displayData = sortedData.slice(-dateLimit)
  const dates = displayData.map(item => item.date)
  const values = displayData.map(item => item.items[dataType.value] || 0)

  const currentDataType = dataType.value
  const unit = currentDataType === '工单量' ? '单' : '次'
  
  chart.value.setOption({
    title: {
      text: `${currentDataType}趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      show: true,
      confine: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: currentDataType,
      data: values,
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#667eea'
      },
      symbol: 'circle',
      symbolSize: 8,
      showSymbol: true,
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(102, 126, 234, 0.5)',
          shadowBlur: 10
        }
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
        ])
      }
    }]
  })
}


watch(() => [dataType.value, timeRange.value, dateRange.value], () => {
  updateChart()
})
</script>

<style scoped>
.customer-detail {
  padding: 20px;
}

.customer-info {
  margin: 20px 0;
}

.customer-info h2 {
  margin-bottom: 20px;
  color: #333;
}

.data-section {
  margin-top: 30px;
}

.chart-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-container {
  height: 400px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart {
  width: 100%;
  height: 100%;
}

.comparison-section {
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comparison-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.detail-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-section h3 {
  margin-bottom: 15px;
  color: #333;
}
</style>