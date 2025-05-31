<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑个人信息' : '添加个人信息'"
    width="900px"
    @close="handleClose"
    :append-to-body="true"
    top="5vh"
    class="person-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <!-- 基本信息分组 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <h4><el-icon><User /></el-icon> 基本信息</h4>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number 
                v-model="form.age" 
                :min="16" 
                :max="100" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%" :teleported="true">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历" prop="education_level">
              <el-select v-model="form.education_level" placeholder="请选择学历" style="width: 100%" :teleported="true">
                <el-option label="无" value="无" />
                <el-option label="小学" value="小学" />
                <el-option label="初中" value="初中" />
                <el-option label="高中" value="高中" />
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所在地区" prop="address">
              <el-input v-model="form.address" placeholder="请输入所在地区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="就业状态" prop="employment_status">
              <el-select v-model="form.employment_status" placeholder="请选择就业状态" style="width: 100%" :teleported="true">
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="政治面貌" prop="political_status">
              <el-select v-model="form.political_status" placeholder="请选择政治面貌" style="width: 100%" :teleported="true">
                <el-option label="群众" value="群众" />
                <el-option label="团员" value="团员" />
                <el-option label="党员" value="党员" />
                <el-option label="民主党派" value="民主党派" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 农村特色信息分组 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <h4><el-icon><House /></el-icon> 农村特色信息</h4>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="从事农业年限" prop="farming_years">
              <el-input-number 
                v-model="form.farming_years" 
                :min="0" 
                :max="50" 
                style="width: 100%"
                placeholder="请输入从业年限"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="种植规模(亩)" prop="planting_scale">
              <el-input-number 
                v-model="form.planting_scale" 
                :min="0" 
                :precision="1"
                style="width: 100%"
                placeholder="请输入种植规模"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主要作物" prop="main_crops">
          <el-select 
            v-model="form.main_crops" 
            multiple 
            placeholder="请选择主要作物"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="小麦" value="小麦" />
            <el-option label="玉米" value="玉米" />
            <el-option label="大豆" value="大豆" />
            <el-option label="水稻" value="水稻" />
            <el-option label="苹果" value="苹果" />
            <el-option label="大樱桃" value="大樱桃" />
            <el-option label="蔬菜大棚" value="蔬菜大棚" />
            <el-option label="花生" value="花生" />
            <el-option label="棉花" value="棉花" />
            <el-option label="葡萄" value="葡萄" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="养殖类型" prop="breeding_types">
          <el-select 
            v-model="form.breeding_types" 
            multiple 
            placeholder="请选择养殖类型"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="生猪" value="生猪" />
            <el-option label="土鸡" value="土鸡" />
            <el-option label="奶牛" value="奶牛" />
            <el-option label="山羊" value="山羊" />
            <el-option label="肉牛" value="肉牛" />
            <el-option label="鸭子" value="鸭子" />
            <el-option label="鹅" value="鹅" />
            <el-option label="兔子" value="兔子" />
            <el-option label="水产养殖" value="水产养殖" />
            <el-option label="蜜蜂" value="蜜蜂" />
          </el-select>
        </el-form-item>

        <el-form-item label="合作意愿" prop="cooperation_willingness">
          <el-select 
            v-model="form.cooperation_willingness" 
            multiple 
            placeholder="请选择合作意愿"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="合作社" value="合作社" />
            <el-option label="技术服务" value="技术服务" />
            <el-option label="技术合作" value="技术合作" />
            <el-option label="销售合作" value="销售合作" />
            <el-option label="电商合作" value="电商合作" />
            <el-option label="品牌推广" value="品牌推广" />
            <el-option label="技术培训" value="技术培训" />
            <el-option label="项目合作" value="项目合作" />
            <el-option label="资金合作" value="资金合作" />
          </el-select>
        </el-form-item>

        <el-form-item label="发展方向" prop="development_direction">
          <el-select 
            v-model="form.development_direction" 
            multiple 
            placeholder="请选择发展方向"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="果品深加工" value="果品深加工" />
            <el-option label="农产品电商" value="农产品电商" />
            <el-option label="现代农业技术" value="现代农业技术" />
            <el-option label="有机农业" value="有机农业" />
            <el-option label="农业观光" value="农业观光" />
            <el-option label="农业机械化" value="农业机械化" />
            <el-option label="种子培育" value="种子培育" />
            <el-option label="农产品加工" value="农产品加工" />
          </el-select>
        </el-form-item>

        <el-form-item label="可用时间" prop="available_time">
          <el-select 
            v-model="form.available_time" 
            multiple 
            placeholder="请选择可用时间"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="春季" value="春季" />
            <el-option label="夏季" value="夏季" />
            <el-option label="秋季" value="秋季" />
            <el-option label="冬季" value="冬季" />
            <el-option label="全年" value="全年" />
            <el-option label="农闲时" value="农闲时" />
            <el-option label="周末" value="周末" />
            <el-option label="节假日" value="节假日" />
          </el-select>
        </el-form-item>
      </el-card>

      <!-- 技能专长分组 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <h4><el-icon><Trophy /></el-icon> 技能专长</h4>
        </template>
        
        <div class="skills-container">
          <div class="skills-header">
            <el-row :gutter="10">
              <el-col :span="6">
                <label class="skill-label">技能分类</label>
              </el-col>
              <el-col :span="6">
                <label class="skill-label">技能名称</label>
              </el-col>
              <el-col :span="5">
                <label class="skill-label">熟练程度</label>
              </el-col>
              <el-col :span="5">
                <label class="skill-label">从业年限</label>
              </el-col>
              <el-col :span="2">
                <label class="skill-label">操作</label>
              </el-col>
            </el-row>
          </div>
          <div v-for="(skill, index) in skillsList" :key="index" class="skill-item">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item :prop="`skills.${index}.category`" label-width="0">
                  <el-select 
                    v-model="skill.category" 
                    placeholder="请选择技能分类"
                    style="width: 100%" 
                    :teleported="true"
                  >
                    <el-option label="农业种植" value="农业种植" />
                    <el-option label="畜牧养殖" value="畜牧养殖" />
                    <el-option label="农业机械" value="农业机械" />
                    <el-option label="营销技能" value="营销技能" />
                    <el-option label="管理能力" value="管理能力" />
                    <el-option label="加工技术" value="加工技术" />
                    <el-option label="电子商务" value="电子商务" />
                    <el-option label="其他技能" value="其他技能" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :prop="`skills.${index}.name`" label-width="0">
                  <el-input 
                    v-model="skill.name" 
                    placeholder="如：玉米种植、养鸡技术"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item :prop="`skills.${index}.proficiency`" label-width="0">
                  <el-select 
                    v-model="skill.proficiency" 
                    placeholder="请选择熟练度"
                    style="width: 100%" 
                    :teleported="true"
                  >
                    <el-option label="初级(1级)" :value="1" />
                    <el-option label="入门(2级)" :value="2" />
                    <el-option label="熟练(3级)" :value="3" />
                    <el-option label="精通(4级)" :value="4" />
                    <el-option label="专家(5级)" :value="5" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item :prop="`skills.${index}.experience_years`" label-width="0">
                  <el-input-number 
                    v-model="skill.experience_years" 
                    :min="0" 
                    :max="50"
                    placeholder="年"
                    style="width: 100%"
                    controls-position="right"
                  />
                  <div class="form-tip">从事该技能的年数</div>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <el-button 
                  type="danger" 
                  circle 
                  size="small" 
                  @click="removeSkill(index)"
                  :disabled="skillsList.length === 1"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" size="small" @click="addSkill" style="margin-top: 10px;">
            <el-icon><Plus /></el-icon> 添加技能
          </el-button>
        </div>
      </el-card>

      <!-- 合作意向分组 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <h4><el-icon><Connection /></el-icon> 合作意向</h4>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合作类型" prop="cooperation_type">
              <el-select 
                v-model="form.cooperation_type" 
                placeholder="请选择合作类型"
                style="width: 100%" 
                :teleported="true"
              >
                <el-option label="技术合作" value="技术合作" />
                <el-option label="销售合作" value="销售合作" />
                <el-option label="项目投资" value="项目投资" />
                <el-option label="合作社加入" value="合作社加入" />
                <el-option label="培训服务" value="培训服务" />
                <el-option label="设备租赁" value="设备租赁" />
                <el-option label="土地流转" value="土地流转" />
                <el-option label="品牌合作" value="品牌合作" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="偏好规模" prop="preferred_scale">
              <el-select 
                v-model="form.preferred_scale" 
                placeholder="请选择偏好规模"
                style="width: 100%" 
                :teleported="true"
              >
                <el-option label="小规模(1-10亩)" value="小规模" />
                <el-option label="中等规模(10-50亩)" value="中等规模" />
                <el-option label="大规模(50-200亩)" value="大规模" />
                <el-option label="超大规模(200亩以上)" value="超大规模" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="投资能力(万元)" prop="investment_capacity">
              <el-input-number 
                v-model="form.investment_capacity" 
                :min="0" 
                :precision="1"
                style="width: 100%"
                placeholder="请输入投资能力"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间可用性" prop="time_availability">
              <el-select 
                v-model="form.time_availability" 
                placeholder="请选择时间可用性"
                style="width: 100%" 
                :teleported="true"
              >
                <el-option label="全职" value="全职" />
                <el-option label="兼职" value="兼职" />
                <el-option label="季节性" value="季节性" />
                <el-option label="周末" value="周末" />
                <el-option label="农闲时" value="农闲时" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="联系偏好" prop="contact_preference">
          <el-select 
            v-model="form.contact_preference" 
            placeholder="请选择联系偏好"
            style="width: 100%" 
            :teleported="true"
          >
            <el-option label="电话联系" value="电话联系" />
            <el-option label="微信联系" value="微信联系" />
            <el-option label="邮件联系" value="邮件联系" />
            <el-option label="上门拜访" value="上门拜访" />
            <el-option label="网络沟通" value="网络沟通" />
          </el-select>
        </el-form-item>
      </el-card>

      <!-- 其他信息 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <h4><el-icon><Document /></el-icon> 其他信息</h4>
        </template>
        
        <el-form-item label="工作经验" prop="experience">
          <el-input
            v-model="form.experience"
            type="textarea"
            :rows="4"
            placeholder="请描述您的工作经验和专业背景"
          />
        </el-form-item>
      </el-card>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, User, House, Trophy, Connection, Document } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

export default {
  name: 'PersonFormDialog',
  components: {
    User, House, Trophy, Connection, Document
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    person: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    isUserMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const formRef = ref(null)
    const submitting = ref(false)
    
    // 技能列表数组，用于管理动态技能输入
    const skillsList = ref([{
      category: '',
      name: '',
      proficiency: null,
      experience_years: null
    }])
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    // 表单数据
    const form = reactive({
      // 基本信息
      name: '',
      age: null,
      gender: '',
      education_level: '',
      phone: '',
      email: '',
      address: '',
      employment_status: '',
      political_status: '',
      
      // 农村特色信息
      farming_years: null,
      planting_scale: null,
      main_crops: [],
      breeding_types: [],
      cooperation_willingness: [],
      development_direction: [],
      available_time: [],
      
      // 合作意向
      cooperation_type: '',
      preferred_scale: '',
      investment_capacity: null,
      time_availability: '',
      contact_preference: '',
      
      // 其他信息
      experience: ''
    })
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度应在2-10个字符', trigger: 'blur' }
      ],
      age: [
        { required: true, message: '请输入年龄', trigger: 'blur' },
        { type: 'number', min: 16, max: 100, message: '年龄应在16-100岁之间', trigger: 'blur' }
      ],
      gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
      ],
      education_level: [
        { required: true, message: '请选择学历', trigger: 'change' }
      ],
      phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      address: [
        { required: true, message: '请输入所在地区', trigger: 'blur' }
      ],
      employment_status: [
        { required: true, message: '请选择就业状态', trigger: 'change' }
      ],
      political_status: [
        { required: true, message: '请选择政治面貌', trigger: 'change' }
      ],
      experience: [
        { max: 500, message: '工作经验描述不超过500字符', trigger: 'blur' }
      ]
    }
    
    // 添加技能
    const addSkill = () => {
      skillsList.value.push({
        category: '',
        name: '',
        proficiency: null,
        experience_years: null
      })
    }
    
    // 删除技能
    const removeSkill = (index) => {
      if (skillsList.value.length > 1) {
        skillsList.value.splice(index, 1)
      }
    }
    
    // 从person数据解析技能
    const parseSkillsFromPerson = (person) => {
      console.log('parseSkillsFromPerson 收到的数据:', person)
      
      if (!person) {
        console.log('person为空，返回默认技能')
        return [{
          category: '',
          name: '',
          proficiency: null,
          experience_years: null
        }]
      }
      
      try {
        let skills = null
        
        console.log('person.skills:', person.skills)
        console.log('person.skills 类型:', typeof person.skills)
        
        // 如果数据结构是嵌套的（来自详细API）
        if (person.skills && Array.isArray(person.skills)) {
          skills = person.skills
          console.log('使用数组形式的skills:', skills)
        } else if (person.skills && typeof person.skills === 'string') {
          // 如果skills是JSON字符串，解析它
          skills = JSON.parse(person.skills)
          console.log('解析JSON字符串后的skills:', skills)
        }
        
        if (Array.isArray(skills) && skills.length > 0) {
          const parsedSkills = skills.map(skill => {
            console.log('处理单个技能:', skill)
            return {
              category: skill.skill_category || skill.category || '',
              name: skill.skill_name || skill.name || '',
              proficiency: skill.proficiency_level || skill.proficiency || null,
              experience_years: skill.experience_years || null
            }
          })
          console.log('最终解析的技能列表:', parsedSkills)
          return parsedSkills
        }
      } catch (error) {
        console.warn('解析技能数据失败:', error)
      }
      
      console.log('返回默认空技能')
      return [{
        category: '',
        name: '',
        proficiency: null,
        experience_years: null
      }]
    }
    
    // 从person数据解析农村特色信息
    const parseRuralDataFromPerson = (person) => {
      if (!person) return {}
      
      const parseJSONField = (field) => {
        try {
          return field ? (typeof field === 'string' ? JSON.parse(field) : field) : []
        } catch {
          return []
        }
      }
      
      // 如果数据结构是嵌套的（来自详细API）
      if (person.ruralProfile) {
        const ruralProfile = person.ruralProfile
        return {
          main_crops: parseJSONField(ruralProfile.main_crops),
          breeding_types: parseJSONField(ruralProfile.breeding_types),
          cooperation_willingness: parseJSONField(ruralProfile.cooperation_willingness),
          development_direction: parseJSONField(ruralProfile.development_direction),
          available_time: parseJSONField(ruralProfile.available_time)
        }
      }
      
      // 如果数据结构是扁平的（来自基本API）
      return {
        main_crops: parseJSONField(person.main_crops),
        breeding_types: parseJSONField(person.breeding_types),
        cooperation_willingness: parseJSONField(person.cooperation_willingness),
        development_direction: parseJSONField(person.development_direction),
        available_time: parseJSONField(person.available_time)
      }
    }
    
    // 监听person属性变化，用于编辑模式
    watch(() => props.person, (newPerson) => {
      if (newPerson && props.isEdit) {
        const ruralData = parseRuralDataFromPerson(newPerson)
        
        // 获取农村特色信息（支持嵌套和扁平结构）
        const ruralProfile = newPerson.ruralProfile || newPerson
        const cooperation = newPerson.cooperation || newPerson
        
        Object.assign(form, {
          // 基本信息
          name: newPerson.name || '',
          age: newPerson.age || null,
          gender: newPerson.gender || '',
          education_level: newPerson.education_level || '',
          phone: newPerson.phone || '',
          email: newPerson.email || '',
          address: newPerson.address || '',
          employment_status: newPerson.employment_status || '',
          political_status: newPerson.political_status || '',
          
          // 农村特色信息
          farming_years: ruralProfile.farming_years || null,
          planting_scale: ruralProfile.planting_scale || null,
          main_crops: ruralData.main_crops,
          breeding_types: ruralData.breeding_types,
          cooperation_willingness: ruralData.cooperation_willingness,
          development_direction: ruralData.development_direction,
          available_time: ruralData.available_time,
          
          // 合作意向
          cooperation_type: cooperation.cooperation_type || '',
          preferred_scale: cooperation.preferred_scale || '',
          investment_capacity: cooperation.investment_capacity || null,
          time_availability: cooperation.time_availability || '',
          contact_preference: cooperation.contact_preference || '',
          
          // 其他信息
          experience: newPerson.experience || ''
        })
        
        // 解析技能数据
        const parsedSkills = parseSkillsFromPerson(newPerson)
        
        // 清空现有技能列表
        skillsList.value.splice(0, skillsList.value.length)
        
        // 添加解析后的技能
        parsedSkills.forEach(skill => {
          skillsList.value.push(skill)
        })
      }
    }, { immediate: true })
    
    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        // 基本信息
        name: '',
        age: null,
        gender: '',
        education_level: '',
        phone: '',
        email: '',
        address: '',
        employment_status: '',
        political_status: '',
        
        // 农村特色信息
        farming_years: null,
        planting_scale: null,
        main_crops: [],
        breeding_types: [],
        cooperation_willingness: [],
        development_direction: [],
        available_time: [],
        
        // 合作意向
        cooperation_type: '',
        preferred_scale: '',
        investment_capacity: null,
        time_availability: '',
        contact_preference: '',
        
        // 其他信息
        experience: ''
      })
      
      skillsList.value = [{
        category: '',
        name: '',
        proficiency: null,
        experience_years: null
      }]
      
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    }
    
    // 关闭对话框
    const handleClose = () => {
      visible.value = false
      if (!props.isEdit) {
        resetForm()
      }
    }
    
    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        const valid = await formRef.value.validate()
        if (!valid) return
        
        submitting.value = true
        
        // 准备提交的数据
        const formData = { ...form }
        
        // 处理技能数据
        const validSkills = skillsList.value.filter(skill => 
          skill.category && skill.name && skill.proficiency !== null && skill.experience_years !== null
        )
        
        // 准备基本人员信息
        const personData = {
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          education_level: formData.education_level,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          employment_status: formData.employment_status,
          political_status: formData.political_status,
          experience: formData.experience
        }
        
        // 准备农村特色信息
        const ruralProfileData = {
          farming_years: formData.farming_years,
          planting_scale: formData.planting_scale,
          main_crops: JSON.stringify(formData.main_crops),
          breeding_types: JSON.stringify(formData.breeding_types),
          cooperation_willingness: JSON.stringify(formData.cooperation_willingness),
          development_direction: JSON.stringify(formData.development_direction),
          available_time: JSON.stringify(formData.available_time)
        }
        
        // 准备合作意向信息
        const cooperationData = {
          cooperation_type: formData.cooperation_type,
          preferred_scale: formData.preferred_scale,
          investment_capacity: formData.investment_capacity,
          time_availability: formData.time_availability,
          contact_preference: formData.contact_preference
        }
        
        let response
        if (props.isEdit && props.person) {
          // 编辑模式
          const updateData = {
            person: personData,
            ruralProfile: ruralProfileData,
            cooperation: cooperationData,
            skills: validSkills
          }
          
          response = await axios.put(`/api/persons/${props.person.id}/comprehensive`, updateData)
          ElMessage.success('信息更新成功')
          console.log('✅ 更新人员综合信息成功:', response.data)
        } else {
          // 添加模式
          const createData = {
            person: personData,
            ruralProfile: ruralProfileData,
            cooperation: cooperationData,
            skills: validSkills
          }
          
          response = await axios.post('/api/persons/comprehensive', createData)
          ElMessage.success('信息添加成功')
          console.log('✅ 添加人员综合信息成功:', response.data)
          
          // 如果是用户模式，需要关联到用户账号
          if (props.isUserMode && response.data.data?.id) {
            try {
              await authStore.linkPersonToUser(response.data.data.id)
              console.log('✅ 用户关联人员信息成功')
            } catch (error) {
              console.error('❌ 用户关联人员信息失败:', error)
              // 不影响主流程，只是关联失败
            }
          }
        }
        
        emit('saved')
        handleClose()
        
      } catch (error) {
        console.error('❌ 保存失败:', error)
        ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
      } finally {
        submitting.value = false
      }
    }
    
    return {
      visible,
      formRef,
      form,
      rules,
      submitting,
      skillsList,
      addSkill,
      removeSkill,
      handleClose,
      handleSubmit,
      Delete,
      Plus
    }
  }
}
</script>

<style scoped>
/* 对话框样式 - 确保按钮始终可见 */
:deep(.person-form-dialog) {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

:deep(.person-form-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  max-height: calc(90vh - 160px); /* 增加预留空间给按钮区域 */
  padding-bottom: 20px;
}

:deep(.person-form-dialog .el-dialog__footer) {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e4e7ed;
  padding: 15px 20px;
  margin: 0 -20px -20px -20px;
  z-index: 100; /* 提高层级确保在最上层 */
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1); /* 添加阴影增强视觉效果 */
  flex-shrink: 0; /* 防止按钮区域被压缩 */
}

/* 确保对话框容器使用flex布局 */
:deep(.person-form-dialog .el-dialog) {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

:deep(.person-form-dialog .el-dialog__header) {
  flex-shrink: 0; /* 防止头部被压缩 */
}

.form-section {
  margin-bottom: 20px;
}

.form-section .el-card__header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.form-section h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.skills-container {
  width: 100%;
}

.skills-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.skill-label {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
  display: block;
  text-align: center;
}

.skill-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
