<template>
  <div class="talent-detail-view">
    <el-row :gutter="20">
      <!-- 左侧：基本信息 -->
      <el-col :span="12">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          
          <div class="info-grid">
            <div class="info-item">
              <label>姓名：</label>
              <span>{{ personData.name || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>性别：</label>
              <span>{{ personData.gender || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>年龄：</label>
              <span>{{ personData.age || '未知' }}岁</span>
            </div>
            <div class="info-item">
              <label>手机号：</label>
              <span>{{ personData.phone || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ personData.email || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>身份证号：</label>
              <span>{{ personData.id_card || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>户籍地址：</label>
              <span>{{ personData.address || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>现居地址：</label>
              <span>{{ personData.current_address || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>教育水平：</label>
              <span>{{ personData.education_level || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>政治面貌：</label>
              <span>{{ personData.political_status || '未知' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：农村特色信息 -->
      <el-col :span="12">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Location /></el-icon>
              <span>农村特色信息</span>
            </div>
          </template>
          
          <div class="info-grid" v-if="ruralProfile">
            <div class="info-item">
              <label>从事农业年限：</label>
              <span>{{ ruralProfile.farming_years || '未知' }}年</span>
            </div>
            <div class="info-item">
              <label>主要农作物：</label>
              <div v-if="ruralProfile.main_crops" class="crops-display">
                <el-tag 
                  v-for="crop in getJSONArray(ruralProfile.main_crops)" 
                  :key="crop"
                  size="small"
                  style="margin-right: 6px; margin-bottom: 4px;">
                  {{ crop }}
                </el-tag>
              </div>
              <span v-else>未知</span>
            </div>
            <div class="info-item">
              <label>种植规模：</label>
              <span>{{ ruralProfile.planting_scale || '未知' }}亩</span>
            </div>
            <div class="info-item">
              <label>养殖类型：</label>
              <div v-if="ruralProfile.breeding_types" class="breeding-display">
                <el-tag 
                  v-for="type in getJSONArray(ruralProfile.breeding_types)" 
                  :key="type"
                  size="small"
                  type="warning"
                  style="margin-right: 6px; margin-bottom: 4px;">
                  {{ type }}
                </el-tag>
              </div>
              <span v-else>无</span>
            </div>
            <div class="info-item">
              <label>合作意愿：</label>
              <div v-if="ruralProfile.cooperation_willingness" class="cooperation-display">
                <el-tag 
                  v-for="cooperation in getJSONArray(ruralProfile.cooperation_willingness)" 
                  :key="cooperation"
                  size="small"
                  :type="cooperation === '强烈' ? 'success' : 
                        cooperation === '一般' ? 'warning' : 'info'"
                  style="margin-right: 6px; margin-bottom: 4px;">
                  {{ cooperation }}
                </el-tag>
              </div>
              <span v-else>未知</span>
            </div>
            <div class="info-item">
              <label>发展方向：</label>
              <div v-if="ruralProfile.development_direction" class="direction-display">
                <el-tag 
                  v-for="direction in getJSONArray(ruralProfile.development_direction)" 
                  :key="direction"
                  size="small"
                  type="primary"
                  style="margin-right: 6px; margin-bottom: 4px;">
                  {{ direction }}
                </el-tag>
              </div>
              <span v-else>未知</span>
            </div>
            <div class="info-item">
              <label>空闲时间：</label>
              <div v-if="ruralProfile.available_time" class="time-display">
                <el-tag 
                  v-for="time in getJSONArray(ruralProfile.available_time)" 
                  :key="time"
                  size="small"
                  type="success"
                  style="margin-right: 6px; margin-bottom: 4px;">
                  {{ time }}
                </el-tag>
              </div>
              <span v-else>未知</span>
            </div>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无农村特色信息" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 技能展示 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Trophy /></el-icon>
              <span>技能特长</span>
            </div>
          </template>
          
          <div v-if="skills && skills.length > 0">
            <el-row :gutter="16">
              <el-col :span="8" v-for="skill in skills" :key="skill.id">
                <el-card shadow="hover" class="skill-card">
                  <div class="skill-info">
                    <h4>{{ skill.skill_name }}</h4>
                    <el-tag size="small" class="skill-tag">{{ skill.skill_category }}</el-tag>
                    <div class="skill-details">
                      <div class="skill-item">
                        <span class="label">熟练度：</span>
                        <el-rate v-model="skill.proficiency_level" disabled show-score />
                      </div>
                      <div class="skill-item">
                        <span class="label">经验：</span>
                        <span>{{ skill.experience_years }}年</span>
                      </div>
                      <div class="skill-item" v-if="skill.certification">
                        <span class="label">认证：</span>
                        <span>{{ skill.certification }}</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无技能信息" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 合作意向 -->
    <el-row style="margin-top: 20px;" v-if="cooperationIntentions && cooperationIntentions.length > 0">
      <el-col :span="24">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>合作意向</span>
            </div>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="intention in cooperationIntentions"
              :key="intention.id"
              :timestamp="intention.created_at"
            >
              <el-card>
                <h4>{{ intention.intention_type }}</h4>
                <p>{{ intention.description }}</p>
                <el-tag :type="getIntentionTagType(intention.status)">
                  {{ intention.status }}
                </el-tag>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 培训记录 -->
    <el-row style="margin-top: 20px;" v-if="trainingRecords && trainingRecords.length > 0">
      <el-col :span="24">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Reading /></el-icon>
              <span>培训记录</span>
            </div>
          </template>
          
          <el-table :data="trainingRecords" stripe>
            <el-table-column prop="training_name" label="培训名称" />
            <el-table-column prop="training_type" label="培训类型" />
            <el-table-column prop="training_date" label="培训日期" />
            <el-table-column prop="duration_hours" label="培训时长" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getTrainingTagType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { User, Location, Trophy, Connection, Reading } from '@element-plus/icons-vue'

export default {
  name: 'TalentDetailView',
  components: {
    User,
    Location,
    Trophy,
    Connection,
    Reading
  },
  props: {
    personData: {
      type: Object,
      required: true
    }
  },
  computed: {
    ruralProfile() {
      return this.personData.ruralProfile || this.personData.rural_profile || null
    },
    skills() {
      return this.personData.skills || []
    },
    cooperationIntentions() {
      return this.personData.cooperationIntentions || this.personData.cooperation || []
    },
    trainingRecords() {
      return this.personData.trainingRecords || []
    }
  },
  methods: {
    // 处理JSON数组数据的通用方法
    getJSONArray(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [data];
        } catch (e) {
          // 如果解析失败，按逗号分隔处理（兼容旧数据）
          return data.split(',').map(item => item.trim()).filter(item => item);
        }
      }
      return [data];
    },
    getIntentionTagType(status) {
      switch (status) {
        case '已达成':
          return 'success'
        case '进行中':
          return 'warning'
        case '已取消':
          return 'danger'
        default:
          return 'info'
      }
    },
    getTrainingTagType(status) {
      switch (status) {
        case '已完成':
          return 'success'
        case '进行中':
          return 'warning'
        case '已取消':
          return 'danger'
        default:
          return 'info'
      }
    }
  }
}
</script>

<style scoped>
.talent-detail-view {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #2c3e50;
}

.info-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.info-item label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
  margin-right: 8px;
}

.skill-card {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skill-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
}

.skill-tag {
  margin-bottom: 12px;
}

.skill-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.skill-item .label {
  font-weight: bold;
  color: #606266;
  min-width: 60px;
  margin-right: 8px;
}

.no-data {
  text-align: center;
  padding: 20px;
}

/* 农作物和养殖类型显示样式 */
.crops-display,
.breeding-display,
.cooperation-display,
.direction-display,
.time-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 4px;
}

.el-timeline {
  padding: 0 20px;
}

.el-table {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .skill-card {
    margin-bottom: 12px;
  }
}
</style>
