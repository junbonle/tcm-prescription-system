<template>
  <div class="statistics-page">
    <div class="header">
      <h2>统计报表</h2>
    </div>
    
    <!-- 时间筛选 -->
    <div class="date-filter">
      <button 
        v-for="period in periods" 
        :key="period.value"
        class="filter-btn"
        :class="{ active: selectedPeriod === period.value }"
        @click="selectPeriod(period.value)"
      >
        {{ period.label }}
      </button>
    </div>
    
    <!-- 自定义日期 -->
    <div v-if="selectedPeriod === 'custom'" class="custom-date">
      <input type="date" v-model="startDate" class="form-input">
      <span>至</span>
      <input type="date" v-model="endDate" class="form-input">
      <button class="btn btn-primary btn-sm" @click="loadStatistics">查询</button>
    </div>
    
    <!-- 核心指标 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">¥{{ stats.total.toFixed(2) }}</div>
        <div class="stat-label">营收总额</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">¥{{ stats.profit.toFixed(2) }}</div>
        <div class="stat-label">毛利润</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">{{ stats.count }}</div>
        <div class="stat-label">处方数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-value">¥{{ stats.count ? (stats.total / stats.count).toFixed(2) : '0.00' }}</div>
        <div class="stat-label">客单价</div>
      </div>
    </div>
    
    <!-- 利润率 -->
    <div class="profit-rate" v-if="stats.total > 0">
      <div class="rate-label">利润率</div>
      <div class="rate-bar">
        <div class="rate-fill" :style="{ width: profitRate + '%' }"></div>
      </div>
      <div class="rate-value">{{ profitRate }}%</div>
    </div>
    
    <!-- 热门药材 TOP10 -->
    <div class="section">
      <h3>热门药材 TOP10</h3>
      <div v-if="stats.topHerbs.length === 0" class="empty">
        暂无数据
      </div>
      <div v-else class="herb-rank">
        <div 
          v-for="(herb, index) in stats.topHerbs" 
          :key="herb.name"
          class="rank-item"
        >
          <div class="rank-num" :class="{ top: index < 3 }">{{ index + 1 }}</div>
          <div class="rank-info">
            <div class="name">{{ herb.name }}</div>
            <div class="meta">使用 {{ herb.count }} 次 · 共 {{ herb.totalDosage }}g</div>
          </div>
          <div class="rank-bar">
            <div class="bar-fill" :style="{ width: getHerbPercent(herb.count) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 趋势图表（简化版） -->
    <div class="section">
      <h3>营收趋势</h3>
      <div class="trend-chart" ref="trendChartRef">
        <div v-if="trendData.length === 0" class="empty">
          暂无数据
        </div>
        <div v-else class="chart-bars">
          <div 
            v-for="(item, index) in trendData" 
            :key="index"
            class="bar-item"
          >
            <div class="bar-wrapper">
              <div 
                class="bar" 
                :style="{ height: getTrendPercent(item.amount) + '%' }"
              ></div>
            </div>
            <div class="bar-label">{{ item.label }}</div>
            <div class="bar-value">¥{{ item.amount.toFixed(0) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePrescriptionStore } from '../stores/prescriptions'
import dayjs from 'dayjs'

const prescriptionStore = usePrescriptionStore()

const trendChartRef = ref(null)

const selectedPeriod = ref('week')
const startDate = ref(dayjs().startOf('week').format('YYYY-MM-DD'))
const endDate = ref(dayjs().endOf('week').format('YYYY-MM-DD'))

const stats = ref({
  total: 0,
  profit: 0,
  count: 0,
  topHerbs: []
})

const trendData = ref([])

const periods = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义', value: 'custom' }
]

const profitRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.profit / stats.value.total) * 100)
})

const selectPeriod = (period) => {
  selectedPeriod.value = period
  const now = dayjs()
  
  switch (period) {
    case 'today':
      startDate.value = now.format('YYYY-MM-DD')
      endDate.value = now.format('YYYY-MM-DD')
      break
    case 'week':
      // 当前周的周一至周日
      startDate.value = now.startOf('week').format('YYYY-MM-DD') // 周一
      endDate.value = now.endOf('week').format('YYYY-MM-DD') // 周日
      break
    case 'month':
      // 当月1号至最后一天
      startDate.value = now.startOf('month').format('YYYY-MM-DD')
      endDate.value = now.endOf('month').format('YYYY-MM-DD')
      break
  }
  
  if (period !== 'custom') {
    loadStatistics()
  }
}

const loadStatistics = () => {
  const start = dayjs(startDate.value).startOf('day').toDate()
  const end = dayjs(endDate.value).endOf('day').toDate()
  
  stats.value = prescriptionStore.getStatistics(start, end)
  
  // 生成趋势数据
  generateTrendData(start, end)
}

const generateTrendData = (start, end) => {
  const now = dayjs()
  // 不超过今天
  const effectiveEnd = dayjs(end).isAfter(now) ? now : dayjs(end)
  const days = effectiveEnd.diff(dayjs(start), 'day') + 1
  const data = []
  
  // 按天聚合
  for (let i = 0; i < days; i++) {
    const date = dayjs(start).add(i, 'day')
    // 跳过超过今天的日期
    if (date.isAfter(effectiveEnd)) break
    
    const dayPrescriptions = prescriptionStore.filterByDate(
      date.startOf('day').toDate(),
      date.endOf('day').toDate()
    )
    
    const amount = dayPrescriptions.reduce((sum, p) => sum + ((p.finalTotal || 0) * (p.dosage || 1)), 0)
    
    data.push({
      label: date.format('MM/DD'),
      amount
    })
  }
  
  trendData.value = data
  
  // 自动滚动到最右侧
  nextTick(() => {
    if (trendChartRef.value) {
      trendChartRef.value.scrollLeft = trendChartRef.value.scrollWidth
    }
  })
}

const getHerbPercent = (count) => {
  if (stats.value.topHerbs.length === 0) return 0
  const max = stats.value.topHerbs[0].count
  return (count / max) * 100
}

const getTrendPercent = (amount) => {
  const max = Math.max(...trendData.value.map(d => d.amount), 1)
  return (amount / max) * 100
}

watch(() => prescriptionStore.prescriptions, () => {
  loadStatistics()
}, { deep: true })

onMounted(() => {
  prescriptionStore.loadPrescriptions().then(() => {
    loadStatistics()
  })
})
</script>

<style scoped>
.statistics-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  margin-bottom: 16px;
}

.header h2 {
  font-size: 20px;
}

.date-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: white;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.custom-date {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.custom-date .form-input {
  flex: 1;
  min-width: 120px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.profit-rate {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.rate-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.rate-bar {
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rate-value {
  text-align: right;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
  margin-top: 8px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.herb-rank {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rank-num.top {
  background: var(--primary);
  color: white;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-info .name {
  font-weight: 500;
  margin-bottom: 2px;
}

.rank-info .meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.rank-bar {
  width: 60px;
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.trend-chart {
  overflow-x: auto;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-width: min-content;
  padding-bottom: 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
}

.bar-wrapper {
  height: 120px;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 24px;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  min-height: 4px;
}

.bar-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 4px;
  white-space: nowrap;
}

.bar-value {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.empty {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}
</style>