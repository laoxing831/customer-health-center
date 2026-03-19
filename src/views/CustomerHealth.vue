<template>
  <div class="customer-health">
    <div class="stats-header">
      <div class="stat-item">
        <div class="stat-title">新增客户</div>
        <div class="stat-value">{{ stats.newCustomers }}</div>
      </div>
      <div class="stat-item warning">
        <div class="stat-title">预警客户</div>
        <div class="stat-value">{{ stats.warningCustomers }}</div>
      </div>
      <div class="stat-item danger">
        <div class="stat-title">流失客户</div>
        <div class="stat-value">{{ stats.lostCustomers }}</div>
      </div>
    </div>

    <div class="import-section">
      <el-button type="warning" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增数据
      </el-button>
      <el-button type="info" @click="openBatchAddDialog">
        <el-icon><Plus /></el-icon>
        批量新增数据
      </el-button>
    </div>

    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索企业名、主店铺"
        prefix-icon="Search"
        style="width: 300px; margin-right: 10px"
      />
      <el-select
        v-model="healthStatus"
        placeholder="健康度"
        style="width: 150px; margin-right: 10px"
      >
        <el-option label="全部" value="" />
        <el-option label="正常" value="正常" />
        <el-option label="预警" value="预警" />
        <el-option label="流失" value="流失" />
        <el-option label="其他" value="其他" />
      </el-select>
      <el-select
        v-model="serviceAdvisor"
        placeholder="服务顾问"
        style="width: 150px; margin-right: 10px"
        clearable
      >
        <el-option label="全部" value="" />
        <el-option label="万洁" value="万洁" />
        <el-option label="俊锋" value="俊锋" />
        <el-option label="老邢" value="老邢" />
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>

    <el-table
      :data="filteredCustomers"
      style="width: 100%; margin-top: 20px"
      border
      v-loading="loading"
      element-loading-text="加载中..."
      :row-key="row => row.id"
    >
      <el-table-column prop="companyName" label="企业名" width="150" fixed="left" />
      <el-table-column prop="mainShop" label="主店铺" width="150" fixed="left" />
      <el-table-column prop="healthStatus" label="健康度" width="80">
        <template #default="scope">
          <el-tag
            :type="
              scope.row.healthStatus === '正常'
                ? 'success'
                : scope.row.healthStatus === '预警'
                ? 'warning'
                : 'danger'
            "
          >
            {{ 
              scope.row.healthStatus === '正常'
                ? '正常'
                : scope.row.healthStatus === '预警'
                ? '预警'
                : scope.row.healthStatus === '流失'
                ? '流失'
                : '其他'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="日均环比" width="100">
        <template #default="scope">
          <span :style="{ color: getTrendColor(scope.row.daily环比) }">
            {{ scope.row.daily环比 !== undefined ? scope.row.daily环比 + '%' : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="paymentStatus" label="付费情况" width="100">
        <template #default="scope">
          <el-select
            v-model="scope.row.paymentStatus"
            size="small"
            @change="updateCustomer(scope.row)"
          >
            <el-option label="已付费" value="paid" />
            <el-option label="未付费" value="unpaid" />
            <el-option label="已冻结" value="frozen" />
            <el-option label="已到期" value="expired" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="serviceAdvisor" label="服务顾问" width="100">
        <template #default="scope">
          <el-select
            v-model="scope.row.serviceAdvisor"
            size="small"
            @change="updateCustomer(scope.row)"
          >
            <el-option label="万洁" value="万洁" />
            <el-option label="俊锋" value="俊锋" />
            <el-option label="老邢" value="老邢" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="serviceBusiness" label="服务商务" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="120">
        <template #default="scope">
          <span>{{ scope.row.createTime || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="openTime" label="开通时间" width="130">
        <template #default="scope">
          <span>{{ scope.row.openTime || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="hasOrder" label="是否建单" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.hasOrder ? 'success' : 'info'">
            {{ scope.row.hasOrder ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="200">
        <template #default="scope">
          <el-tooltip
            v-if="scope.row.remark && scope.row.remark.length > 15"
            :content="scope.row.remark"
            placement="top"
            effect="light"
          >
            <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 40px; font-size: 12px;">
              {{ scope.row.remark }}
            </span>
          </el-tooltip>
          <span v-else>{{ scope.row.remark }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="scope">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            <div>
              <el-button
                size="small"
                type="primary"
                @click="viewDetail(scope.row.id)"
              >
                详情
              </el-button>
              <el-button
                size="small"
                type="warning"
                @click="openEditDialog(scope.row)"
              >
                编辑
              </el-button>
            </div>
            <div>
              <el-button
                size="small"
                @click="editRemark(scope.row)"
              >
                备注
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="confirmDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="remarkDialogVisible"
      title="编辑备注"
      width="500px"
    >
      <el-input
        v-model="currentRemark"
        type="textarea"
        rows="4"
        placeholder="请输入备注"
      />
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRemark">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p style="color: #f56c6c; font-size: 16px;">
        <el-icon style="vertical-align: middle; margin-right: 8px;"><WarningFilled /></el-icon>
        确定要删除客户"{{ deleteTarget?.companyName }}"吗？
      </p>
      <p style="color: #909399; font-size: 14px; margin-top: 10px;">此操作不可恢复，请谨慎操作。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteCustomer">确认删除</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="customerDialogVisible"
      :title="isEdit ? '编辑客户' : '新增客户'"
      width="1300px"
    >
      <el-form :model="customerForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="企业名">
              <el-input v-model="customerForm.companyName" placeholder="请输入企业名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主店铺">
              <el-input v-model="customerForm.mainShop" placeholder="请输入主店铺" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付费情况">
              <el-select v-model="customerForm.paymentStatus" placeholder="请选择" style="width: 100%">
                <el-option label="已付费" value="paid" />
                <el-option label="未付费" value="unpaid" />
                <el-option label="已冻结" value="frozen" />
                <el-option label="已到期" value="expired" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="健康度">
              <el-select v-model="customerForm.healthStatus" placeholder="请选择" style="width: 100%">
                <el-option label="正常" value="正常" />
                <el-option label="预警" value="预警" disabled />
                <el-option label="流失" value="流失" />
                <el-option label="其他" value="其他" />
              </el-select>
              <div v-if="isEdit && currentCustomer.value?.healthStatus === '预警'" style="margin-top: 5px; font-size: 12px; color: #E6A23C;">
                当前为预警状态，可手动改为"正常"解除预警
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务商务">
              <el-select v-model="customerForm.serviceBusiness" placeholder="请选择" style="width: 100%">
                <el-option label="三歌" value="三歌" />
                <el-option label="李梦凡" value="李梦凡" />
                <el-option label="小可" value="小可" />
                <el-option label="乐乐" value="乐乐" />
                <el-option label="王海" value="王海" />
                <el-option label="周婷" value="周婷" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务顾问">
              <el-select v-model="customerForm.serviceAdvisor" placeholder="请选择" style="width: 100%">
                <el-option label="万洁" value="万洁" />
                <el-option label="俊锋" value="俊锋" />
                <el-option label="老邢" value="老邢" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-date-picker v-model="customerForm.createTime" type="date" placeholder="请选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开通时间">
              <el-date-picker v-model="customerForm.openTime" type="date" placeholder="请选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否建单">
              <el-switch v-model="customerForm.hasOrder" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="customerForm.remark" type="textarea" rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-divider>每日数据（选填）</el-divider>
        <div style="margin-bottom: 15px; color: #909399; font-size: 12px;">
          每行一条数据，字段用空格或逗号分隔：<br>
          字段顺序：日期 工单量 退换操作量 物流拦截量 打款数 知识创建量 知识使用量
        </div>
        <el-input
          v-model="customerForm.dailyDataText"
          type="textarea"
          :rows="6"
          placeholder="示例：&#10;2024-01-01 10 5 2 3 2 5&#10;2024-01-02 8 4 1 2 1 3"
        />
      </el-form>
      <template #footer>
        <el-button @click="customerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustomer">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAddDialogVisible"
      title="批量新增数据"
      width="800px"
    >
      <el-tabs v-model="batchAddTab">
        <el-tab-pane label="新增客户信息" name="customer">
          <div style="margin-bottom: 15px; color: #606266; font-size: 14px;">
            <p>每行一条数据，字段用空格或逗号分隔：</p>
            <p style="color: #909399; font-size: 12px; margin-top: 5px;">
              字段顺序：企业名 主店铺 健康度 付费情况 服务商务 服务顾问 创建时间 开通时间 备注
            </p>
          </div>
          <el-input
            v-model="batchCustomerText"
            type="textarea"
            :rows="8"
            placeholder="示例：&#10;企业A 店铺A normal paid 万洁 万洁 2024-01-01 2024-01-01 备注信息&#10;企业B 店铺B warning unpaid 俊锋 俊锋 2024-01-02 2024-01-02 其他备注"
          />
        </el-tab-pane>
        <el-tab-pane label="新增每日数据" name="daily">
          <div style="margin-bottom: 15px; color: #606266; font-size: 14px;">
            <p>每行一条数据，字段用空格或逗号分隔：</p>
            <p style="color: #909399; font-size: 12px; margin-top: 5px;">
              格式1（只填工单量）：企业名 工单量<br>
              格式2：企业名 日期 工单量 退换操作量 物流拦截量 打款数 知识创建量 知识使用量<br>
              （日期可省略，默认为前一天，即 T+1 逻辑）
            </p>
          </div>
          <el-input
            v-model="batchDailyText"
            type="textarea"
            :rows="8"
            placeholder="示例（带日期）：&#10;企业A 2024-01-01 10 5 2 3 2 5&#10;企业B 2024-01-01 8 4 1 2 1 3&#10;&#10;示例（省略日期，默认为前一天）：&#10;企业A 10 5 2 3 2 5&#10;企业B 8 4 1 2 1 3"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="batchAddDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatchAdd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, WarningFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import { supabase } from '../lib/supabase'
import emailjs from 'emailjs-com'

const EMAILJS_PUBLIC_KEY = 'NWUlLy82P43bU_iym'
const EMAILJS_SERVICE_ID = 'service_mawaz4j'
const EMAILJS_TEMPLATE_ID = 'template_xoln76m'
const TO_EMAIL = 'xing.kunquan@darcytech.com'

const router = useRouter()
const searchQuery = ref('')
const healthStatus = ref('')
const serviceAdvisor = ref('')
const remarkDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const customerDialogVisible = ref(false)
const batchAddDialogVisible = ref(false)
const batchAddTab = ref('customer')
const batchCustomerText = ref('')
const batchDailyText = ref('')
const isEdit = ref(false)
const currentCustomer = ref(null)
const currentRemark = ref('')
const deleteTarget = ref(null)
const loading = ref(false)

const customerForm = ref({
  companyName: '',
  mainShop: '',
  paymentStatus: '',
  healthStatus: '正常',
  serviceBusiness: '',
  serviceAdvisor: '',
  createTime: '',
  openTime: '',
  remark: '',
  hasOrder: false,
  dailyDataText: ''
})

const customers = ref([])

const fetchCustomers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    customers.value = data.map(item => ({
      id: item.id,
      companyName: item.company_name,
      mainShop: item.main_shop,
      paymentStatus: item.payment_status,
      serviceBusiness: item.service_business,
      serviceAdvisor: item.service_advisor,
      createTime: item.create_time,
      openTime: item.open_time,
      remark: item.remark,
      healthStatus: item.health_status || '正常',
      hasOrder: item.has_order,
      dailyData: item.daily_data || [],
      createdAt: item.created_at,
      daily环比: calculateDailyTrend(item.daily_data || [])
    }))
    
    customers.value.sort((a, b) => {
      if (a.healthStatus === '预警' && b.healthStatus !== '预警') return -1
      if (a.healthStatus !== '预警' && b.healthStatus === '预警') return 1
      const dateA = a.createTime ? new Date(a.createTime) : new Date(0)
      const dateB = b.createTime ? new Date(b.createTime) : new Date(0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})

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

const checkHasOrder = (dailyData) => {
  if (!dailyData || dailyData.length === 0) return false
  
  return dailyData.some(day => {
    const items = day.items || {}
    return (items['工单量'] || 0) > 0
  })
}

const stats = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let newCount = 0
  let warningCount = 0
  let lostCount = 0
  
  customers.value.forEach(customer => {
    const createTime = customer.createTime ? new Date(customer.createTime) : null
    
    if (customer.healthStatus === '正常') {
      if (createTime && createTime >= today) {
        newCount++
      }
    } else if (customer.healthStatus === '预警') {
      warningCount++
    } else if (customer.healthStatus === '流失') {
      lostCount++
    }
  })
  
  return {
    newCustomers: newCount,
    warningCustomers: warningCount,
    lostCustomers: lostCount
  }
})

const filteredCustomers = computed(() => {
  return customers.value.filter(customer => {
    const matchesSearch = !searchQuery.value || 
      customer.companyName.includes(searchQuery.value) ||
      customer.mainShop.includes(searchQuery.value)
    const matchesHealthStatus = !healthStatus.value || customer.healthStatus === healthStatus.value
    const matchesServiceAdvisor = !serviceAdvisor.value || customer.serviceAdvisor === serviceAdvisor.value
    return matchesSearch && matchesHealthStatus && matchesServiceAdvisor
  })
})

const search = () => {
}

const viewDetail = (id) => {
  const customer = customers.value.find(c => c.id === id)
  if (customer) {
    localStorage.setItem('customerData_' + id, JSON.stringify(customer))
  }
  router.push(`/customer/${id}`)
}

const editRemark = (customer) => {
  currentCustomer.value = customer
  currentRemark.value = customer.remark
  remarkDialogVisible.value = true
}

const saveRemark = async () => {
  if (currentCustomer.value) {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ remark: currentRemark.value })
        .eq('id', currentCustomer.value.id)
      
      if (error) throw error
      currentCustomer.value.remark = currentRemark.value
      remarkDialogVisible.value = false
      ElMessage.success('备注保存成功')
      fetchCustomers()
    } catch (error) {
      console.error('保存备注失败:', error)
      ElMessage.error('保存备注失败')
    }
  }
}

const openAddDialog = () => {
  isEdit.value = false
  customerForm.value = {
    companyName: '',
    mainShop: '',
    paymentStatus: '',
    healthStatus: '正常',
    serviceBusiness: '',
    serviceAdvisor: '',
    createTime: '',
    openTime: '',
    remark: '',
    hasOrder: false,
    dailyDataText: ''
  }
  customerDialogVisible.value = true
}

const parseDate = (dateStr) => {
  if (!dateStr) return ''
  if (typeof dateStr !== 'string') return dateStr
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr
}

const openEditDialog = (customer) => {
  isEdit.value = true
  currentCustomer.value = customer
  const sortedDailyData = customer.dailyData 
    ? [...customer.dailyData].sort((a, b) => new Date(a.date) - new Date(b.date))
    : []
  const dailyDataText = sortedDailyData.length > 0
    ? sortedDailyData.map(d => {
        const items = d.items || {}
        return `${d.date} ${items['工单量'] || 0} ${items['退换操作量'] || 0} ${items['物流拦截量'] || 0} ${items['打款数'] || 0} ${items['知识创建量'] || 0} ${items['知识使用量'] || 0}`
      }).join('\n')
    : ''
  customerForm.value = {
    companyName: customer.companyName,
    mainShop: customer.mainShop,
    paymentStatus: customer.paymentStatus,
    healthStatus: customer.healthStatus || '正常',
    serviceBusiness: customer.serviceBusiness || '',
    serviceAdvisor: customer.serviceAdvisor || '',
    createTime: formatDate(customer.createTime),
    openTime: formatDate(customer.openTime),
    remark: customer.remark,
    hasOrder: customer.hasOrder,
    dailyDataText: dailyDataText
  }
  customerDialogVisible.value = true
}

const openBatchAddDialog = () => {
  batchAddTab.value = 'customer'
  batchCustomerText.value = ''
  batchDailyText.value = ''
  batchAddDialogVisible.value = true
}

const saveBatchAdd = async () => {
  if (batchAddTab.value === 'customer') {
    await saveBatchCustomer()
  } else {
    await saveBatchDaily()
  }
}

const saveBatchCustomer = async () => {
  if (!batchCustomerText.value.trim()) {
    ElMessage.warning('请输入客户数据')
    return
  }

  const lines = batchCustomerText.value.trim().split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    ElMessage.warning('请输入客户数据')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '批量导入中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    let successCount = 0
    let updateCount = 0
    let skipCount = 0

    for (const line of lines) {
      const parts = line.trim().split(/[\s,，]+/).filter(p => p.trim())
      if (parts.length < 2) continue

      const companyName = parts[0] || '未命名企业'
      if (isInternalTestCustomer(companyName)) {
        skipCount++
        continue
      }

      const customerData = {
        company_name: parts[0] || '未命名企业',
        main_shop: parts[1] || '',
        health_status: parts[2] || '正常',
        payment_status: parts[3] || 'unpaid',
        service_business: parts[4] || '',
        service_advisor: parts[5] || '',
        create_time: formatDate(parts[6]) || '',
        open_time: formatDate(parts[7]) || '',
        remark: parts[8] || '',
        has_order: false,
        daily_data: []
      }

      const existingCustomer = customers.value.find(c => c.companyName === customerData.company_name)
      
      if (existingCustomer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            main_shop: customerData.main_shop,
            health_status: customerData.health_status,
            payment_status: customerData.payment_status,
            service_business: customerData.service_business,
            service_advisor: customerData.service_advisor,
            create_time: customerData.create_time,
            open_time: customerData.open_time,
            remark: customerData.remark
          })
          .eq('id', existingCustomer.id)
        
        if (!updateError) updateCount++
      } else {
        const { error: insertError } = await supabase
          .from('customers')
          .insert(customerData)
        
        if (!insertError) successCount++
      }
    }

    batchAddDialogVisible.value = false
    fetchCustomers()
    
    if (updateCount > 0 && successCount > 0) {
      ElMessage.success(`成功新增 ${successCount} 条，更新 ${updateCount} 条数据${skipCount > 0 ? `（跳过 ${skipCount} 条内部测试数据）` : ''}`)
    } else if (updateCount > 0) {
      ElMessage.success(`成功更新 ${updateCount} 条数据${skipCount > 0 ? `（跳过 ${skipCount} 条内部测试数据）` : ''}`)
    } else if (successCount > 0) {
      ElMessage.success(`成功新增 ${successCount} 条数据${skipCount > 0 ? `（跳过 ${skipCount} 条内部测试数据）` : ''}`)
    } else if (skipCount > 0) {
      ElMessage.warning(`跳过 ${skipCount} 条内部测试数据`)
    } else {
      ElMessage.warning('未找到匹配的企业，请检查企业名是否正确')
    }
  } catch (error) {
    console.error('批量导入失败:', error)
    ElMessage.error('批量导入失败')
  } finally {
    loading.close()
  }
}

const saveBatchDaily = async () => {
  if (!batchDailyText.value.trim()) {
    ElMessage.warning('请输入每日数据')
    return
  }

  const lines = batchDailyText.value.trim().split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    ElMessage.warning('请输入每日数据')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '批量导入中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    let successCount = 0
    let skipCount = 0
    const notFoundCompanies = []

    for (const line of lines) {
      const parts = line.trim().split(/[\s,，]+/).filter(p => p.trim())
      if (parts.length < 2) continue

      const companyName = parts[0]
      if (isInternalTestCustomer(companyName)) {
        skipCount++
        continue
      }

      const customer = customers.value.find(c => c.companyName === companyName)
      
      if (!customer) {
        if (!notFoundCompanies.includes(companyName)) {
          notFoundCompanies.push(companyName)
        }
        continue
      }

      let date
      let dataStartIndex
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (parts.length === 2) {
        date = yesterdayStr
        dataStartIndex = 1
      } else if (parts.length === 3) {
        date = formatDate(parts[1]) || yesterdayStr
        dataStartIndex = 2
      } else if (parts.length >= 4) {
        date = formatDate(parts[1]) || yesterdayStr
        dataStartIndex = 2
      } else {
        continue
      }

      const dailyItem = {
        date: date,
        items: {
          '工单量': parseInt(parts[dataStartIndex]) || 0,
          '退换操作量': parseInt(parts[dataStartIndex + 1]) || 0,
          '物流拦截量': parseInt(parts[dataStartIndex + 2]) || 0,
          '打款数': parseInt(parts[dataStartIndex + 3]) || 0,
          '知识创建量': parseInt(parts[dataStartIndex + 4]) || 0,
          '知识使用量': parseInt(parts[dataStartIndex + 5]) || 0
        }
      }

      const existingDailyData = customer.dailyData ? JSON.parse(JSON.stringify(customer.dailyData)) : []
      const existingIndex = existingDailyData.findIndex(d => d.date === dailyItem.date)
      if (existingIndex >= 0) {
        existingDailyData[existingIndex] = dailyItem
      } else {
        existingDailyData.push(dailyItem)
      }

      const calculatedStatus = calculateHealthStatus(existingDailyData)
      const oldStatus = customer.healthStatus || '正常'
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          daily_data: existingDailyData,
          health_status: calculatedStatus,
          has_order: existingDailyData.some(d => (d.items['工单量'] || 0) > 0)
        })
        .eq('id', customer.id)
      
      if (!updateError) {
        successCount++
        if (oldStatus !== '预警' && calculatedStatus === '预警') {
          await sendWarningEmail(customer, oldStatus, '预警')
        }
      }
    }

    batchAddDialogVisible.value = false
    fetchCustomers()
    
    if (successCount > 0) {
      ElMessage.success(`成功导入 ${successCount} 条每日数据${skipCount > 0 ? `（跳过 ${skipCount} 条内部测试数据）` : ''}`)
    } else if (skipCount > 0) {
      ElMessage.warning(`跳过 ${skipCount} 条内部测试数据，未找到匹配的企业`)
    } else {
      ElMessage.warning('未找到匹配的企业，请检查企业名是否正确')
    }

    if (notFoundCompanies.length > 0) {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: TO_EMAIL,
            company_name: notFoundCompanies.join('、'),
            main_shop: '',
            service_advisor: '',
            message: `您可能漏录入了新的企业客户，分别为：${notFoundCompanies.join('、')}。请尽快录入系统，避免因跟进不及时带来影响。`
          },
          EMAILJS_PUBLIC_KEY
        )
        ElMessage.warning(`发现 ${notFoundCompanies.length} 个未匹配企业，已发送邮件提醒`)
      } catch (error) {
        console.error('发送邮件失败:', error)
        ElMessage.warning(`发现 ${notFoundCompanies.length} 个未匹配企业，邮件发送失败`)
      }
    }
  } catch (error) {
    console.error('批量导入失败:', error)
    ElMessage.error('批量导入失败')
  } finally {
    loading.close()
  }
}

const addDailyData = () => {
  customerForm.value.dailyData.push({
    date: '',
    items: {
      '工单量': 0,
      '退换操作量': 0,
      '物流拦截量': 0,
      '打款数': 0,
      '知识创建量': 0,
      '知识使用量': 0
    }
  })
}

const removeDailyData = (index) => {
  customerForm.value.dailyData.splice(index, 1)
}

const parseDailyDataText = (text) => {
  if (!text || !text.trim()) return []
  
  const lines = text.trim().split('\n').filter(line => line.trim())
  const result = []
  
  for (const line of lines) {
    const parts = line.trim().split(/[\s,，]+/).filter(p => p.trim())
    if (parts.length < 2) continue
    
    result.push({
      date: formatDate(parts[0]) || '',
      items: {
        '工单量': parseInt(parts[1]) || 0,
        '退换操作量': parseInt(parts[2]) || 0,
        '物流拦截量': parseInt(parts[3]) || 0,
        '打款数': parseInt(parts[4]) || 0,
        '知识创建量': parseInt(parts[5]) || 0,
        '知识使用量': parseInt(parts[6]) || 0
      }
    })
  }
  
  return result
}

const formatDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string') {
    if (date.includes('年')) {
      const match = date.match(/(\d{1,4})年(\d{1,2})月(\d{1,2})日/)
      if (match) {
        const year = match[1].padStart(4, '0')
        const month = match[2].padStart(2, '0')
        const day = match[3].padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    }
    return date
  }
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const isInternalTestCustomer = (companyName) => {
  if (!companyName) return false
  const internalNames = ['刻师傅牛杂店', '语鸽场景搭建账号']
  const isInternal = internalNames.includes(companyName)
  const hasTestKeyword = companyName.includes('测试')
  return isInternal || hasTestKeyword
}

const getTrendColor = (value) => {
  if (value === undefined || value === null || value === '') return '#666'
  const num = parseFloat(value)
  if (num > 0) return '#67c23a'
  if (num < 0) return '#f56c6c'
  return '#666'
}

const calculateDailyTrend = (dailyData) => {
  if (!dailyData || dailyData.length === 0) return undefined
  
  const sortedData = [...dailyData].sort((a, b) => new Date(b.date) - new Date(a.date))
  
  if (sortedData.length < 2) return 0
  
  const latestData = sortedData[0]
  const previousData = sortedData[1]
  
  const latestValue = Object.values(latestData.items || {}).reduce((sum, v) => sum + (v || 0), 0)
  const previousValue = Object.values(previousData.items || {}).reduce((sum, v) => sum + (v || 0), 0)
  
  if (previousValue === 0) return 0
  
  return ((latestValue - previousValue) / previousValue * 100).toFixed(1)
}

const saveCustomer = async () => {
  if (!customerForm.value.companyName) {
    ElMessage.warning('请输入企业名')
    return
  }
  
  const parsedDailyData = parseDailyDataText(customerForm.value.dailyDataText)
  const calculatedHealthStatus = calculateHealthStatus(parsedDailyData)
  const oldHealthStatus = currentCustomer.value?.healthStatus || '正常'
  
  let finalHealthStatus
  if (oldHealthStatus === '预警' && customerForm.value.healthStatus === '正常') {
    finalHealthStatus = '正常'
  } else {
    finalHealthStatus = calculatedHealthStatus
  }
  
  try {
    if (isEdit.value) {
      const { error } = await supabase
        .from('customers')
        .update({
          company_name: customerForm.value.companyName,
          main_shop: customerForm.value.mainShop,
          payment_status: customerForm.value.paymentStatus,
          health_status: finalHealthStatus,
          service_business: customerForm.value.serviceBusiness,
          service_advisor: customerForm.value.serviceAdvisor,
          create_time: formatDate(customerForm.value.createTime),
          open_time: formatDate(customerForm.value.openTime),
          remark: customerForm.value.remark,
          has_order: customerForm.value.hasOrder,
          daily_data: parsedDailyData
        })
        .eq('id', currentCustomer.value.id)
      
      if (error) throw error
      ElMessage.success('客户信息更新成功')
      
      if (oldHealthStatus !== '预警' && calculatedHealthStatus === '预警') {
        const customerData = {
          ...customerForm.value,
          id: currentCustomer.value.id,
          healthStatus: calculatedHealthStatus,
          dailyData: parsedDailyData
        }
        await sendWarningEmail(customerData, oldHealthStatus, '预警')
      }
    } else {
      const { error } = await supabase
        .from('customers')
        .insert({
          company_name: customerForm.value.companyName,
          main_shop: customerForm.value.mainShop,
          payment_status: customerForm.value.paymentStatus,
          health_status: customerForm.value.healthStatus || '正常',
          service_business: customerForm.value.serviceBusiness,
          service_advisor: customerForm.value.serviceAdvisor,
          create_time: formatDate(customerForm.value.createTime),
          open_time: formatDate(customerForm.value.openTime),
          remark: customerForm.value.remark,
          has_order: customerForm.value.hasOrder,
          daily_data: parsedDailyData
        })
      
      if (error) throw error
      ElMessage.success('客户添加成功')
    }
    customerDialogVisible.value = false
    fetchCustomers()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const updateCustomer = async (customer) => {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        payment_status: customer.paymentStatus,
        health_status: customer.healthStatus,
        service_business: customer.serviceBusiness,
        service_advisor: customer.serviceAdvisor,
        open_time: formatDate(customer.openTime),
        has_order: customer.hasOrder
      })
      .eq('id', customer.id)
    
    if (error) throw error
    ElMessage.success('信息更新成功')
    fetchCustomers()
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error('更新失败')
  }
}

const confirmDelete = (customer) => {
  deleteTarget.value = customer
  deleteDialogVisible.value = true
}

const deleteCustomer = async () => {
  if (deleteTarget.value) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', deleteTarget.value.id)
      
      if (error) throw error
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      fetchCustomers()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const sendWarningEmail = async (customer, oldStatus, newStatus) => {
  if (oldStatus !== '预警' && newStatus === '预警') {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: TO_EMAIL,
          company_name: customer.companyName,
          main_shop: customer.mainShop,
          old_status: oldStatus,
          new_status: newStatus,
          service_advisor: customer.serviceAdvisor || '未分配',
          message: `客户"${customer.companyName}"的健康状态从"${oldStatus}"变更为"${newStatus}"，请及时关注！`
        },
        EMAILJS_PUBLIC_KEY
      )
      ElMessage.success('已发送预警邮件通知')
    } catch (error) {
      console.error('发送邮件失败:', error)
    }
  }
}
</script>

<style scoped>
.customer-health {
  padding: 20px;
}

.stats-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-item.warning {
  border-left: 4px solid #e6a23c;
}

.stat-item.danger {
  border-left: 4px solid #f56c6c;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.import-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.daily-data-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
</style>